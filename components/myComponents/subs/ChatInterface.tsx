"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import axios from "axios";
import { format } from "date-fns";
import { Send, User as UserIcon, Check, CheckCheck, Loader2, ArrowLeft, MessageSquare, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppContext } from "@/hooks/useAppContext";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  isRead: boolean;
  sender: {
    name: string;
    avatarUrl: string;
    role: string;
  };
}

interface UserListItem {
  id: string;
  name: string;
  avatarUrl: string;
  role: string;
  email: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

export const ChatInterface = () => {
  const { user } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [allUsers, setAllUsers] = useState<UserListItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = user.role === "admin" || user.role === "professional" || user.role === "staff";

  // ── For Customers: auto-select admin ──────────────────────────────
  useEffect(() => {
    if (!isAdmin) {
      axios.get("/api/dbhandler?model=user").then((res) => {
        const admins = res.data.filter((u: any) => u.role === "admin" || u.role === "staff");
        if (admins.length > 0) {
          setAdminUser(admins[0]);
          setSelectedUserId(admins[0].id);
        }
      }).catch(console.error);
    }
  }, [isAdmin]);

  // ── For Admin: fetch ALL non-admin users + their message metadata ──
  const fetchUsersWithMessages = async () => {
    if (!isAdmin) return;
    try {
      const [usersRes, msgsRes] = await Promise.all([
        axios.get("/api/dbhandler?model=user"),
        axios.get("/api/dbhandler?model=message"),
      ]);

      const nonAdminUsers: UserListItem[] = usersRes.data
        .filter((u: any) => u.role !== "admin" && u.role !== "staff" && u.role !== "professional")
        .map((u: any) => ({ ...u, lastMessage: undefined, lastMessageTime: undefined, unreadCount: 0 }));

      const allMessages = msgsRes.data as Message[];

      // Attach last-message info to each user
      const enriched = nonAdminUsers.map((u) => {
        const convo = allMessages.filter(
          (m) => m.senderId === u.id || m.receiverId === u.id
        );
        const sorted = [...convo].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const last = sorted[0];
        const unread = convo.filter((m) => m.receiverId === user.id && !m.isRead).length;

        return {
          ...u,
          lastMessage: last?.content,
          lastMessageTime: last?.createdAt,
          unreadCount: unread,
        };
      });

      // Sort: users with recent messages first, then alphabetically
      enriched.sort((a, b) => {
        if (a.lastMessageTime && b.lastMessageTime) {
          return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        }
        if (a.lastMessageTime) return -1;
        if (b.lastMessageTime) return 1;
        return (a.name || "").localeCompare(b.name || "");
      });

      setAllUsers(enriched);
    } catch (e) {
      console.error("Error loading users/messages", e);
    }
  };

  // ── Fetch messages for selected conversation ───────────────────────
  const fetchMessages = async () => {
    if (!selectedUserId || !user.id) return;
    try {
      const res = await axios.get(`/api/dbhandler?model=message`);
      const targetId = isAdmin ? selectedUserId : user.id;
      const filtered = res.data
        .filter((msg: any) => {
          if (isAdmin) {
            return msg.senderId === selectedUserId || msg.receiverId === selectedUserId;
          } else {
            return msg.senderId === user.id || msg.receiverId === user.id;
          }
        })
        .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      setMessages(filtered);

      // Mark unread incoming as read
      const unreadIncoming = filtered.filter((msg: any) => msg.receiverId === user.id && !msg.isRead);
      if (unreadIncoming.length > 0) {
        await Promise.all(
          unreadIncoming.map((msg: any) =>
            axios.put(`/api/dbhandler?model=message&id=${msg.id}`, { isRead: true })
          )
        );
        fetchUsersWithMessages(); // refresh unread counts
      }
    } catch (e) {
      console.error("Error fetching messages", e);
    }
  };

  // Initial load + polling
  useEffect(() => {
    fetchUsersWithMessages();
    fetchMessages();
    const interval = setInterval(() => {
      fetchUsersWithMessages();
      fetchMessages();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedUserId, user.id]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId || !user.id) return;
    setLoading(true);
    try {
      await axios.post("/api/dbhandler?model=message", {
        content: newMessage,
        senderId: user.id,
        receiverId: selectedUserId,
      });
      setNewMessage("");
      fetchMessages();
      fetchUsersWithMessages();
    } catch (e) {
      console.error("Error sending message", e);
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = allUsers.find((u) => u.id === selectedUserId) || adminUser;

  const filteredUsers = allUsers.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  // Not logged in
  if (user.email === "nil") {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] w-full max-w-5xl mx-auto border-2 border-dashed rounded-3xl bg-muted/20 gap-6 p-10 text-center">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <MessageSquare size={48} className="text-primary opacity-40" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-black tracking-tight">Login Required</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            You need to be logged in to chat with our licensed pharmacists and clinical staff.
          </p>
        </div>
        <Link href="/account">
          <Button size="lg" className="h-14 px-8 rounded-xl text-lg font-bold shadow-xl shadow-primary/20">
            Sign In to Chat
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] w-full max-w-5xl mx-auto border rounded-3xl overflow-hidden bg-background shadow-2xl">
      {/* Sidebar — always visible for admin */}
      {isAdmin && (
        <div className={`w-full md:w-80 border-r bg-muted/10 flex flex-col ${selectedUserId && "hidden md:flex"}`}>
          <div className="p-4 border-b bg-background space-y-3">
            <h2 className="text-xl font-bold text-primary">All Users</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-9 h-9 rounded-full text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground italic text-sm">No users found</div>
              ) : (
                filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b hover:bg-accent/50 ${
                      selectedUserId === u.id ? "bg-accent/30 border-l-4 border-l-primary" : ""
                    }`}
                  >
                    <Avatar className="h-10 w-10 border shrink-0">
                      <AvatarImage src={u.avatarUrl} />
                      <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold text-xs truncate">{u.name || "Anonymous"}</span>
                        {u.lastMessageTime && (
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                            {format(new Date(u.lastMessageTime), "HH:mm")}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] text-muted-foreground truncate italic flex-1">
                          {u.lastMessage || <span className="text-primary/60">No messages yet</span>}
                        </p>
                        {(u.unreadCount ?? 0) > 0 && (
                          <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[9px] font-black bg-primary ml-1 shrink-0">
                            {u.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[9px] h-4 px-1 mt-0.5 font-bold capitalize border-primary/20 text-primary/60"
                      >
                        {u.role}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${isAdmin && !selectedUserId && "hidden md:flex"}`}>
        {selectedUserId ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-4 bg-background">
              {isAdmin && (
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedUserId(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <Avatar className="h-10 w-10 border shadow-sm">
                <AvatarImage src={selectedUser?.avatarUrl} />
                <AvatarFallback><UserIcon /></AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-sm">{selectedUser?.name || "Pharmacist"}</h3>
                {isAdmin && (
                  <p className="text-[10px] text-muted-foreground capitalize">{selectedUser?.role} · {selectedUser?.email}</p>
                )}
                {!isAdmin && (
                  <p className="text-[10px] text-green-500 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Active now
                  </p>
                )}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6 bg-muted/5 shadow-inner" ref={scrollRef}>
              <div className="flex flex-col gap-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
                    <MessageSquare size={40} className="opacity-20" />
                    <p className="text-sm">
                      {isAdmin
                        ? `No messages with ${selectedUser?.name || "this user"} yet. Say hello!`
                        : `Start your conversation with the pharmacist`}
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isOwn = isAdmin
                      ? msg.sender?.role === "admin" || msg.sender?.role === "staff" || msg.sender?.role === "professional"
                      : msg.senderId === user.id;

                    const prevMsg = messages[idx - 1];
                    const showTime = !prevMsg || new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 300000;

                    return (
                      <div key={msg.id} className="flex flex-col">
                        {showTime && (
                          <div className="flex justify-center my-4">
                            <span className="text-[10px] bg-muted px-2 py-1 rounded-full text-muted-foreground font-medium uppercase tracking-wider">
                              {format(new Date(msg.createdAt), "MMM d, HH:mm")}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${isOwn ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border rounded-tl-none"}`}>
                            {msg.content}
                            <div className={`text-[9px] mt-1 flex justify-end gap-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {format(new Date(msg.createdAt), "HH:mm")}
                              {isOwn && <CheckCheck className="h-3 w-3" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-background flex items-center gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 h-12 rounded-full px-6 border-2 focus-visible:ring-primary"
              />
              <Button type="submit" size="icon" className="h-12 w-12 rounded-full shrink-0 shadow-lg" disabled={loading || !newMessage.trim()}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10 text-center gap-6">
            <div className="w-32 h-32 rounded-full bg-muted/30 flex items-center justify-center">
              <MessageSquare size={64} className="opacity-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Select a user to chat</h3>
              <p className="max-w-xs mx-auto">Click any user on the left — even if they haven't messaged yet. You can initiate!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
