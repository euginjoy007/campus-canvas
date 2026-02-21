import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Hash, Users, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

interface ChatRoom {
  id: string;
  name: string;
  description: string | null;
}

interface Message {
  id: string;
  text: string;
  created_at: string;
  user_id: string;
  profiles?: { full_name: string } | null;
}

export default function Chat() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch rooms
  useEffect(() => {
    if (!user) return;
    supabase.from("chat_rooms").select("*").order("name").then(({ data }) => {
      if (data) {
        setRooms(data);
        if (!activeRoom && data.length > 0) setActiveRoom(data[0]);
      }
    });
  }, [user]);

  // Fetch messages & subscribe to realtime
  useEffect(() => {
    if (!activeRoom) return;

    supabase
      .from("messages")
      .select("*, profiles:user_id(full_name)")
      .eq("room_id", activeRoom.id)
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data) setMessages(data as any);
      });

    const channel = supabase
      .channel(`room-${activeRoom.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${activeRoom.id}` }, async (payload) => {
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", payload.new.user_id).single();
        setMessages((prev) => [...prev, { ...payload.new, profiles: profile } as any]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !activeRoom || !user || sending) return;
    setSending(true);
    await supabase.from("messages").insert({ room_id: activeRoom.id, user_id: user.id, text: message.trim() });
    setMessage("");
    setSending(false);
  };

  if (!user) {
    return (
      <div className="container flex flex-col items-center justify-center py-20 text-center">
        <LogIn className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="font-display text-xl font-bold text-foreground">Sign in to chat</h2>
        <p className="mt-2 text-sm text-muted-foreground">You need an account to join campus conversations.</p>
        <Button className="mt-4" asChild><Link to="/login">Sign In</Link></Button>
      </div>
    );
  }

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
                key={room.id}
                onClick={() => setActiveRoom(room)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  activeRoom?.id === room.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Hash className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{room.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-display font-semibold text-foreground">{activeRoom?.name}</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.5) }} className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
                  {(msg.profiles?.full_name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-sm font-semibold text-foreground">{msg.profiles?.full_name || "Anonymous"}</span>
                    <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-foreground/90">{msg.text}</p>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border p-4">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Message #${activeRoom?.name ?? ""}...`} className="flex-1" />
              <Button size="icon" type="submit" disabled={sending || !message.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
