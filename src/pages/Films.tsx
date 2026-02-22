import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { Upload, Play, Heart, MessageCircle, Star, Share2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

type Film = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  likes_count: number;
  is_approved: boolean;
  user_id: string;
};

type FilmComment = { id: string; text: string; author: string };

export default function Films() {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [department, setDepartment] = useState("");
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [commentTextMap, setCommentTextMap] = useState<Record<string, string>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, FilmComment[]>>({});
  const [likedIds, setLikedIds] = useState<Set<string>>(() => new Set(JSON.parse(localStorage.getItem("film-liked") ?? "[]")));
  const thumbRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const persistLiked = (next: Set<string>) => {
    setLikedIds(next);
    localStorage.setItem("film-liked", JSON.stringify([...next]));
  };

  const loadFilms = async () => {
    const { data } = await supabase
      .from("films")
      .select("id, title, thumbnail_url, likes_count, is_approved, user_id")
      .order("created_at", { ascending: false });

    if (data) setFilms(data);
    setLoading(false);
  };

  useEffect(() => {
    loadFilms();
  }, []);

  const loadComments = async (filmId: string) => {
    const { data } = await supabase
      .from("comments")
      .select("id, text, user_id")
      .eq("content_type", "film")
      .eq("content_id", filmId)
      .order("created_at", { ascending: true });

    if (data) {
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));
      setCommentsMap((prev) => ({
        ...prev,
        [filmId]: data.map((c) => ({ id: c.id, text: c.text, author: nameMap.get(c.user_id) ?? "Student" })),
      }));
    }
  };

  const addComment = async (filmId: string) => {
    if (!user) return;
    const text = (commentTextMap[filmId] ?? "").trim();
    if (!text) return;
    const { error } = await supabase.from("comments").insert({ user_id: user.id, content_type: "film", content_id: filmId, text });
    if (error) {
      toast({ title: "Comment failed", description: error.message, variant: "destructive" });
      return;
    }
    setCommentTextMap((prev) => ({ ...prev, [filmId]: "" }));
    await loadComments(filmId);
  };

  const toggleLike = async (filmId: string) => {
    const film = films.find((f) => f.id === filmId);
    if (!film) return;
    const isLiked = likedIds.has(filmId);
    const nextCount = Math.max(0, film.likes_count + (isLiked ? -1 : 1));
    const { error } = await supabase.from("films").update({ likes_count: nextCount }).eq("id", filmId);
    if (error) {
      toast({ title: "Like failed", description: error.message, variant: "destructive" });
      return;
    }
    setFilms((prev) => prev.map((f) => (f.id === filmId ? { ...f, likes_count: nextCount } : f)));
    const next = new Set(likedIds);
    if (isLiked) next.delete(filmId); else next.add(filmId);
    persistLiked(next);
  };

  const shareFilm = async (filmId: string, filmTitle: string) => {
    const url = `${window.location.origin}/films#${filmId}`;
    if (navigator.share) {
      await navigator.share({ title: filmTitle, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Post link copied to clipboard." });
    }
  };

  const deleteFilm = async (filmId: string) => {
    const target = films.find((film) => film.id === filmId);
    if (!target || !user || target.user_id !== user.id) return;

    await supabase.from("comments").delete().eq("content_type", "film").eq("content_id", filmId);

    const { error } = await supabase.from("films").delete().eq("id", filmId).eq("user_id", user.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }

    const thumbnailPath = target.thumbnail_url?.split("/object/public/films/")[1] ?? null;
    if (thumbnailPath) {
      await supabase.storage.from("films").remove([thumbnailPath]);
    }

    setFilms((prev) => prev.filter((film) => film.id !== filmId));
    setCommentsMap((prev) => {
      const next = { ...prev };
      delete next[filmId];
      return next;
    });
    setCommentTextMap((prev) => {
      const next = { ...prev };
      delete next[filmId];
      return next;
    });
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.delete(filmId);
      localStorage.setItem("film-liked", JSON.stringify([...next]));
      return next;
    });

    toast({ title: "Film deleted", description: "Your film post has been removed." });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !videoUrl.trim()) {
      toast({ title: "Missing details", description: "Please add title and video URL.", variant: "destructive" });
      return;
    }

    setUploading(true);
    let thumbnail_url: string | null = null;

    if (thumbFile) {
      const ext = thumbFile.name.split(".").pop() ?? "jpg";
      const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const upload = await supabase.storage.from("films").upload(filePath, thumbFile, {
        upsert: false,
        contentType: thumbFile.type || "image/jpeg",
      });
      if (upload.error) {
        toast({ title: "Thumbnail upload failed", description: upload.error.message, variant: "destructive" });
        setUploading(false);
        return;
      }
      thumbnail_url = supabase.storage.from("films").getPublicUrl(filePath).data.publicUrl;
    }

    const insert = await supabase.from("films").insert({
      user_id: user.id,
      title: title.trim(),
      department: department || null,
      is_external: true,
      video_url: videoUrl.trim(),
      thumbnail_url,
      is_approved: true,
    });

    if (insert.error) {
      toast({ title: "Save failed", description: insert.error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    toast({ title: "Film submitted", description: "Your film has been posted." });
    setTitle("");
    setVideoUrl("");
    setDepartment("");
    setThumbFile(null);
    if (thumbRef.current) thumbRef.current.value = "";
    await loadFilms();
    setUploading(false);
  };

  const featured = useMemo(() => films.slice(0, 2), [films]);

  return (
    <div className="container py-8">
      <SectionHeader title="Films" subtitle="Short films, documentaries, and creative videos" className="mb-0" />

      {!user ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Please <Link to="/login" className="text-primary underline">sign in</Link> to upload films.
        </p>
      ) : (
        <form onSubmit={handleUpload} className="mt-4 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-4">
          <div className="space-y-1 md:col-span-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Film title" required />
          </div>
          <div className="space-y-1">
            <Label>Department</Label>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Media" />
          </div>
          <div className="space-y-1">
            <Label>Thumbnail (optional)</Label>
            <Input ref={thumbRef} type="file" accept="image/*" onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-1 md:col-span-3">
            <Label>Video URL (YouTube/Vimeo)</Label>
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." required />
          </div>
          <div className="flex items-end md:col-span-1">
            <Button type="submit" disabled={uploading} className="w-full">
              <Upload className="mr-2 h-4 w-4" /> {uploading ? "Uploading..." : "Upload Film"}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading films...</p>
      ) : (
        <>
          <div className="mt-8">
            <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-foreground">
              <Star className="h-5 w-5 text-warning" /> Featured Films
            </h2>
            {featured.length === 0 ? (
              <p className="text-sm text-muted-foreground">No featured films yet.</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {featured.map((film, i) => (
                  <motion.div key={film.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="group overflow-hidden rounded-xl border border-border bg-card shadow-card">
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      {film.thumbnail_url ? <img src={film.thumbnail_url} alt={film.title} className="h-full w-full object-cover" /> : null}
                      <div className="absolute inset-0 flex items-center justify-center bg-foreground/30 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="rounded-full bg-primary p-4 shadow-glow"><Play className="h-8 w-8 text-primary-foreground" /></div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-display text-lg font-semibold text-foreground">{film.title}</h3>
                      <div className="mt-3 flex items-center gap-2">
                        <Button size="sm" variant={likedIds.has(film.id) ? "default" : "outline"} onClick={() => toggleLike(film.id)}><Heart className="mr-1 h-4 w-4" /> {film.likes_count}</Button>
                        <Button size="sm" variant="outline" onClick={() => loadComments(film.id)}><MessageCircle className="mr-1 h-4 w-4" /> Comments</Button>
                        <Button size="sm" variant="outline" onClick={() => shareFilm(film.id, film.title)}><Share2 className="mr-1 h-4 w-4" /> Share</Button>
                        {user?.id === film.user_id ? (
                          <Button size="sm" variant="outline" onClick={() => deleteFilm(film.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="mr-1 h-4 w-4" /> Delete
                          </Button>
                        ) : null}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Input className="h-8 text-xs" placeholder="Write a comment" value={commentTextMap[film.id] ?? ""} onChange={(e) => setCommentTextMap((prev) => ({ ...prev, [film.id]: e.target.value }))} />
                        <Button size="sm" className="h-8" onClick={() => addComment(film.id)}>Post</Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-12">
            <h2 className="mb-4 font-display text-xl font-semibold text-foreground">All Films</h2>
            {films.length === 0 ? (
              <p className="text-sm text-muted-foreground">No films uploaded yet.</p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {films.map((film, i) => (
                  <motion.div key={film.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="group overflow-hidden rounded-xl border border-border bg-card shadow-card">
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      {film.thumbnail_url ? <img src={film.thumbnail_url} alt={film.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : null}
                    </div>
                    <div className="p-3">
                      <h3 className="line-clamp-1 font-display text-sm font-semibold text-foreground">{film.title}</h3>
                      <div className="mt-2 flex items-center gap-1">
                        <Button size="sm" variant={likedIds.has(film.id) ? "default" : "ghost"} onClick={() => toggleLike(film.id)}><Heart className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => loadComments(film.id)}><MessageCircle className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => shareFilm(film.id, film.title)}><Share2 className="h-4 w-4" /></Button>
                        {user?.id === film.user_id ? (
                          <Button size="sm" variant="ghost" onClick={() => deleteFilm(film.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
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
