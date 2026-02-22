import { useEffect, useMemo, useRef, useState } from "react";
import SectionHeader from "@/components/shared/SectionHeader";
import ContentCard from "@/components/shared/ContentCard";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

type Photo = {
  id: string;
  user_id: string;
  image_url: string;
  title: string;
  department: string | null;
  likes_count: number;
  comments_count: number;
  is_approved: boolean;
  author_name: string;
  verified_tag: string | null;
};

type PhotoComment = { id: string; text: string; author: string };
type ReactionLedger = Record<string, Record<string, string>>;

const filters = ["All", "Saved", "Computer Science", "Fine Arts", "Engineering", "Business", "Sciences"];

export default function Photography() {
  const [active, setActive] = useState("All");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [likedPhotoIds, setLikedPhotoIds] = useState<Set<string>>(new Set());
  const [commentsMap, setCommentsMap] = useState<Record<string, PhotoComment[]>>({});
  const [commentLoadingMap, setCommentLoadingMap] = useState<Record<string, boolean>>({});
  const [savedPhotoIds, setSavedPhotoIds] = useState<Set<string>>(() => new Set(JSON.parse(localStorage.getItem("saved-photos") ?? "[]")));
  const [reactionLedger, setReactionLedger] = useState<ReactionLedger>(() => JSON.parse(localStorage.getItem("photo-reaction-ledger") ?? "{}"));
  const [reactionMap, setReactionMap] = useState<Record<string, Record<string, number>>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const computeReactionCounts = (ledger: ReactionLedger) =>
    Object.fromEntries(
      Object.entries(ledger).map(([photoId, reactionsByUser]) => {
        const counts: Record<string, number> = {};
        Object.values(reactionsByUser).forEach((emoji) => {
          counts[emoji] = (counts[emoji] ?? 0) + 1;
        });
        return [photoId, counts];
      }),
    );

  const refreshPhotoStats = async (photoId: string) => {
    const [{ data: likes }, { data: comments }] = await Promise.all([
      supabase.from("photo_likes").select("photo_id, user_id").eq("photo_id", photoId),
      supabase.from("comments").select("id").eq("content_type", "photo").eq("content_id", photoId),
    ]);

    const uniqueLikeUsers = new Set((likes ?? []).map((row) => row.user_id));
    const likesCount = uniqueLikeUsers.size;
    const commentsCount = comments?.length ?? 0;

    setPhotos((prev) =>
      prev.map((photo) =>
        photo.id === photoId
          ? { ...photo, likes_count: likesCount, comments_count: commentsCount }
          : photo,
      ),
    );

    if (user) {
      setLikedPhotoIds((prev) => {
        const next = new Set(prev);
        if (uniqueLikeUsers.has(user.id)) next.add(photoId);
        else next.delete(photoId);
        return next;
      });
    }
  };

  const loadPhotos = async () => {
    const { data } = await supabase
      .from("photos")
      .select("id, user_id, image_url, title, department, likes_count, comments_count, is_approved")
      .order("created_at", { ascending: false });

    if (!data) {
      setLoading(false);
      return;
    }

    const userIds = [...new Set(data.map((p) => p.user_id))];
    const ids = data.map((p) => p.id);

    const [{ data: profiles }, { data: likes }, { data: comments }] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name").in("user_id", userIds),
      ids.length > 0 ? supabase.from("photo_likes").select("photo_id, user_id").in("photo_id", ids) : Promise.resolve({ data: [] }),
      ids.length > 0
        ? supabase.from("comments").select("content_id").eq("content_type", "photo").in("content_id", ids)
        : Promise.resolve({ data: [] }),
    ]);

    const nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));

    const likeUsersByPhoto = new Map<string, Set<string>>();
    (likes ?? []).forEach((row) => {
      const users = likeUsersByPhoto.get(row.photo_id) ?? new Set<string>();
      users.add(row.user_id);
      likeUsersByPhoto.set(row.photo_id, users);
    });

    const commentCountMap = new Map<string, number>();
    (comments ?? []).forEach((row) => {
      commentCountMap.set(row.content_id, (commentCountMap.get(row.content_id) ?? 0) + 1);
    });

    setPhotos(
      data.map((photo) => {
        const name = nameMap.get(photo.user_id) ?? "Campus user";
        const lower = name.toLowerCase();
        const verified_tag = lower.includes("club") || lower.includes("admin") ? "Verified" : null;

        return {
          ...photo,
          likes_count: likeUsersByPhoto.get(photo.id)?.size ?? 0,
          comments_count: commentCountMap.get(photo.id) ?? 0,
          author_name: name,
          verified_tag,
        };
      }),
    );

    if (user) {
      const likedIds = new Set(
        [...likeUsersByPhoto.entries()].filter(([, users]) => users.has(user.id)).map(([photoId]) => photoId),
      );
      setLikedPhotoIds(likedIds);
    } else {
      setLikedPhotoIds(new Set());
    }

    setLoading(false);
  };

  useEffect(() => {
    setReactionMap(computeReactionCounts(reactionLedger));
  }, [reactionLedger]);

  useEffect(() => {
    loadPhotos();
  }, [user]);

  const loadComments = async (photoId: string) => {
    setCommentLoadingMap((prev) => ({ ...prev, [photoId]: true }));
    const { data } = await supabase
      .from("comments")
      .select("id, text, user_id")
      .eq("content_type", "photo")
      .eq("content_id", photoId)
      .order("created_at", { ascending: true });

    if (data) {
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));
      setCommentsMap((prev) => ({
        ...prev,
        [photoId]: data.map((c) => ({ id: c.id, text: c.text, author: nameMap.get(c.user_id) ?? "Student" })),
      }));
    }

    setCommentLoadingMap((prev) => ({ ...prev, [photoId]: false }));
  };

  const addComment = async (photoId: string, text: string) => {
    if (!user) return;

    const { error } = await supabase.from("comments").insert({
      user_id: user.id,
      content_type: "photo",
      content_id: photoId,
      text,
    });

    if (error) {
      toast({ title: "Comment failed", description: error.message, variant: "destructive" });
      return;
    }

    await Promise.all([loadComments(photoId), refreshPhotoStats(photoId)]);
  };

  const toggleLike = async (photoId: string) => {
    if (!user) return;
    const alreadyLiked = likedPhotoIds.has(photoId);

    if (alreadyLiked) {
      await supabase.from("photo_likes").delete().eq("photo_id", photoId).eq("user_id", user.id);
      await refreshPhotoStats(photoId);
      return;
    }

    const { data: existingLike } = await supabase
      .from("photo_likes")
      .select("id")
      .eq("photo_id", photoId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingLike) {
      const { error } = await supabase.from("photo_likes").insert({ photo_id: photoId, user_id: user.id });
      if (error) {
        toast({ title: "Like failed", description: error.message, variant: "destructive" });
        return;
      }
    }

    await refreshPhotoStats(photoId);
  };

  const sharePost = async (photoId: string, postTitle: string) => {
    const url = `${window.location.origin}/photography#${photoId}`;
    if (navigator.share) {
      await navigator.share({ title: postTitle, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Post link copied to clipboard." });
    }
  };

  const toggleSaved = (photoId: string) => {
    setSavedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      localStorage.setItem("saved-photos", JSON.stringify([...next]));
      return next;
    });
  };

  const reactToPost = (photoId: string, emoji: string) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to react to posts." });
      return;
    }

    setReactionLedger((prev) => {
      const perPhoto = { ...(prev[photoId] ?? {}) };

      if (perPhoto[user.id] === emoji) {
        delete perPhoto[user.id];
      } else {
        perPhoto[user.id] = emoji;
      }

      const next: ReactionLedger = { ...prev, [photoId]: perPhoto };
      if (Object.keys(perPhoto).length === 0) delete next[photoId];

      localStorage.setItem("photo-reaction-ledger", JSON.stringify(next));
      setReactionMap(computeReactionCounts(next));
      return next;
    });
  };

  const reportPost = (photoId: string) => {
    const queue = JSON.parse(localStorage.getItem("moderation-queue") ?? "[]") as Array<{ id: string; type: string; reported_at: string }>;
    queue.push({ id: photoId, type: "photo", reported_at: new Date().toISOString() });
    localStorage.setItem("moderation-queue", JSON.stringify(queue));
    toast({ title: "Reported", description: "Thanks. This post was added to moderation queue." });
  };

  const toggleArchive = async (photoId: string) => {
    const target = photos.find((p) => p.id === photoId);
    if (!target || !user || target.user_id !== user.id) return;

    const { error } = await supabase.from("photos").update({ is_approved: !target.is_approved }).eq("id", photoId);
    if (error) {
      toast({ title: "Archive update failed", description: error.message, variant: "destructive" });
      return;
    }

    setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, is_approved: !target.is_approved } : p)));
    toast({ title: target.is_approved ? "Post archived" : "Post restored" });
  };

  const deletePhoto = async (photoId: string) => {
    const target = photos.find((p) => p.id === photoId);
    if (!target || !user || target.user_id !== user.id) return;

    await supabase.from("comments").delete().eq("content_type", "photo").eq("content_id", photoId);
    await supabase.from("photo_likes").delete().eq("photo_id", photoId);

    const { error } = await supabase.from("photos").delete().eq("id", photoId);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }

    const photoPath = target.image_url.split("/object/public/photos/")[1];
    if (photoPath) {
      await supabase.storage.from("photos").remove([photoPath]);
    }

    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setLikedPhotoIds((prev) => {
      const next = new Set(prev);
      next.delete(photoId);
      return next;
    });
    setReactionLedger((prev) => {
      if (!prev[photoId]) return prev;
      const next = { ...prev };
      delete next[photoId];
      localStorage.setItem("photo-reaction-ledger", JSON.stringify(next));
      setReactionMap(computeReactionCounts(next));
      return next;
    });
    toast({ title: "Post deleted", description: "Your photo has been removed." });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!file || !title.trim()) {
      toast({ title: "Missing details", description: "Please add title and image file.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const upload = await supabase.storage.from("photos").upload(filePath, file, {
      upsert: false,
      contentType: file.type || "image/jpeg",
    });

    if (upload.error) {
      toast({ title: "Upload failed", description: upload.error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: publicData } = supabase.storage.from("photos").getPublicUrl(filePath);

    const insert = await supabase.from("photos").insert({
      user_id: user.id,
      title: title.trim(),
      department: department || null,
      image_url: publicData.publicUrl,
      is_approved: true,
    });

    if (insert.error) {
      toast({ title: "Save failed", description: insert.error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    toast({ title: "Photo uploaded", description: "Your photo was posted successfully." });
    setTitle("");
    setDepartment("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    await loadPhotos();
    setUploading(false);
  };

  const filteredPhotos = useMemo(() => {
    if (active === "Saved") return photos.filter((photo) => savedPhotoIds.has(photo.id));
    if (active === "All") return photos;
    return photos.filter((photo) => photo.department === active);
  }, [active, photos, savedPhotoIds]);

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader title="Photography" subtitle="Capture and share moments from campus life" className="mb-0" />
      </div>

      {!user ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Please <Link to="/login" className="text-primary underline">sign in</Link> to upload photos.
        </p>
      ) : (
        <form onSubmit={handleUpload} className="mt-4 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-4">
          <div className="space-y-1 md:col-span-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Photo title" required />
          </div>
          <div className="space-y-1">
            <Label>Department</Label>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Fine Arts" />
          </div>
          <div className="space-y-1">
            <Label>Image</Label>
            <Input ref={fileRef} type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
          </div>
          <div className="md:col-span-4">
            <Button type="submit" disabled={uploading}>
              <Upload className="mr-2 h-4 w-4" /> {uploading ? "Uploading..." : "Upload Photo"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button key={f} variant={active === f ? "default" : "secondary"} size="sm" onClick={() => setActive(f)}>
            {f}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading photos...</p>
      ) : filteredPhotos.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No photos found for this filter.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPhotos.map((photo, i) => (
            <ContentCard
              key={photo.id}
              id={photo.id}
              image={photo.image_url}
              title={photo.title}
              author={photo.author_name}
              department={photo.department ?? "General"}
              likes={photo.likes_count}
              comments={photo.comments_count}
              index={i}
              liked={likedPhotoIds.has(photo.id)}
              isOwner={user?.id === photo.user_id}
              isArchived={!photo.is_approved}
              isSaved={savedPhotoIds.has(photo.id)}
              verifiedTag={photo.verified_tag}
              reactions={reactionMap[photo.id] ?? {}}
              commentItems={commentsMap[photo.id] ?? []}
              commentsLoading={commentLoadingMap[photo.id] ?? false}
              onLike={() => toggleLike(photo.id)}
              onShare={() => sharePost(photo.id, photo.title)}
              onSaveToggle={() => toggleSaved(photo.id)}
              onReport={() => reportPost(photo.id)}
              onReact={(emoji) => reactToPost(photo.id, emoji)}
              onLoadComments={() => loadComments(photo.id)}
              onAddComment={(text) => addComment(photo.id, text)}
              onArchiveToggle={() => toggleArchive(photo.id)}
              onDelete={() => deletePhoto(photo.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
