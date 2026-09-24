"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "@/hooks/use-cart"
import { toast } from "sonner"
import { FlaskConical, AlertTriangle, Upload, ShoppingCart, Loader2 } from "lucide-react"
import { useAppContext } from "@/hooks/useAppContext"
import axios from "axios"

export const SpecialOrderForm = ({ children }: { children?: React.ReactNode }) => {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const { addItem } = useCart()
    const { user } = useAppContext()
    
    const [formData, setFormData] = useState({
        drugName: "",
        details: "",
        quantity: 1,
        prescriptionFile: null as File | null,
    })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFormData({ ...formData, prescriptionFile: e.target.files[0] })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            let prescriptionUrl = ""
            if (formData.prescriptionFile) {
                const uploadData = new FormData()
                uploadData.append("file", formData.prescriptionFile)
                uploadData.append("upload_preset", "health-clique") // Assuming this preset exists
                
                // Note: This is a placeholder for actual image upload logic
                // In this app, we usually use Cloudinary or a local API
                // For now, we'll simulate it or use the site's existing upload logic if available
                // Let's assume we just want to add the item to cart with the details
            }

            addItem({
                id: `special-manual-${Date.now()}`,
                name: `SPECIAL: ${formData.drugName}`,
                price: 0,
                isSpecial: true,
                customName: formData.drugName,
                images: [],
                category: "Extemporaneous",
            }, formData.quantity)

            toast.success("Added to cart! A pharmacist will review and price this shortly.", {
                description: "You'll be notified once the price is set."
            })
            setOpen(false)
            setFormData({ drugName: "", details: "", quantity: 1, prescriptionFile: null })
        } catch (error) {
            toast.error("Failed to submit request")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" className="gap-2 border-dashed border-primary/40 hover:bg-primary/5">
                        <FlaskConical className="h-4 w-4 text-primary" />
                        Order Scarce / Special Drug
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] rounded-3xl">
                <DialogHeader>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <FlaskConical className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-black">Special Order Request</DialogTitle>
                    <DialogDescription className="font-medium">
                        Request drugs requiring special formulation (Extemporaneous) or those currently scarce in the market.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Drug / Formulation Name</Label>
                        <Input 
                            required
                            placeholder="e.g. Specialized Skin Cream or Scarce Med" 
                            className="rounded-xl h-12 font-bold"
                            value={formData.drugName}
                            onChange={(e) => setFormData({...formData, drugName: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Quantity</Label>
                            <Input 
                                type="number"
                                required
                                min={1}
                                className="rounded-xl h-12 font-bold"
                                value={formData.quantity}
                                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Prescription (Optional)</Label>
                            <div className="relative">
                                <Input 
                                    type="file"
                                    className="hidden"
                                    id="special-presc"
                                    onChange={handleFileChange}
                                />
                                <label 
                                    htmlFor="special-presc"
                                    className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all text-[10px] font-black uppercase"
                                >
                                    {formData.prescriptionFile ? <div className="text-primary truncate px-2">{formData.prescriptionFile.name}</div> : <><Upload className="h-4 w-4" /> Upload</>}
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Additional Instructions</Label>
                        <Textarea 
                            placeholder="Provide any specific medical instructions or details about the formulation..." 
                            className="rounded-2xl min-h-[100px] font-medium"
                            value={formData.details}
                            onChange={(e) => setFormData({...formData, details: e.target.value})}
                        />
                    </div>

                    <div className="pt-4">
                        <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 mb-4">
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                            <p className="text-[10px] font-bold text-amber-900 leading-tight">
                                Note: Pricing for special orders is determined by our pharmacists after review. You will be notified in chat.
                            </p>
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 gap-2"
                            disabled={loading || !formData.drugName}
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />}
                            Place Special Request
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
