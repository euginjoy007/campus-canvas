import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Calendar, CheckCircle, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

type LostFoundItem = {
  id: string;
  title: string;
  status: string;
  location: string | null;
  created_at: string;
  description: string;
  image_url: string | null;
};

export default function LostFound() {
  const [filter, setFilter] = useState<"all" | "lost" | "found">("all");
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [status, setStatus] = useState<"lost" | "found">("lost");
  const [image, setImage] = useState<File | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadItems = async () => {
    const { data } = await supabase
      .from("lost_found")
      .select("id, title, status, location, created_at, description, image_url")
      .order("created_at", { ascending: false });

    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !description.trim()) {
      toast({ title: "Missing details", description: "Title and description are required.", variant: "destructive" });
      return;
    }

    setPosting(true);
    let image_url: string | null = null;

    if (image) {
      const ext = image.name.split(".").pop() ?? "jpg";
      const imagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const upload = await supabase.storage.from("lost-found").upload(imagePath, image, {
        upsert: false,
        contentType: image.type || "image/jpeg",
      });
      if (upload.error) {
        toast({ title: "Image upload failed", description: upload.error.message, variant: "destructive" });
        setPosting(false);
        return;
      }
      image_url = supabase.storage.from("lost-found").getPublicUrl(imagePath).data.publicUrl;
    }

    const insert = await supabase.from("lost_found").insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
      status,
      location: location || null,
      contact_info: contactInfo || null,
      image_url,
    });

    if (insert.error) {
      toast({ title: "Post failed", description: insert.error.message, variant: "destructive" });
      setPosting(false);
      return;
    }

    toast({ title: "Posted", description: "Your item is now visible in Lost & Found." });
    setTitle("");
    setDescription("");
    setLocation("");
    setContactInfo("");
    setStatus("lost");
    setImage(null);
    if (imageRef.current) imageRef.current.value = "";
    await loadItems();
    setPosting(false);
  };

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.status === filter);
  }, [filter, items]);

  return (
    <div className="container py-8">
      <SectionHeader title="Lost & Found" subtitle="Help reunite items with their owners" className="mb-0" />

      {!user ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Please <Link to="/login" className="text-primary underline">sign in</Link> to post an item.
        </p>
      ) : (
        <form onSubmit={handlePost} className="mt-4 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-4">
          <div className="md:col-span-2 space-y-1">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Wallet" required />
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value as "lost" | "found")}>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>Image (optional)</Label>
            <Input ref={imageRef} type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
          </div>
          <div className="md:col-span-4 space-y-1">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the item" required />
          </div>
          <div className="md:col-span-2 space-y-1">
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Where it was lost/found" />
          </div>
          <div className="md:col-span-1 space-y-1">
            <Label>Contact info</Label>
            <Input value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} placeholder="Email / phone" />
          </div>
          <div className="md:col-span-1 flex items-end">
            <Button type="submit" disabled={posting} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> {posting ? "Posting..." : "Post Item"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 flex gap-2">
        {(["all", "lost", "found"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "secondary"} size="sm" onClick={() => setFilter(f)} className="capitalize">
            {f}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading items...</p>
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No items found.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {filtered.map((item, i) => {
            const resolved = item.status === "resolved";
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`overflow-hidden rounded-xl border bg-card shadow-card ${resolved ? "border-success/30 opacity-75" : "border-border"}`}
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="aspect-square w-full shrink-0 overflow-hidden bg-muted sm:w-40">
                    {item.image_url ? <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-lg font-semibold text-foreground">{item.title}</h3>
                      <Badge variant={item.status === "lost" ? "destructive" : "default"} className="shrink-0 capitalize">
                        {item.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.location ?? "Unknown location"}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      {resolved ? (
                        <span className="flex items-center gap-1 text-sm font-medium text-success">
                          <CheckCircle className="h-4 w-4" /> Resolved
                        </span>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          <MessageCircle className="mr-1 h-3 w-3" /> Contact via profile soon
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
