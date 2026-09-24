"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Shield,
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { useAppContext } from "@/hooks/useAppContext";

const ROLE_COLORS: Record<string, string> = {
  customer: "secondary",
  professional: "default",
  wholesaler: "outline",
  staff: "default",
  admin: "destructive",
};

const VERIFICATION_COLORS: Record<string, string> = {
  unverified: "secondary",
  pending: "outline",
  verified: "default",
  rejected: "destructive",
};

const VerificationIcon: Record<string, React.ReactNode> = {
  verified: <CheckCircle className="h-3 w-3 text-green-500" />,
  pending: <Clock className="h-3 w-3 text-amber-500" />,
  rejected: <XCircle className="h-3 w-3 text-red-500" />,
};

export const AdminUserManager = () => {
  const { user: currentAdmin } = useAppContext();
  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editVerification, setEditVerification] = useState("");
  const [success, setSuccess] = useState(false);

  // Only accessible to admin
  if (currentAdmin.role !== "admin") return null;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/dbhandler?model=user");
      setUsers(res.data);
      setFiltered(res.data);
    } catch (e) {
      console.error("Failed to fetch users:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (q: string) => {
    setSearch(q);
    const lower = q.toLowerCase();
    setFiltered(
      users.filter(
        (u) =>
          u.name?.toLowerCase().includes(lower) ||
          u.email?.toLowerCase().includes(lower) ||
          u.role?.toLowerCase().includes(lower)
      )
    );
  };

  const openEdit = (u: any) => {
    setSelectedUser(u);
    setEditRole(u.role || "customer");
    setEditVerification(u.verificationStatus || "unverified");
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await axios.put(`/api/dbhandler?model=user&id=${selectedUser.id}`, {
        role: editRole,
        verificationStatus: editVerification,
        id: selectedUser.id,
      });
      setSuccess(true);
      // Refresh user list
      await fetchUsers();
      setTimeout(() => {
        setSelectedUser(null);
        setSuccess(false);
      }, 1500);
    } catch (e) {
      console.error("Save failed:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog onOpenChange={(open) => { if (open) fetchUsers(); else setSelectedUser(null); }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-12 gap-2 border-2 border-primary/30 rounded-xl text-primary hover:bg-primary/5"
        >
          <Shield className="h-4 w-4" />
          Manage User Roles & Verification
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[560px] rounded-3xl p-0 overflow-hidden">
        {!selectedUser ? (
          <>
            <DialogHeader className="px-6 pt-6 pb-3 border-b">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Users className="h-5 w-5 text-primary" />
                User Management
              </DialogTitle>
            </DialogHeader>

            <div className="px-6 py-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email or role..."
                  className="pl-9 rounded-xl"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="h-[420px]">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">No users found.</div>
              ) : (
                <div className="flex flex-col divide-y">
                  {filtered.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => openEdit(u)}
                      className="flex items-center gap-4 px-6 py-3 text-left hover:bg-muted/50 transition-colors group"
                    >
                      <Avatar className="h-10 w-10 border flex-shrink-0">
                        <AvatarImage src={u.avatarUrl} />
                        <AvatarFallback className="text-xs font-bold">
                          {(u.name || u.email || "?")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{u.name || "—"}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge variant={ROLE_COLORS[u.role] as any || "secondary"} className="capitalize text-[10px] py-0 h-4">
                          {u.role || "customer"}
                        </Badge>
                        {u.verificationStatus && u.verificationStatus !== "unverified" && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            {VerificationIcon[u.verificationStatus]}
                            {u.verificationStatus}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <>
            <DialogHeader className="px-6 pt-6 pb-3 border-b">
              <button
                onClick={() => setSelectedUser(null)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2 transition-colors w-fit"
              >
                ← Back to list
              </button>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border">
                  <AvatarImage src={selectedUser.avatarUrl} />
                  <AvatarFallback>{(selectedUser.name || "?")[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-base font-bold">{selectedUser.name || "—"}</DialogTitle>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
            </DialogHeader>

            <div className="px-6 py-6 space-y-6">
              {/* Current info */}
              <div className="rounded-xl bg-muted/40 p-4 space-y-2">
                {selectedUser.professionalType && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Professional Type</span>
                    <span className="font-medium capitalize">{selectedUser.professionalType}</span>
                  </div>
                )}
                {selectedUser.regNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reg Number</span>
                    <span className="font-medium">{selectedUser.regNumber}</span>
                  </div>
                )}
                {selectedUser.facilityName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Facility</span>
                    <span className="font-medium">{selectedUser.facilityName}</span>
                  </div>
                )}
                {selectedUser.facilityRegNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Facility Reg No</span>
                    <span className="font-medium">{selectedUser.facilityRegNumber}</span>
                  </div>
                )}
                {(!selectedUser.professionalType && !selectedUser.regNumber && !selectedUser.facilityName) && (
                  <p className="text-xs text-muted-foreground italic">No professional or facility details submitted.</p>
                )}
              </div>

              <Separator />

              {/* Role assignment */}
              <div className="space-y-2">
                <Label className="font-semibold">Assign Role</Label>
                <p className="text-xs text-muted-foreground">Only admins can assign staff or admin roles.</p>
                <select
                  className="w-full p-2.5 rounded-xl border bg-background text-sm"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                >
                  <option value="customer">Customer</option>
                  <option value="professional">Professional</option>
                  <option value="wholesaler">Wholesaler</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Verification status */}
              <div className="space-y-2">
                <Label className="font-semibold">Verification Status</Label>
                <select
                  className="w-full p-2.5 rounded-xl border bg-background text-sm"
                  value={editVerification}
                  onChange={(e) => setEditVerification(e.target.value)}
                >
                  <option value="unverified">Unverified</option>
                  <option value="pending">Pending Review</option>
                  <option value="verified">Verified ✓</option>
                  <option value="rejected">Rejected ✗</option>
                </select>
              </div>
            </div>

            <DialogFooter className="px-6 pb-6">
              {success ? (
                <div className="flex items-center gap-2 text-green-600 font-medium w-full justify-center">
                  <CheckCircle className="h-4 w-4" />
                  Saved successfully!
                </div>
              ) : (
                <Button onClick={handleSave} disabled={saving} className="w-full h-11 rounded-xl">
                  {saving ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
