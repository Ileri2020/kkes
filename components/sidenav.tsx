"use client"

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { CiMenuFries } from "react-icons/ci"
import Links, { PortalLinks } from "@/data/links";
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppContext } from "@/hooks/useAppContext";
import { signOut, useSession } from "next-auth/react";
import { ArrowRight, BookOpen, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";

const Sidenav = () => {
    const pathname = usePathname()
    const { user } = useAppContext()
    const { status } = useSession()
    const allLinks = [...Links.Links, ...PortalLinks];
    const profileImage = user?.avatarUrl || user?.image;
    const isSignedIn = status === "authenticated";

  return (
    <Sheet>
        <SheetTrigger aria-label="Open navigation menu" className="flex h-10 w-10 justify-center items-center rounded-lg transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <CiMenuFries className="text-[32px] text-accent"/>
        </SheetTrigger>
        <SheetContent side="right" className="flex h-[100dvh] w-[min(88vw,380px)] flex-col gap-0 overflow-hidden border-l border-border/70 bg-background p-0 shadow-2xl sm:max-w-sm">
            <header className="shrink-0 border-b border-border/70 bg-gradient-to-br from-accent/10 via-background to-background px-5 pb-5 pt-8">
                <Link href="/" className="flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-accent/20 bg-background shadow-sm">
                        <Image src="/logo.png" alt="" width={48} height={48} className="h-12 w-12 object-contain" />
                    </span>
                    <span className="min-w-0">
                        <SheetTitle className="text-left text-base font-bold leading-tight">Kith and Kin</SheetTitle>
                        <span className="mt-1 block text-xs font-medium text-muted-foreground">International College</span>
                        <span className="mt-1 block text-[11px] font-semibold italic tracking-wide text-accent">Be Resourceful</span>
                    </span>
                </Link>
            </header>

            <nav aria-label="Main navigation" className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-4">
                <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-background px-3 py-1">
                    <span className="text-xs font-semibold text-muted-foreground">Appearance</span>
                    <ModeToggle />
                </div>
                {allLinks.map((link) => {
                    const isActive = pathname === link.path || (link.path !== "/" && pathname.startsWith(`${link.path}/`));
                    const icon = "icon" in link && React.isValidElement(link.icon) ? link.icon : <BookOpen className="h-5 w-5" />;

                    return (
                        <Link
                            href={link.path}
                            key={link.path}
                            aria-current={isActive ? "page" : undefined}
                            className={`group flex w-full items-center gap-3 rounded-xl border-b border-foreground bg-foreground/10 shadow-md shadow-accent/30 max-w-[250px] mx-auto px-3 py-3 text-sm font-semibold transition-all duration-200 ${isActive ? "border-accent/30 bg-accent text-accent-foreground shadow-md shadow-accent/15" : "border-transparent text-foreground/80 hover:border-border hover:bg-accent/10 hover:text-foreground"}`}
                        >
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isActive ? "bg-white/15" : "bg-muted/70 text-accent group-hover:bg-accent/15"}`}>
                                {icon}
                            </span>
                            <span className="flex-1 capitalize">{link.name}</span>
                            <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 ${isActive ? "opacity-90" : "opacity-0 group-hover:opacity-60"}`} />
                        </Link>
                    )
                })}
            </nav>

            <footer className="shrink-0 border-t border-border/70 bg-muted/20 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
                <Link href="/account" className="mb-3 flex min-w-0 items-center gap-3 rounded-xl border border-border/70 bg-background p-3 transition-colors hover:border-accent/40 hover:bg-accent/5">
                    <Avatar className="h-11 w-11 shrink-0 ring-2 ring-accent/15 ring-offset-2 ring-offset-background">
                        {profileImage && <AvatarImage src={profileImage} alt={user?.name || "Account profile"} />}
                        <AvatarFallback className="bg-accent/10 text-accent"><UserRound className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{user?.name && user.name !== "visitor" ? user.name : "Your account"}</span>
                        <span className="block truncate text-xs text-muted-foreground">{isSignedIn ? user?.email || "View your profile" : "Sign in to your account"}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>

                {isSignedIn ? (
                    <Button type="button" variant="outline" className="mb-3 h-10 w-full justify-start gap-2 rounded-xl text-muted-foreground hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive" onClick={() => signOut({ callbackUrl: "/" })}>
                        <LogOut className="h-4 w-4" />
                        Sign out
                    </Button>
                ) : (
                    <div className="mb-3 grid grid-cols-2 gap-2">
                        <Button asChild variant="outline" className="h-10 rounded-xl">
                            <Link href="/login">Sign in</Link>
                        </Button>
                        <Button asChild className="h-10 rounded-xl shadow-sm shadow-accent/20">
                            <Link href="/register">Create account</Link>
                        </Button>
                    </div>
                )}
            </footer>
        </SheetContent>
    </Sheet>
  )
}

export default Sidenav
