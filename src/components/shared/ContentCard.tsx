import { Archive, Bookmark, Heart, MessageCircle, MoreVertical, Share2, ShieldAlert, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CardComment {
  id: string;
  text: string;
  author: string;
}

interface ContentCardProps {
  id: string;
  image: string;
  title: string;
  author: string;
  department: string;
  likes: number;
  comments: number;
  index?: number;
  liked?: boolean;
  commentItems?: CardComment[];
  commentsLoading?: boolean;
  isOwner?: boolean;
  isArchived?: boolean;
  isSaved?: boolean;
  verifiedTag?: string | null;
  reactions?: Record<string, number>;
  onLike?: () => Promise<void> | void;
  onShare?: () => Promise<void> | void;
  onLoadComments?: () => Promise<void> | void;
  onAddComment?: (text: string) => Promise<void> | void;
  onArchiveToggle?: () => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  onSaveToggle?: () => Promise<void> | void;
  onReport?: () => Promise<void> | void;
  onReact?: (emoji: string) => Promise<void> | void;
}

export default function ContentCard({
  image,
  title,
  author,
  department,
  likes,
  comments,
  index = 0,
  liked = false,
  commentItems = [],
  commentsLoading = false,
  isOwner = false,
  isArchived = false,
  isSaved = false,
  verifiedTag = null,
  reactions = {},
  onLike,
  onShare,
  onLoadComments,
  onAddComment,
  onArchiveToggle,
  onDelete,
  onSaveToggle,
  onReport,
  onReact,
}: ContentCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const toggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && onLoadComments) await onLoadComments();
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !onAddComment) return;
    await onAddComment(commentText.trim());
    setCommentText("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:shadow-card-hover"
    >
      <div className="group relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="line-clamp-1 font-display text-lg font-semibold text-foreground">{title}</h3>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <span>{author} · {department}</span>
              {verifiedTag ? <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{verifiedTag}</span> : null}
            </p>
          </div>

          {isOwner && (onArchiveToggle || onDelete) ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onArchiveToggle ? (
                  <DropdownMenuItem onClick={onArchiveToggle}>
                    <Archive className="mr-2 h-4 w-4" />
                    {isArchived ? "Unarchive" : "Archive"}
                  </DropdownMenuItem>
                ) : null}
                {onDelete ? (
                  <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                ) : null}
                {onReport ? (
                  <DropdownMenuItem onClick={onReport}>
                    <ShieldAlert className="mr-2 h-4 w-4" /> Report
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        {isArchived ? <p className="mt-1 text-xs text-warning">Archived (only visible to you)</p> : null}

        <div className="mt-3 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onLike} className={liked ? "text-destructive" : ""}>
            <Heart className="mr-1 h-4 w-4" /> {likes}
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleComments}>
            <MessageCircle className="mr-1 h-4 w-4" /> {comments}
          </Button>
          <Button variant="ghost" size="sm" onClick={onShare}>
            <Share2 className="mr-1 h-4 w-4" /> Share
          </Button>
          {onSaveToggle ? (
            <Button variant="ghost" size="sm" onClick={onSaveToggle} className={isSaved ? "text-primary" : ""}>
              <Bookmark className="mr-1 h-4 w-4" /> {isSaved ? "Saved" : "Save"}
            </Button>
          ) : null}
          {onReport ? (
            <Button variant="ghost" size="sm" onClick={onReport}>
              <ShieldAlert className="mr-1 h-4 w-4" /> Report
            </Button>
          ) : null}
        </div>

        {onReact ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {["🔥", "🎉", "💯"].map((emoji) => (
              <Button key={emoji} type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => onReact(emoji)}>
                {emoji} {reactions[emoji] ?? 0}
              </Button>
            ))}
          </div>
        ) : null}

        {showComments ? (
          <div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            {commentsLoading ? (
              <p className="text-xs text-muted-foreground">Loading comments...</p>
            ) : commentItems.length === 0 ? (
              <p className="text-xs text-muted-foreground">No comments yet.</p>
            ) : (
              <div className="max-h-40 space-y-2 overflow-auto pr-1">
                {commentItems.map((c) => (
                  <div key={c.id} className="text-xs">
                    <span className="font-semibold text-foreground">{c.author}: </span>
                    <span className="text-muted-foreground">{c.text}</span>
                  </div>
                ))}
              </div>
            )}

            {onAddComment ? (
              <form onSubmit={submitComment} className="flex gap-2">
                <Input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment" className="h-8 text-xs" />
                <Button size="sm" type="submit" className="h-8">Post</Button>
              </form>
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
