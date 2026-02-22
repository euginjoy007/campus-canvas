import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import ContentCard from "@/components/shared/ContentCard";
import { Button } from "@/components/ui/button";
import { Upload, Play, Pause, Music, Share2, MessageCircle, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

type ArtMusicItem = {
  id: string;
  title: string;
  media_type: string;
  media_url: string;
  thumbnail_url: string | null;
  likes_count: number;
  department: string | null;
};

type ItemComment = { id: string; text: string; author: string };

const categories = ["All", "art", "music"];

export default function ArtMusic() {
  const [active, setActive] = useState("All");
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [items, setItems] = useState<ArtMusicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [mediaType, setMediaType] = useState<"art" | "music">("art");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, ItemComment[]>>({});
  const [commentLoadingMap, setCommentLoadingMap] = useState<Record<string, boolean>>({});
  const [likedIds, setLikedIds] = useState<Set<string>>(() => new Set(JSON.parse(localStorage.getItem("art-liked") ?? "[]")));
  const mediaRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  const persistLiked = (next: Set<string>) => {
    setLikedIds(next);
    localStorage.setItem("art-liked", JSON.stringify([...next]));
  };

  const inferAudioType = (url: string) => {
    const clean = url.split("?")[0].toLowerCase();
    if (clean.endsWith(".mp3")) return "audio/mpeg";
    if (clean.endsWith(".wav")) return "audio/wav";
    if (clean.endsWith(".ogg")) return "audio/ogg";
    if (clean.endsWith(".m4a")) return "audio/mp4";
    if (clean.endsWith(".aac")) return "audio/aac";
    if (clean.endsWith(".flac")) return "audio/flac";
    return "audio/mpeg";
  };

  const inferUploadContentType = (file: File, type: "art" | "music") => {
    if (file.type) return file.type;
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();

    if (type === "music") {
      const map: Record<string, string> = {
        mp3: "audio/mpeg",
        wav: "audio/wav",
        ogg: "audio/ogg",
        m4a: "audio/mp4",
        aac: "audio/aac",
        flac: "audio/flac",
      };
      return map[ext] ?? "audio/mpeg";
    }

    const imageMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      avif: "image/avif",
    };
    return imageMap[ext] ?? "application/octet-stream";
  };

  const loadItems = async () => {
    const { data } = await supabase
      .from("art_music")
      .select("id, title, media_type, media_url, thumbnail_url, likes_count, department")
      .order("created_at", { ascending: false });

    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const loadComments = async (id: string) => {
    setCommentLoadingMap((prev) => ({ ...prev, [id]: true }));
    const { data } = await supabase
      .from("comments")
      .select("id, text, user_id")
      .eq("content_type", "art")
      .eq("content_id", id)
      .order("created_at", { ascending: true });

    if (data) {
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));
      setCommentsMap((prev) => ({
        ...prev,
        [id]: data.map((c) => ({
          id: c.id,
          text: c.text,
          author: nameMap.get(c.user_id) ?? "Student",
        })),
      }));
    }

    setCommentLoadingMap((prev) => ({ ...prev, [id]: false }));
  };

  const addComment = async (id: string, text: string) => {
    if (!user) return;
    const { error } = await supabase.from("comments").insert({
      user_id: user.id,
      content_type: "art",
      content_id: id,
      text,
    });
    if (error) {
      toast({ title: "Comment failed", description: error.message, variant: "destructive" });
      return;
    }
    await loadComments(id);
  };

  const toggleLike = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const isLiked = likedIds.has(id);
    const nextCount = Math.max(0, item.likes_count + (isLiked ? -1 : 1));

    const { error } = await supabase.from("art_music").update({ likes_count: nextCount }).eq("id", id);
    if (error) {
      toast({ title: "Like failed", description: error.message, variant: "destructive" });
      return;
    }

    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, likes_count: nextCount } : i)));
    const next = new Set(likedIds);
    if (isLiked) next.delete(id);
    else next.add(id);
    persistLiked(next);
  };

  const toggleTrackPlayback = async (trackId: string) => {
    const targetAudio = audioRefs.current[trackId];
    if (!targetAudio) {
      toast({
        title: "Audio unavailable",
        description: "This track cannot be played right now.",
        variant: "destructive",
      });
      return;
    }

    if (playingTrackId === trackId) {
      targetAudio.pause();
      targetAudio.currentTime = 0;
      setPlayingTrackId(null);
      return;
    }

    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      if (!audio) return;
      if (id !== trackId) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    try {
      targetAudio.load();
      await targetAudio.play();
      setPlayingTrackId(trackId);
    } catch {
      toast({
        title: "Playback failed",
        description: "Browser blocked autoplay. Click play again.",
        variant: "destructive",
      });
      setPlayingTrackId(null);
    }
  };

  const shareItem = async (id: string, postTitle: string) => {
    const url = `${window.location.origin}/art-music#${id}`;
    if (navigator.share) {
      await navigator.share({ title: postTitle, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Post link copied to clipboard." });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !mediaFile) {
      toast({
        title: "Missing details",
        description: "Please add title and media file.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    const mediaExt = mediaFile.name.split(".").pop() ?? "bin";
    const mediaPath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${mediaExt}`;

    const mediaUpload = await supabase.storage.from("art-music").upload(mediaPath, mediaFile, {
      upsert: false,
      contentType: inferUploadContentType(mediaFile, mediaType),
    });

    if (mediaUpload.error) {
      toast({ title: "Upload failed", description: mediaUpload.error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    let thumbnail_url: string | null = null;
    if (thumbFile) {
      const thumbExt = thumbFile.name.split(".").pop() ?? "jpg";
      const thumbPath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}-thumb.${thumbExt}`;
      const thumbUpload = await supabase.storage.from("art-music").upload(thumbPath, thumbFile, {
        upsert: false,
        contentType: thumbFile.type || "image/jpeg",
      });

      if (thumbUpload.error) {
        toast({ title: "Thumbnail failed", description: thumbUpload.error.message, variant: "destructive" });
        setUploading(false);
        return;
      }

      thumbnail_url = supabase.storage.from("art-music").getPublicUrl(thumbPath).data.publicUrl;
    }

    const media_url = supabase.storage.from("art-music").getPublicUrl(mediaPath).data.publicUrl;

    const insert = await supabase.from("art_music").insert({
      user_id: user.id,
      title: title.trim(),
      media_type: mediaType,
      media_url,
      thumbnail_url,
      department: department || null,
      is_approved: true,
    });

    if (insert.error) {
      toast({ title: "Save failed", description: insert.error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    toast({ title: "Upload complete", description: "Your work has been posted." });
    setTitle("");
    setDepartment("");
    setMediaType("art");
    setMediaFile(null);
    setThumbFile(null);
    if (mediaRef.current) mediaRef.current.value = "";
    if (thumbRef.current) thumbRef.current.value = "";
    await loadItems();
    setUploading(false);
  };

  const filtered = useMemo(() => {
    if (active === "All") return items;
    return items.filter((item) => item.media_type.toLowerCase() === active);
  }, [active, items]);

  const artItems = filtered.filter((item) => item.media_type.toLowerCase() === "art");
  const musicItems = filtered.filter((item) => item.media_type.toLowerCase() === "music");

  return (
    <div className="container py-8">
      <SectionHeader title="Art & Music" subtitle="Creative expressions from across campus" className="mb-0" />

      {!user ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Please{" "}
          <Link to="/login" className="text-primary underline">
            sign in
          </Link>{" "}
          to upload art/music.
        </p>
      ) : (
        <form onSubmit={handleUpload} className="mt-4 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-4">
          <div className="md:col-span-2 space-y-1">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Work title" required />
          </div>

          <div className="space-y-1">
            <Label>Type</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as "art" | "music")}
            >
              <option value="art">Art</option>
              <option value="music">Music</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label>Department</Label>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Design" />
          </div>

          <div className="md:col-span-2 space-y-1">
            <Label>{mediaType === "art" ? "Artwork file" : "Audio file"}</Label>
            <Input
              ref={mediaRef}
              type="file"
              accept={mediaType === "art" ? "image/*" : "audio/*"}
              onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
              required
            />
          </div>

          <div className="md:col-span-1 space-y-1">
            <Label>Thumbnail (optional)</Label>
            <Input ref={thumbRef} type="file" accept="image/*" onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)} />
          </div>

          <div className="md:col-span-1 flex items-end">
            <Button type="submit" disabled={uploading} className="w-full">
              <Upload className="mr-2 h-4 w-4" /> {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Button key={c} variant={active === c ? "default" : "secondary"} size="sm" onClick={() => setActive(c)}>
            {c}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading creative work...</p>
      ) : (
        <>
          <div className="mt-8">
            <h2 className="mb-4 font-display text-xl font-semibold text-foreground">Artwork</h2>
            {artItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No artwork uploaded yet.</p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {artItems.map((art, i) => (
                  <ContentCard
                    key={art.id}
                    id={art.id}
                    image={art.thumbnail_url ?? art.media_url}
                    title={art.title}
                    author="Campus artist"
                    department={art.department ?? "General"}
                    likes={art.likes_count}
                    comments={(commentsMap[art.id] ?? []).length}
                    index={i}
                    liked={likedIds.has(art.id)}
                    commentItems={commentsMap[art.id] ?? []}
                    commentsLoading={commentLoadingMap[art.id] ?? false}
                    onLike={() => toggleLike(art.id)}
                    onShare={() => shareItem(art.id, art.title)}
                    onLoadComments={() => loadComments(art.id)}
                    onAddComment={(text) => addComment(art.id, text)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-12">
            <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-foreground">
              <Music className="h-5 w-5 text-primary" /> Music
            </h2>
            {musicItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No music tracks uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {musicItems.map((track, i) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-xl border border-border bg-card p-4 shadow-card"
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleTrackPlayback(track.id)}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      >
                        {playingTrackId === track.id ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-display font-semibold text-foreground">{track.title}</h3>
                        <p className="text-sm text-muted-foreground">Campus musician · {track.department ?? "General"}</p>
                      </div>
                    </div>

                    <audio
                      ref={(el) => {
                        audioRefs.current[track.id] = el;
                      }}
                      preload="metadata"
                      className="mt-3 w-full"
                      controls
                      onPlay={() => setPlayingTrackId(track.id)}
                      onPause={() => setPlayingTrackId((prev) => (prev === track.id ? null : prev))}
                      onEnded={() => setPlayingTrackId((prev) => (prev === track.id ? null : prev))}
                      onError={() => {
                        toast({
                          title: "Audio format issue",
                          description: "This track could not be decoded in your browser. Re-upload as MP3 for best compatibility.",
                          variant: "destructive",
                        });
                      }}
                    >
                      <source src={track.media_url} type={inferAudioType(track.media_url)} />
                      Your browser does not support the audio element.
                    </audio>

                    <div className="mt-3 flex items-center gap-2">
                      <Button size="sm" variant={likedIds.has(track.id) ? "default" : "outline"} onClick={() => toggleLike(track.id)}>
                        <Heart className="mr-1 h-4 w-4" /> {track.likes_count}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => loadComments(track.id)}>
                        <MessageCircle className="mr-1 h-4 w-4" /> Comments
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => shareItem(track.id, track.title)}>
                        <Share2 className="mr-1 h-4 w-4" /> Share
                      </Button>
                    </div>

                    {(commentsMap[track.id] ?? []).length > 0 ? (
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {(commentsMap[track.id] ?? []).slice(-3).map((c) => (
                          <p key={c.id}>
                            <span className="font-semibold text-foreground">{c.author}:</span> {c.text}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
