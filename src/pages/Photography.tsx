import { useState } from "react";
import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import ContentCard from "@/components/shared/ContentCard";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

const filters = ["All", "Computer Science", "Fine Arts", "Engineering", "Business", "Sciences"];

const mockPhotos = [
  { image: "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=600", title: "Golden Hour on Campus", author: "Priya Sharma", department: "Fine Arts", likes: 124, comments: 18 },
  { image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600", title: "Library Reflections", author: "Alex Chen", department: "Architecture", likes: 89, comments: 12 },
  { image: "https://images.unsplash.com/photo-1562774053-701939374585?w=600", title: "Campus Spring", author: "Maya Patel", department: "Biology", likes: 203, comments: 31 },
  { image: "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=600", title: "Night Study", author: "James Wilson", department: "Computer Science", likes: 67, comments: 8 },
  { image: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=600", title: "Graduation Day", author: "Sarah Lee", department: "Business", likes: 312, comments: 45 },
  { image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600", title: "Lab Experiments", author: "Ravi Kumar", department: "Sciences", likes: 156, comments: 22 },
];

export default function Photography() {
  const [active, setActive] = useState("All");

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader title="Photography" subtitle="Capture and share moments from campus life" className="mb-0" />
        <Button>
          <Upload className="mr-2 h-4 w-4" /> Upload Photo
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f}
            variant={active === f ? "default" : "secondary"}
            size="sm"
            onClick={() => setActive(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      <motion.div
        layout
        className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {mockPhotos.map((photo, i) => (
          <ContentCard key={photo.title} {...photo} index={i} />
        ))}
      </motion.div>
    </div>
  );
}
