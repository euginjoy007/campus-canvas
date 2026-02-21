import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
            <GraduationCap className="h-5 w-5 text-primary" />
            CampusCanvas
          </Link>
          <p className="text-sm text-muted-foreground">
            © 2026 CampusCanvas. Built for students, by students.
          </p>
        </div>
      </div>
    </footer>
  );
}
