import { Heart, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

interface ContentCardProps {
  image: string;
  title: string;
  author: string;
  department: string;
  likes: number;
  comments: number;
  index?: number;
}

export default function ContentCard({ image, title, author, department, likes, comments, index = 0 }: ContentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-foreground line-clamp-1">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{author} · {department}</p>
        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="h-4 w-4" /> {likes}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" /> {comments}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
