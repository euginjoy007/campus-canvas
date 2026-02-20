import { useState } from "react";
import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Hash, Users } from "lucide-react";

const rooms = [
  { name: "General", members: 1240, icon: Hash },
  { name: "Computer Science", members: 312, icon: Hash },
  { name: "Events", members: 890, icon: Hash },
  { name: "Fine Arts", members: 178, icon: Hash },
  { name: "Sports", members: 445, icon: Hash },
];

const mockMessages = [
  { user: "Alex", text: "Has anyone seen the hackathon schedule?", time: "2:34 PM", avatar: "A" },
  { user: "Priya", text: "Yeah it's on the events page! Starts next Friday.", time: "2:35 PM", avatar: "P" },
  { user: "James", text: "Awesome! Looking for teammates if anyone's interested 🙌", time: "2:36 PM", avatar: "J" },
  { user: "Maya", text: "I'm in! What tech stack are you thinking?", time: "2:37 PM", avatar: "M" },
  { user: "Alex", text: "Thinking React + Supabase. Open to suggestions though!", time: "2:38 PM", avatar: "A" },
  { user: "Neha", text: "Count me in too! I can handle the design side", time: "2:40 PM", avatar: "N" },
];

export default function Chat() {
  const [activeRoom, setActiveRoom] = useState("General");
  const [message, setMessage] = useState("");

  return (
    <div className="container py-8">
      <SectionHeader title="Campus Chat" subtitle="Connect with fellow students in real-time" />

      <div className="mt-4 flex h-[600px] overflow-hidden rounded-xl border border-border bg-card shadow-card">
        {/* Sidebar */}
        <div className="hidden w-64 shrink-0 border-r border-border bg-muted/30 md:block">
          <div className="p-4">
            <h3 className="font-display text-sm font-semibold text-foreground">Chat Rooms</h3>
          </div>
          <div className="space-y-0.5 px-2">
            {rooms.map((room) => (
              <button
                key={room.name}
                onClick={() => setActiveRoom(room.name)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  activeRoom === room.name
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <room.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{room.name}</span>
                <span className="text-xs text-muted-foreground">{room.members}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-display font-semibold text-foreground">{activeRoom}</h3>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" /> {rooms.find(r => r.name === activeRoom)?.members} members
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mockMessages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
                  {msg.avatar}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-sm font-semibold text-foreground">{msg.user}</span>
                    <span className="text-xs text-muted-foreground">{msg.time}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-foreground/90">{msg.text}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Message #${activeRoom}...`}
                className="flex-1"
              />
              <Button size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
