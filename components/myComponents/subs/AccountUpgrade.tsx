"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useAppContext } from "@/hooks/useAppContext"
import axios from "axios"
import { CheckCircle2, Star, Briefcase, Building2 } from "lucide-react"

export const AccountUpgrade = () => {
  const { user, setUser } = useAppContext()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Question, 2: Form
  const [role, setRole] = useState("")
  const [formData, setFormData] = useState({
    professionalType: "",
    regNumber: "",
    facilityName: "",
    facilityAddress: "",
    facilityRegNumber: "",
  })

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const res = await axios.put(`/api/dbhandler?model=user&id=${user.id}`, {
        ...formData,
        role: role,
        verificationStatus: "pending",
        id: user.id
      })
      setUser({ ...user, ...res.data })
      setStep(3) // Success
    } catch (error) {
      console.error("Upgrade failed:", error)
    } finally {
      setLoading(false)
    }
  }

  if (user.role !== "customer") return null

  return (
    <Dialog onOpenChange={(open) => !open && setStep(1)}>
      <DialogTrigger asChild>
        <Button className="w-full bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 border-2 gap-2 h-12 rounded-xl mt-4">
          <Star className="h-4 w-4 fill-primary" />
          Are you a Healthcare Professional? Upgrade Now
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] rounded-3xl">
        {step === 1 && (
          <div className="space-y-6 py-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">Upgrade Your Account</DialogTitle>
              <DialogDescription className="text-center text-base">
                Get access to bulk services, professional rates, and specialized medical tools.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4">
              <Button 
                variant="outline" 
                className="h-24 flex flex-col items-center justify-center gap-2 border-2 hover:border-primary hover:bg-primary/5 rounded-2xl"
                onClick={() => { setRole("professional"); setStep(2); }}
              >
                <Briefcase className="h-6 w-6 text-primary" />
                <div className="text-center">
                  <p className="font-bold text-sm">Healthcare Professional</p>
                  <p className="text-xs text-muted-foreground">Doctor, Nurse, Pharmacist</p>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="h-24 flex flex-col items-center justify-center gap-2 border-2 hover:border-primary hover:bg-primary/5 rounded-2xl"
                onClick={() => { setRole("wholesaler"); setStep(2); }}
              >
                <Building2 className="h-6 w-6 text-primary" />
                <div className="text-center">
                  <p className="font-bold text-sm">Wholesaler / Facility</p>
                  <p className="text-xs text-muted-foreground">Hospital, Pharmacy, Sales Rep</p>
                </div>
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 py-4">
            <DialogHeader>
              <DialogTitle className="capitalize font-bold">Verify as {role}</DialogTitle>
              <DialogDescription>Please provide your business or professional details for verification.</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {role === "professional" ? (
                <>
                  <div className="space-y-1">
                    <Label>Professional Type</Label>
                    <select 
                      className="w-full p-2 rounded-md border text-sm bg-background"
                      value={formData.professionalType}
                      onChange={(e) => setFormData({ ...formData, professionalType: e.target.value })}
                    >
                      <option value="">Select Type</option>
                      <option value="pharmacist">Pharmacist</option>
                      <option value="doctor">Doctor</option>
                      <option value="nurse">Nurse</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Registration Number</Label>
                    <Input 
                      placeholder="e.g. PH/12345"
                      value={formData.regNumber}
                      onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <Label>Facility / Company Name</Label>
                    <Input 
                      placeholder="Name of health facility"
                      value={formData.facilityName}
                      onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Facility Registration Number</Label>
                    <Input 
                      placeholder="CAC or PCN Reg No"
                      value={formData.facilityRegNumber}
                      onChange={(e) => setFormData({ ...formData, facilityRegNumber: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="flex flex-row gap-2">
              <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button onClick={handleUpgrade} disabled={loading} className="flex-1">
                {loading ? "Submitting..." : "Apply Upgrade"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 3 && (
          <div className="py-10 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Application Submitted!</h3>
              <p className="text-sm text-muted-foreground mx-auto max-w-xs">
                Your request to upgrade is being reviewed. You'll receive a notification once verified.
              </p>
            </div>
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
