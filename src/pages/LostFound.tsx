import { useState } from "react";
import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Calendar, CheckCircle, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const mockItems = [
  { image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400", title: "Silver Watch", type: "lost" as const, location: "Library, 2nd Floor", date: "Feb 18, 2026", description: "Lost a silver analog watch near the reading section.", resolved: false, poster: "Rahul S." },
  { image: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400", title: "Car Keys (Honda)", type: "found" as const, location: "Parking Lot B", date: "Feb 17, 2026", description: "Found a set of Honda car keys near parking lot B entrance.", resolved: false, poster: "Amy W." },
  { image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400", title: "Notebook (Blue)", type: "lost" as const, location: "Lecture Hall 3", date: "Feb 15, 2026", description: "Blue spiral notebook with physics notes. Very important!", resolved: true, poster: "Dev P." },
  { image: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400", title: "iPhone 15", type: "found" as const, location: "Cafeteria", date: "Feb 16, 2026", description: "Found an iPhone 15 with a clear case at the cafeteria.", resolved: false, poster: "Nina K." },
];

export default function LostFound() {
  const [filter, setFilter] = useState<"all" | "lost" | "found">("all");
  const filtered = filter === "all" ? mockItems : mockItems.filter(i => i.type === filter);

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader title="Lost & Found" subtitle="Help reunite items with their owners" className="mb-0" />
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Post Item
        </Button>
      </div>

      <div className="mt-6 flex gap-2">
        {(["all", "lost", "found"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "secondary"} size="sm" onClick={() => setFilter(f)} className="capitalize">
            {f}
          </Button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {filtered.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`overflow-hidden rounded-xl border bg-card shadow-card transition-all hover:shadow-card-hover ${item.resolved ? "border-success/30 opacity-75" : "border-border"}`}
          >
            <div className="flex flex-col sm:flex-row">
              <div className="aspect-square w-full sm:w-40 shrink-0 overflow-hidden">
                <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold text-foreground">{item.title}</h3>
                  <Badge variant={item.type === "lost" ? "destructive" : "default"} className="shrink-0 capitalize">
                    {item.type}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.location}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {item.date}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">By {item.poster}</span>
                  {item.resolved ? (
                    <span className="flex items-center gap-1 text-sm font-medium text-success">
                      <CheckCircle className="h-4 w-4" /> Resolved
                    </span>
                  ) : (
                    <Button size="sm" variant="outline">
                      <MessageCircle className="mr-1 h-3 w-3" /> Contact
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
