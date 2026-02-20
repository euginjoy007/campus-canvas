import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { Upload, Play, Heart, MessageCircle, Star } from "lucide-react";

const mockFilms = [
  { thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600", title: "Echoes of Tomorrow", director: "Arun Nair", crew: "8 members", likes: 234, comments: 42, featured: true, duration: "12:34" },
  { thumbnail: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600", title: "The Last Lecture", director: "Emily Zhang", crew: "5 members", likes: 189, comments: 28, featured: false, duration: "8:15" },
  { thumbnail: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600", title: "Campus Stories", director: "David Kim", crew: "12 members", likes: 567, comments: 89, featured: true, duration: "22:10" },
  { thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600", title: "Between Classes", director: "Lisa Park", crew: "3 members", likes: 145, comments: 19, featured: false, duration: "5:48" },
];

export default function Films() {
  return (
    <div className="container py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader title="Short Films" subtitle="Student-made films and documentaries" className="mb-0" />
        <Button>
          <Upload className="mr-2 h-4 w-4" /> Upload Film
        </Button>
      </div>

      {/* Featured */}
      <div className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-foreground">
          <Star className="h-5 w-5 text-warning" /> Featured Films
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {mockFilms.filter(f => f.featured).map((film, i) => (
            <motion.div
              key={film.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:shadow-card-hover"
            >
              <div className="relative aspect-video overflow-hidden">
                <img src={film.thumbnail} alt={film.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/30 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="rounded-full bg-primary p-4 shadow-glow">
                    <Play className="h-8 w-8 text-primary-foreground" />
                  </div>
                </div>
                <span className="absolute bottom-3 right-3 rounded-md bg-foreground/80 px-2 py-1 text-xs font-medium text-primary-foreground">{film.duration}</span>
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg font-semibold text-foreground">{film.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">Directed by {film.director} · {film.crew}</p>
                <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Heart className="h-4 w-4" /> {film.likes}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" /> {film.comments}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* All Films */}
      <div className="mt-12">
        <h2 className="mb-4 font-display text-xl font-semibold text-foreground">All Films</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {mockFilms.map((film, i) => (
            <motion.div
              key={film.title + "-all"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:shadow-card-hover"
            >
              <div className="relative aspect-video overflow-hidden">
                <img src={film.thumbnail} alt={film.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="rounded-full bg-primary/90 p-3">
                    <Play className="h-5 w-5 text-primary-foreground" />
                  </div>
                </div>
                <span className="absolute bottom-2 right-2 rounded bg-foreground/80 px-1.5 py-0.5 text-xs text-primary-foreground">{film.duration}</span>
              </div>
              <div className="p-3">
                <h3 className="font-display text-sm font-semibold text-foreground line-clamp-1">{film.title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{film.director}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
