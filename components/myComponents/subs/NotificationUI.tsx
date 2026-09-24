"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { MessageSquare, Bell, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/hooks/useAppContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function useUnreadCount() {
  const { user } = useAppContext();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const isFetching = React.useRef(false);

  const isAdmin = user.role === "admin" || user.role === "staff" || user.role === "professional";

  useEffect(() => {
    if (!user?.id || user.id === "nil") return;

    const checkMessages = async () => {
      if (isFetching.current) return;
      isFetching.current = true;
      try {
        const res = await axios.get("/api/dbhandler?model=message");
        const unread = res.data.filter((msg: any) => msg.receiverId === user.id && !msg.isRead);
        
        // Session storage to track toast display
        const lastShownCount = parseInt(sessionStorage.getItem("lastToastCount") || "0");
        
        if (unread.length > lastShownCount) {
          setShowToast(true);
          sessionStorage.setItem("lastToastCount", unread.length.toString());
        }
        
        setUnreadCount(unread.length);
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        isFetching.current = false;
      }
    };

    checkMessages();
    const interval = setInterval(checkMessages, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  return { unreadCount, showToast, setShowToast, isAdmin };
}

/** Bell icon intended to sit inside the navbar */
export const NotificationBell = () => {
  const { unreadCount } = useUnreadCount();
  return (
    <Link href="/contact" title="Messages">
      <div className="relative p-1.5 rounded-full hover:bg-accent transition-colors cursor-pointer">
        <Bell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[9px] font-black border border-background animate-bounce bg-destructive">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </div>
    </Link>
  );
};

/** Full notification UI — toast popup */
export const NotificationUI = () => {
  const { showToast, setShowToast, unreadCount, isAdmin } = useUnreadCount();

  return (
    <AnimatePresence>
      {showToast && unreadCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed bottom-24 left-6 z-[70] w-full max-w-[320px]"
        >
          <div className="bg-primary text-primary-foreground p-4 rounded-2xl shadow-2xl border-2 border-white/20 backdrop-blur-xl flex flex-col gap-3 relative overflow-hidden group">
            <div
              className="absolute top-0 right-0 p-1 opacity-50 hover:opacity-100 cursor-pointer"
              onClick={() => setShowToast(false)}
            >
              <X size={16} />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <MessageSquare size={20} className="animate-pulse" />
              </div>
              <div>
                <p className="font-black text-sm">New Messages!</p>
                <p className="text-xs opacity-90 font-medium">
                  You have {unreadCount} unread message{unreadCount > 1 ? "s" : ""} from{" "}
                  {isAdmin ? "a patient" : "the pharmacist"}.
                </p>
              </div>
            </div>

            <Link href="/contact" onClick={() => setShowToast(false)}>
              <Button
                variant="secondary"
                className="w-full h-10 rounded-xl font-black text-xs gap-2 group/btn shadow-lg"
              >
                Open Chat Section
                <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <div className="absolute inset-0 bg-white/5 pointer-events-none group-hover:bg-white/10 transition-colors" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
