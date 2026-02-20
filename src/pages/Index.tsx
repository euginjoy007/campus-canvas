import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Camera, Film, Palette, Search, MessageCircle, ArrowRight, Users, Star } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

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

export default function Index() {
  return (
    <div>
      {/* Hero */}
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

      {/* Stats */}
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

      {/* Features */}
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

      {/* CTA */}
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
