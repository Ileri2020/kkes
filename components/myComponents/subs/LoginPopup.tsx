"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import LoginForm from "./login";
import SignupForm from "./signup";
import { useMediaQuery } from "@/hooks/use-media-query";

export function LoginPopup() {
  const { status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    // Only check if not authenticated and session status is determined
    if (status === "unauthenticated") {
      const hasPopped = localStorage.getItem("health-clique-login-popped");
      if (!hasPopped) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          localStorage.setItem("health-clique-login-popped", "true");
        }, 60000); // 1 minute delay

        return () => clearTimeout(timer);
      }
    }
  }, [status]);

  if (status === "loading" || status === "authenticated") return null;

  const content = mode === "login" ? (
    <LoginForm onSignupClick={() => setMode("signup")} />
  ) : (
    <SignupForm onLoginClick={() => setMode("login")} />
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 bg-background border-none shadow-xl rounded-2xl overflow-hidden">
            <div className="overflow-y-auto max-h-[85vh] px-4">
                {content}
            </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerContent className="overflow-y-auto max-h-[90vh] bg-background">
        <div className="px-4 pb-10">
            {content}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
