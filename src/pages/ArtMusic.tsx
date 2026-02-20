import { useState } from "react";
import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import ContentCard from "@/components/shared/ContentCard";
import { Button } from "@/components/ui/button";
import { Upload, Play, Pause, Music } from "lucide-react";

const categories = ["All", "Painting", "Digital Art", "Instrumental", "Vocal", "Sculpture"];

const mockArt = [
  { image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600", title: "Abstract Dreams", author: "Neha Reddy", department: "Fine Arts", likes: 198, comments: 24 },
  { image: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=600", title: "Urban Canvas", author: "Tom Davis", department: "Design", likes: 156, comments: 18 },
  { image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600", title: "Color Theory", author: "Anita Roy", department: "Fine Arts", likes: 231, comments: 35 },
];

const mockMusic = [
  { title: "Rainy Day Melody", artist: "Karan Mehta", type: "Instrumental", duration: "3:24", playing: false },
  { title: "Campus Blues", artist: "Jazz Club", type: "Vocal", duration: "4:12", playing: false },
  { title: "Midnight Study", artist: "Priya Iyer", type: "Instrumental", duration: "5:01", playing: false },
  { title: "Homecoming", artist: "The Acoustics", type: "Vocal", duration: "3:45", playing: false },
];

export default function ArtMusic() {
  const [active, setActive] = useState("All");
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader title="Art & Music" subtitle="Creative expressions from across campus" className="mb-0" />
        <Button>
          <Upload className="mr-2 h-4 w-4" /> Upload
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Button key={c} variant={active === c ? "default" : "secondary"} size="sm" onClick={() => setActive(c)}>
            {c}
          </Button>
        ))}
      </div>

      {/* Artwork Gallery */}
      <div className="mt-8">
        <h2 className="mb-4 font-display text-xl font-semibold text-foreground">Artwork</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockArt.map((art, i) => (
            <ContentCard key={art.title} {...art} index={i} />
          ))}
        </div>
      </div>

      {/* Music Player */}
      <div className="mt-12">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-foreground">
          <Music className="h-5 w-5 text-primary" /> Music
        </h2>
        <div className="space-y-3">
          {mockMusic.map((track, i) => (
            <motion.div
              key={track.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:shadow-card-hover"
            >
              <button
                onClick={() => setPlayingIndex(playingIndex === i ? null : i)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
              >
                {playingIndex === i ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
              </button>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-foreground truncate">{track.title}</h3>
                <p className="text-sm text-muted-foreground">{track.artist} · {track.type}</p>
              </div>
              {playingIndex === i && (
                <div className="flex items-end gap-0.5">
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <motion.div
                      key={bar}
                      className="w-1 rounded-full bg-primary"
                      animate={{ height: [8, 20, 12, 24, 8] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: bar * 0.1 }}
                    />
                  ))}
                </div>
              )}
              <span className="text-sm text-muted-foreground">{track.duration}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
