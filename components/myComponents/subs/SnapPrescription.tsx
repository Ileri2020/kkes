"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Upload,
  Loader2,
  CheckCircle2,
  ShoppingCart,
  X,
  Plus,
} from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner"; // Assuming sonner is used for toasts, otherwise I can use alert or a custom toast

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Info, RotateCcw, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export const SnapPrescription = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [results, setResults] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {},
  );
  const { addItem } = useCart();
  const [manualText, setManualText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processInput = async () => {
    if (!image && !manualText) return;

    setLoading(true);
    setStatus(image ? "Analyzing image..." : "Analyzing your request...");
    setResults([]);
    setSelectedItems({});

    try {
      const {
        data: { apiKey },
      } = await axios.get("/api/keys/gemini");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel(
        { model: "gemini-2.5-flash" },
        { apiVersion: "v1" },
      );

      const prompt = `
        Analyze this ${image ? "medical prescription or list of products (image)" : "list of products/prescription (text)"}.
        ${manualText ? `USER TEXT: "${manualText}"` : ""}
        Extract the items. For each, give:
        - name: Drug Name (text)
        - quantity: Quantity requested
        - grams: Dosage/Strength (e.g., 500mg, 100mg/5ml)
        - form: SPECIFY if it is a Tablet, Syrup, Capsule, Injection, Suspension, Gel, Cream, or Ointment. (CRITICAL for matching)
        - activeIngredients: List of active ingredients if identifiable
        - category: Type of drug (e.g., Antimalarial, Antibiotic, Painkiller, Supplement)
        - instructions: Dosage instructions if visible
        
        Return ONLY a JSON object: { "products": [...] }
      `;

      let result;
      if (image) {
        const mimeType = image.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
        const base64Data = image.split(",")[1];
        const part = { inlineData: { data: base64Data, mimeType } };
        result = await model.generateContent([prompt, part]);
      } else {
        result = await model.generateContent(prompt);
      }
      const response = await result.response;
      const parsed = JSON.parse(
        response
          .text()
          .replace(/```json|```/g, "")
          .trim(),
      );

      if (!parsed.products?.length) throw new Error("No products identified.");

      setStatus("Finding your drugs and products in HealthClique store...");
      const {
        data: { results: searchResults },
      } = await axios.post("/api/products/search-batch", {
        products: parsed.products.map((p: any) => ({
          ...p,
          // Include form in search query for better matching
          name: `${p.name} ${p.form || ""}`,
        })),
      });

      setResults(searchResults);

      // Auto-select first option if only one exists for a better UX
      const initialSelection: Record<string, string[]> = {};
      searchResults.forEach((res: any, idx: number) => {
        if (res.options.length === 1) {
          initialSelection[idx] = [res.options[0].id];
        } else {
          initialSelection[idx] = [];
        }
      });
      setSelectedItems(initialSelection);

      setStatus("Review your selected items");
    } catch (error: any) {
      console.error("Processing error:", error);
      setStatus("Error: " + (error.message || "Failed to process"));
      toast.error("Process failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (identifiedIdx: number, productId: string) => {
    setSelectedItems((prev) => {
      const current = prev[identifiedIdx] || [];
      const isSelected = current.includes(productId);
      const next = isSelected
        ? current.filter((id) => id !== productId)
        : [...current, productId];

      if (next.length > 1 && !isSelected) {
        toast.info(
          "Note: You've selected multiple variations for one prescription item.",
          {
            description: "Ensure this is what you intended.",
          },
        );
      }
      return { ...prev, [identifiedIdx]: next };
    });
  };

  const handleAddToCart = () => {
    let totalAdded = 0;
    results.forEach((res, idx) => {
      const selectedIds = selectedItems[idx] || [];
      selectedIds.forEach((id) => {
        if (id === "special") {
          addItem(
            {
              id: `special-${idx}-${Date.now()}`,
              name: `REQ: ${res.identifiedItem.name}`,
              price: 0,
              images: [],
              category: "Special",
              isSpecial: true,
              customName: res.identifiedItem.name,
            },
            1,
          );
          totalAdded++;
        } else {
          const product = res.options.find((opt: any) => opt.id === id);
          if (product) {
            addItem(
              {
                id: product.id,
                name: product.name,
                price: product.price,
                images: product.images,
                category: product.category,
              },
              product.requestedQuantity || 1,
            );
            totalAdded++;
          }
        }
      });
    });

    if (totalAdded > 0) {
      toast.success(`${totalAdded} items added to cart!`);
      setIsOpen(false);
    } else {
      toast.error("Please select at least one product.");
    }
  };

  const reset = () => {
    setImage(null);
    setStatus("");
    setResults([]);
    setSelectedItems({});
    setLoading(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(val) => {
        setIsOpen(val);
        if (!val) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl h-[90vh] sm:h-auto sm:max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b shrink-0">
          <DialogTitle className="text-2xl font-black flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-6 h-6 text-primary" />
              Snap Prescription
            </div>
            {results.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                className="font-bold text-xs gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {!image && !manualText ? (
              <div className="flex flex-col items-center gap-6 w-full">
                {/* Image Options */}
                <div className="w-full space-y-4">
                  <div
                    className="w-full h-40 border-2 border-dashed border-muted-foreground/25 rounded-3xl flex flex-col items-center justify-center gap-3 bg-muted/5 hover:bg-muted/10 transition-all cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="font-black text-base">Upload Prescription</p>
                      <p className="text-xs text-muted-foreground font-medium">
                        Drag and drop or click to select
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="h-12 rounded-2xl gap-3 font-bold border-2"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera className="w-5 h-5 text-primary" /> Camera
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 rounded-2xl gap-3 font-bold border-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-5 h-5 text-primary" /> Files
                    </Button>
                  </div>
                </div>

                <div className="relative w-full py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground font-bold">
                      OR TYPE YOUR LIST
                    </span>
                  </div>
                </div>

                {/* Manual Text Option */}
                <div className="w-full space-y-4">
                  <div className="p-4 bg-primary/5 rounded-2xl border-2 border-primary/20">
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <p className="font-bold text-sm">Write your prescription</p>
                    </div>
                    <Textarea 
                      placeholder="e.g. Paracetamol 500mg, 2 packs of Vitamin C, Insulin glargine 300 units/mL..."
                      className="min-h-[120px] rounded-xl border-none bg-transparent focus-visible:ring-0 p-0 text-sm"
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full h-12 rounded-2xl font-black gap-2"
                    disabled={!manualText.trim()}
                    onClick={processInput}
                  >
                    Process Text List
                  </Button>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="space-y-6">
                {image ? (
                  <div className="relative w-full aspect-video rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-muted ring-1 ring-black/5">
                    <img
                      src={image}
                      alt="Prescription"
                      className="w-full h-full object-contain"
                    />
                    {loading && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center flex-col gap-4 text-white">
                        <Loader2 className="w-10 h-10 animate-spin" />
                        <p className="font-black tracking-widest uppercase text-xs">
                          {status}
                        </p>
                      </div>
                    )}
                    {!loading && (
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-4 right-4 rounded-full h-10 w-10 shadow-lg"
                        onClick={() => setImage(null)}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="p-6 bg-primary/5 rounded-3xl border-2 border-primary/10 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <h4 className="font-black">Your Request</h4>
                    </div>
                    <p className="text-sm italic text-muted-foreground whitespace-pre-wrap">
                      "{manualText}"
                    </p>
                    {loading && (
                       <div className="flex items-center gap-2 text-primary">
                         <Loader2 className="w-4 h-4 animate-spin" />
                         <span className="text-xs font-bold uppercase">{status}</span>
                       </div>
                    )}
                  </div>
                )}
                
                {!loading && !status.includes("Error") && (
                  <Button
                    className="w-full h-16 rounded-2xl text-xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    onClick={processInput}
                  >
                    Identify Products
                  </Button>
                )}
                {status.includes("Error") && (
                  <div className="p-4 bg-destructive/10 border-2 border-destructive/20 rounded-2xl flex items-center gap-3 text-destructive font-bold">
                    <AlertCircle className="w-6 h-6" /> {status}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <Info className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-sm font-bold text-primary/80 leading-tight">
                    We've found multiple options for your prescription. Please
                    select the specific products you'd like to add.
                  </p>
                </div>

                <div className="space-y-10">
                  {results.map((res, identifiedIdx) => (
                    <div key={identifiedIdx} className="space-y-4">
                      <div className="flex items-end justify-between px-2">
                        <div>
                          <h3 className="text-xl font-black text-foreground inline-flex items-center gap-2">
                            {res.identifiedItem.name}
                            <Badge
                              variant="outline"
                              className="text-[10px] font-black uppercase tracking-tighter"
                            >
                              {res.identifiedItem.grams || "Generic"}
                            </Badge>
                          </h3>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            Req. Qty: {res.identifiedItem.quantity} •{" "}
                            {res.identifiedItem.category || "General"}
                          </p>
                        </div>
                        {selectedItems[identifiedIdx]?.length > 1 && (
                          <Badge
                            variant="destructive"
                            className="animate-pulse gap-1"
                          >
                            <AlertCircle className="w-3 h-3" /> Multiple
                            Selected
                          </Badge>
                        )}
                      </div>

                      <div className="grid gap-3">
                        {res.options.length > 0 ? (
                          res.options.map((opt: any) => (
                            <div
                              key={opt.id}
                              onClick={() =>
                                toggleSelection(identifiedIdx, opt.id)
                              }
                              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer group hover:scale-[1.01] ${
                                selectedItems[identifiedIdx]?.includes(opt.id)
                                  ? "bg-primary/5 border-primary ring-1 ring-primary/20 shadow-lg shadow-primary/5"
                                  : "bg-card border-border hover:border-primary/30"
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <Checkbox
                                  checked={selectedItems[
                                    identifiedIdx
                                  ]?.includes(opt.id)}
                                  onCheckedChange={() =>
                                    toggleSelection(identifiedIdx, opt.id)
                                  }
                                  className="w-5 h-5 rounded-md border-2"
                                />
                                <div>
                                  <div className="font-black text-sm group-hover:text-primary transition-colors">
                                    {opt.name}
                                  </div>
                                  <div className="text-xs font-bold text-muted-foreground">
                                    {opt.brand?.name || "Premium Brand"} •{" "}
                                    {opt.activeIngredients
                                      ?.map((i: any) => i.name)
                                      .join(", ") || "Pure Grade"}
                                  </div>
                                  {opt.description && (
                                    <div className="text-[10px] text-muted-foreground/60 mt-1 line-clamp-1 italic">
                                      {opt.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-black text-primary">
                                  ₦{opt.price.toLocaleString()}
                                </div>
                                <div className="text-[10px] font-bold text-muted-foreground uppercase">
                                  Price per unit
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 rounded-3xl border-2 border-dashed border-muted-foreground/20 text-center space-y-4 bg-muted/5">
                            <div className="space-y-1">
                              <X className="w-8 h-8 mx-auto text-muted-foreground/40" />
                              <p className="font-bold text-sm">
                                "{res.identifiedItem.name}" not in stock
                              </p>
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-none">
                                Scarce or Extemporaneous (Pharmacist concoction)
                              </p>
                            </div>
                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className={`rounded-xl h-10 gap-2 border-primary/20 ${selectedItems[identifiedIdx]?.includes("special") ? "bg-primary text-white border-primary" : "hover:bg-primary/5 hover:border-primary/40"}`}
                              onClick={() => toggleSelection(identifiedIdx, "special")}
                            >
                              <Plus className="w-3 h-3" />
                              {selectedItems[identifiedIdx]?.includes("special") ? "Item Requested" : "Request Pharmacist to Prepare/Find"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {results.length > 0 && (
          <div className="p-6 border-t bg-muted/30 flex items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 rounded-2xl font-black h-14 border-2"
              onClick={reset}
            >
              Cancel
            </Button>
            <Button
              size="lg"
              className="flex-[2] rounded-2xl font-black h-14 shadow-xl shadow-primary/20 gap-3"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-6 h-6" />
              Add Selected to Cart
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
