"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AudioLines, ExternalLink, FileText, LoaderCircle, Plus, Search, Upload, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type MediaKind = "VIDEO" | "AUDIO" | "DOCUMENT";
type SavedMedia = {
  id: string;
  title: string;
  description: string | null;
  kind: "VIDEO" | "AUDIO" | "DOCUMENT" | "PDF";
  fileUrl: string;
  createdAt: string;
  mediaType?: { name: string };
  topic?: { id: string; name: string } | null;
};
type Subject = { id: string; name: string; code: string | null; parentSubject: { id: string; name: string } | null };
type Tab = "VIDEO" | "AUDIO" | "DOCUMENT";

const tabs: { value: Tab; label: string; icon: typeof Video }[] = [
  { value: "VIDEO", label: "Video", icon: Video },
  { value: "AUDIO", label: "Audio", icon: AudioLines },
  { value: "DOCUMENT", label: "Document", icon: FileText },
];

async function responseError(response: Response) {
  const body = await response.json().catch(() => ({}));
  return typeof body.error === "string" ? body.error : "Something went wrong. Please try again.";
}

export function SubjectMediaLibrary({ subjectId }: { subjectId: string }) {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [media, setMedia] = useState<SavedMedia[]>([]);
  const [tab, setTab] = useState<Tab>("VIDEO");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/teacher/media/${subjectId}`, { cache: "no-store" });
      if (!response.ok) throw new Error(await responseError(response));
      const data = await response.json();
      setSubject(data.subject);
      setMedia(data.media ?? []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load subject media.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [subjectId]);

  const visibleMedia = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return media.filter((item) => {
      const kindMatches = tab === "DOCUMENT" ? item.kind === "DOCUMENT" || item.kind === "PDF" : item.kind === tab;
      const textMatches = !search || [item.title, item.description ?? "", item.topic?.name ?? ""]
        .some((value) => value.toLocaleLowerCase().includes(search));
      return kindMatches && textMatches;
    });
  }, [media, query, tab]);

  function resetForm() {
    setFile(null);
    setTitle("");
    setDescription("");
    formRef.current?.reset();
  }

  async function createMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Select a file to upload.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("title", title);
      formData.set("description", description);
      formData.set("kind", tab);
      const response = await fetch(`/api/teacher/media/${subjectId}`, { method: "POST", body: formData });
      if (!response.ok) throw new Error(await responseError(response));
      await load();
      setDialogOpen(false);
      resetForm();
      setNotice("Media uploaded and saved successfully.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to upload this media.");
    } finally {
      setSaving(false);
    }
  }

  const accept = tab === "VIDEO"
    ? "video/*"
    : tab === "AUDIO"
      ? "audio/*"
      : ".pdf,.doc,.docx,.ppt,.pptx,.txt,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain";

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link href="/teacher/media" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All subjects</Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{subject?.name ?? "Subject media"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subject?.parentSubject?.name ? `${subject.parentSubject.name} · ` : ""}Browse and manage media saved for this sub-subject.</p>
          </div>
          <button type="button" onClick={() => { setError(""); setDialogOpen(true); }} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"><Plus className="h-4 w-4" /> Create media</button>
        </div>
      </div>

      {error && <div role="alert" className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
      {notice && !error && <div role="status" className="border border-emerald-600/20 bg-emerald-600/5 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

      <div className="flex flex-col gap-3 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Media type" className="flex gap-1 overflow-x-auto">
          {tabs.map(({ value, label, icon: Icon }) => {
            const count = media.filter((item) => value === "DOCUMENT" ? item.kind === "DOCUMENT" || item.kind === "PDF" : item.kind === value).length;
            return <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${tab === value ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}><Icon className="h-4 w-4" />{label}<Badge variant="secondary" className="text-xs">{count}</Badge></button>;
          })}
        </div>
        <label className="relative mb-2 block w-full sm:mb-0 sm:max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Filter ${tab.toLocaleLowerCase()} media`} className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" /></label>
      </div>

      {loading ? <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading media…</div> : visibleMedia.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleMedia.map((item) => <article key={item.id} className="overflow-hidden rounded-xl border border-border bg-card">
            {item.kind === "VIDEO" ? <video className="aspect-video w-full bg-black object-contain" controls preload="metadata" src={item.fileUrl}>Your browser does not support video playback.</video>
              : item.kind === "AUDIO" ? <div className="flex aspect-video flex-col items-center justify-center gap-5 bg-accent/5 p-6"><AudioLines className="h-12 w-12 text-accent" /><audio className="w-full" controls preload="metadata" src={item.fileUrl}>Your browser does not support audio playback.</audio></div>
                : <a href={item.fileUrl} target="_blank" rel="noreferrer" className="flex aspect-video flex-col items-center justify-center gap-3 bg-foreground/5 text-muted-foreground transition hover:bg-foreground/10 hover:text-accent"><FileText className="h-12 w-12" /><span className="text-sm font-medium">Open document</span></a>}
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3"><h2 className="font-semibold leading-snug">{item.title}</h2><a href={item.fileUrl} target="_blank" rel="noreferrer" aria-label={`Open ${item.title}`} className="rounded p-1 text-muted-foreground hover:bg-foreground/5 hover:text-accent"><ExternalLink className="h-4 w-4" /></a></div>
              {item.description && <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>}
              <div className="flex flex-wrap items-center gap-2 pt-1"><Badge variant="outline" className="text-xs">{item.kind === "PDF" ? "Document · PDF" : item.kind.toLocaleLowerCase()}</Badge>{item.topic?.name && <Badge variant="secondary" className="max-w-full truncate text-xs">{item.topic.name}</Badge>}<span className="ml-auto text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span></div>
            </div>
          </article>)}
        </div>
      ) : <div className="rounded-xl border border-dashed border-border px-5 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">{tab === "VIDEO" ? <Video className="h-5 w-5" /> : tab === "AUDIO" ? <AudioLines className="h-5 w-5" /> : <FileText className="h-5 w-5" />}</div><h2 className="mt-4 font-semibold">{query ? "No matching media" : `No ${tab.toLocaleLowerCase()} media yet`}</h2><p className="mt-1 text-sm text-muted-foreground">{query ? "Try a different search term." : "Upload a resource for this subject to get started."}</p>{!query && <button type="button" onClick={() => setDialogOpen(true)} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"><Plus className="h-4 w-4" /> Create media</button>}</div>}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>Create media</DialogTitle><DialogDescription>Upload a {tab.toLocaleLowerCase()} resource to Cloudinary and save it to {subject?.name ?? "this subject"}.</DialogDescription></DialogHeader>
          <form ref={formRef} onSubmit={createMedia} className="space-y-4">
            <label className="block space-y-1.5 text-sm font-medium"><span>Title</span><input maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Use the file name if left blank" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" /></label>
            <label className="block space-y-1.5 text-sm font-medium"><span>Description (optional)</span><textarea maxLength={1000} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add a short description" className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" /></label>
            <label className="block space-y-1.5 text-sm font-medium"><span>File <span className="text-destructive">*</span></span><span className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-foreground/[0.02] px-4 py-8 text-center transition hover:border-accent"><Upload className="h-6 w-6 text-muted-foreground" /><span className="text-sm">{file ? file.name : `Choose ${tab.toLocaleLowerCase()} file`}</span><span className="text-xs text-muted-foreground">Maximum file size: 100 MB</span><input required type="file" accept={accept} onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="sr-only" /></span></label>
            <DialogFooter className="gap-2 sm:gap-0"><button type="button" onClick={() => setDialogOpen(false)} className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-foreground/5">Cancel</button><button type="submit" disabled={saving || !file} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{saving ? "Uploading…" : "Upload media"}</button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
