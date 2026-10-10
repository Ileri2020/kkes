"use client";

import { FormEvent, useState } from "react";
import { Building2, LoaderCircle, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Props = { onCreated?: (name: string) => void; compact?: boolean };

export function DepartmentCreateButton({ onCreated, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function createDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/teacher/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to create department.");
      onCreated?.(result.department.name);
      setName("");
      setOpen(false);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create department.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => { setError(""); setOpen(true); }} className={`inline-flex items-center justify-center gap-2 border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:border-accent hover:text-accent ${compact ? "px-3 py-2" : ""}`}>
        {compact ? <Building2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />} Create department
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create department</DialogTitle>
            <DialogDescription>Add a department to this school. It will be available for class and subject organization.</DialogDescription>
          </DialogHeader>
          <form onSubmit={createDepartment} className="space-y-4">
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Department name <span className="text-destructive">*</span></span>
              <input required maxLength={80} autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Science" className="h-10 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </label>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <button type="button" onClick={() => setOpen(false)} className="border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-60">
                {saving && <LoaderCircle className="h-4 w-4 animate-spin" />} Save department
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
