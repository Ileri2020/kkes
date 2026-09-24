"use client";

import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Clock, ShieldCheck, HeartPulse, Search, Camera } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RiseAndFadeText } from "./textctrl";
import { GlobalSearch, SpecialOrderForm } from "./index";
import { SnapPrescription } from "./SnapPrescription";
import { FlaskConical } from "lucide-react";
import { useAppContext } from "@/hooks/useAppContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Hero = () => {
  const { user } = useAppContext();
  const thingsToDo = [
    "Order authentic medications online",
    "Consult with expert pharmacists",
    "Track your medical supplies delivery",
    "Access wholesale healthcare products",
    "Read the latest clinical insights",
    "Manage your prescriptions easily",
    "NAFDAC Approved Pharmacy Products",
    "24/7 Professional Health Support",
    "Direct Supply for Wholesalers",
    "Verified Medical Research & News"
  ];

  return (
    <div className="relative bg-background">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-[length:20px_20px]" />
      <div className="absolute top-0 right-0 -tr-y-1/2 w-1/3 h-1/2 bg-primary/5 blur-3xl rounded-full" />
      
      <div className="relative z-10 container mx-auto max-w-7xl px-4 py-8 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: Text & Search */}
          <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-left duration-700">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <ShieldCheck className="w-4 h-4" />
                NAFDAC Approved Pharmacy
              </div>
              
              <RiseAndFadeText 
                texts={thingsToDo}
                className="text-xl md:text-2xl font-bold text-accent italic h-8 overflow-hidden" 
              />

              <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground leading-[1.1]">
                With a click, get your <br />
                <span className="text-accent text-5xl md:text-6xl font-black underline decoration-accent/30">Premium Medical Supplies</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-xl">
                Order authentic medications, pharmaceutical products, and medical equipment at the lowest prices, delivered to your doorstep.
              </p>
            </div>

            {/* Instant Search Bar (OneHealth Replication) */}
            <div className="relative w-full max-w-lg">
                <GlobalSearch 
                  placeholder="Search for medications, brands or ingredients..." 
                  className="h-14"
                />
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link href="/store">
                <Button size="lg" className="h-14 px-8 rounded-xl text-lg bg-accent hover:bg-accent/90">
                  Shop All Meds
                </Button>
              </Link>

              <SnapPrescription>
                <Button size="lg" variant="outline" className="h-14 px-8 rounded-xl text-lg gap-2 border-2 border-accent text-accent hover:bg-accent hover:text-white transition-all">
                  <Camera className="w-5 h-5" />
                  Snap or List Prescription
                </Button>
              </SnapPrescription>
              {user?.email !== "nil" ? (
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="h-14 px-8 rounded-xl text-lg gap-2 border-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    Speak to the Pharmacist
                  </Button>
                </Link>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" variant="outline" className="h-14 px-8 rounded-xl text-lg gap-2 border-2">
                      <MessageCircle className="w-5 h-5 text-primary" />
                      Speak to the Pharmacist
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold">Login Required</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                       <MessageCircle className="h-16 w-16 text-primary mb-4 opacity-50" />
                       <p className="text-muted-foreground mb-6">You need to log in to chat directly with our expert pharmacists.</p>
                       <Link href="/account" className="w-full">
                         <Button size="lg" className="rounded-xl w-full text-lg h-14">Sign In to Continue</Button>
                       </Link>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <SpecialOrderForm>
                <Button size="lg" variant="secondary" className="h-14 px-8 rounded-xl text-lg gap-2 bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white border-2 border-amber-500/20 group transition-all">
                  <FlaskConical className="w-5 h-5 group-hover:animate-bounce" />
                  Order Scarce / Special Meds
                </Button>
              </SpecialOrderForm>
            </div>

            {/* Value Badges */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-5 h-5 text-primary" />
                <span>Doorstep Delivery (1-4 hrs)</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <HeartPulse className="w-5 h-5 text-primary" />
                <Link href="/contact" className="hover:text-primary transition-colors">Talk to a Pharmacist</Link>
              </div>
            </div>
          </div>

          {/* Right Column: Visuals */}
          <div className="relative hidden lg:block animate-in fade-in slide-in-from-right duration-700">
            <div className="relative aspect-square w-full max-w-lg mx-auto overflow-hidden rounded-3xl border-8 border-background shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
               <img
                src="/bannerboy.png"
                alt="Expert Pharmacist"
                className="w-full h-full object-cover scale-110 hover:scale-100 transition-transform duration-700"
              />
            </div>
            
            {/* Float Cards */}
            <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-2xl shadow-xl border animate-bounce-slow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Quality Guaranteed</div>
                  <div className="text-sm font-bold">100% Authentic</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Quick Action Floating Widget */}
      <div className="fixed left-6 bottom-24 z-50 flex flex-col gap-2">
        <a href="tel:+2348188762448" className="bg-primary text-white p-3 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2 group">
          <Phone className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-medium whitespace-nowrap">Call to Order</span>
        </a>
      </div>

    </div>
  );
};

export default Hero;