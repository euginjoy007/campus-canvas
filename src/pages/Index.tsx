import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Camera, Film, Palette, Search, MessageCircle, ArrowRight, Users, Star, Bell, Trophy, Sparkles } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { supabase } from "@/integrations/supabase/client";

type LeaderboardRow = { department: string; likes: number };
type EventItem = { id: string; title: string; when: string; place: string };

const features = [
  { icon: Camera, title: "Photography", desc: "Share your best shots with the campus community", to: "/photography", color: "bg-primary/10 text-primary" },
  { icon: Film, title: "Short Films", desc: "Showcase your filmmaking talent and creativity", to: "/films", color: "bg-accent/10 text-accent" },
  { icon: Palette, title: "Art & Music", desc: "Display artwork and share your musical compositions", to: "/art-music", color: "bg-success/10 text-success" },
  { icon: Search, title: "Lost & Found", desc: "Help reunite lost items with their owners", to: "/lost-found", color: "bg-warning/10 text-warning" },
  { icon: MessageCircle, title: "Campus Chat", desc: "Connect with fellow students in real-time", to: "/chat", color: "bg-destructive/10 text-destructive" },
];

const stats = [
  { value: "2,500+", label: "Active Students" },
  { value: "10K+", label: "Posts Shared" },
  { value: "50+", label: "Departments" },
  { value: "100%", label: "Student-Driven" },
];

const stories = [
  { title: "Hackathon Finals", dept: "Engineering" },
  { title: "Open Mic Night", dept: "Fine Arts" },
  { title: "Photo Walk", dept: "Design" },
  { title: "Startup Pitch", dept: "Business" },
];

const events: EventItem[] = [
  { id: "e1", title: "Tech Talk: AI in Campus Life", when: "Fri 4:00 PM", place: "Auditorium" },
  { id: "e2", title: "Music Club Jam", when: "Sat 6:30 PM", place: "Open Stage" },
  { id: "e3", title: "Design Portfolio Review", when: "Mon 2:00 PM", place: "Studio 2" },
];

export default function Index() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [rsvpIds, setRsvpIds] = useState<Set<string>>(() => new Set(JSON.parse(localStorage.getItem("event-rsvp") ?? "[]")));

  useEffect(() => {
    const loadLeaderboard = async () => {
      const { data } = await supabase.from("photos").select("department, likes_count").limit(400);
      if (!data) return;
      const map = new Map<string, number>();
      data.forEach((row) => {
        const dept = row.department ?? "General";
        map.set(dept, (map.get(dept) ?? 0) + (row.likes_count ?? 0));
      });
      setLeaderboard(
        [...map.entries()]
          .map(([department, likes]) => ({ department, likes }))
          .sort((a, b) => b.likes - a.likes)
          .slice(0, 5),
      );
    };

    loadLeaderboard();
  }, []);

  const challengeProgress = useMemo(() => {
    const savedCount = JSON.parse(localStorage.getItem("saved-photos") ?? "[]").length;
    return Math.min(100, savedCount * 10);
  }, []);

  const toggleRsvp = (eventId: string) => {
    setRsvpIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      localStorage.setItem("event-rsvp", JSON.stringify([...next]));
      return next;
    });
  };

  return (
    <div>
      <section className="relative overflow-hidden gradient-hero py-20 md:py-32">
        <div className="absolute inset-0 opacity-20">
          <img src={heroBg} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium text-primary-foreground/90 backdrop-blur-sm">
              <Star className="h-4 w-4" />
              Your campus, your community
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight text-primary-foreground md:text-6xl">
              Where Student{" "}
              <span className="bg-gradient-to-r from-accent to-primary-foreground bg-clip-text text-transparent">
                Talent
              </span>{" "}
              Shines
            </h1>
            <p className="mt-6 text-lg text-primary-foreground/70 md:text-xl">
              Share photography, films, art, and music. Connect with classmates and build your creative portfolio — all in one place.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button variant="hero" size="lg" asChild>
                <Link to="/register">
                  Get Started <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="lg" asChild>
                <Link to="/photography">Explore Content</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-border bg-card py-6">
        <div className="container">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-4 w-4" /> Stories & Spotlights
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stories.map((story) => (
              <div key={story.title} className="rounded-lg border border-border bg-background p-3">
                <p className="font-medium text-foreground">{story.title}</p>
                <p className="text-xs text-muted-foreground">{story.dept}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className="font-display text-3xl font-bold text-gradient">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <Trophy className="h-5 w-5 text-warning" /> Department Leaderboard
            </h3>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leaderboard data yet.</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((row, idx) => (
                  <div key={row.department} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
                    <span>{idx + 1}. {row.department}</span>
                    <span className="font-semibold">{row.likes} likes</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-2 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <Star className="h-5 w-5 text-primary" /> Weekly Challenge
            </h3>
            <p className="text-sm text-muted-foreground">Theme: Campus Moments. Upload and save posts to increase your badge progress.</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${challengeProgress}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Progress: {challengeProgress}%</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <Bell className="h-5 w-5 text-accent" /> Event RSVP & Reminder
            </h3>
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="rounded-md bg-muted/40 p-3">
                  <p className="font-medium text-foreground">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.when} · {event.place}</p>
                  <Button type="button" variant={rsvpIds.has(event.id) ? "default" : "outline"} size="sm" className="mt-2" onClick={() => toggleRsvp(event.id)}>
                    {rsvpIds.has(event.id) ? "RSVP'd (Reminder ON)" : "RSVP"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-12 max-w-2xl text-center"
          >
            <h2 className="font-display text-3xl font-bold text-foreground">Everything Your Campus Needs</h2>
            <p className="mt-3 text-muted-foreground">
              One platform for creativity, connection, and community.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Link
                  to={feature.to}
                  className="group block rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
                >
                  <div className={`inline-flex rounded-lg p-3 ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.desc}</p>
                  <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Explore <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="gradient-hero py-16">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Users className="mx-auto h-12 w-12 text-accent" />
            <h2 className="mt-4 font-display text-3xl font-bold text-primary-foreground">
              Ready to join your campus community?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-primary-foreground/70">
              Sign up with your college email and start sharing your talent today.
            </p>
            <Button variant="hero" size="lg" className="mt-6" asChild>
              <Link to="/register">Create Your Account</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
