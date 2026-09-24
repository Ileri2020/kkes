"use client";

import React, { useState } from "react";
import axios from "axios";
import { Download, Upload, Loader2, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCcw, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Papa from "papaparse";

export const AdminBulkManager = () => {
    const [model, setModel] = useState("product");
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<{ updated: number, created: number, errors: string[] } | null>(null);

    const handleDownloadCSV = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/admin/bulk?model=${model}`);
            // The API now returns { data, total, page, limit }
            const exportData = res.data.data || res.data;
            const csv = Papa.unparse(exportData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `${model}_bulk_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("CSV Downloaded successfully");
        } catch (err) {
            console.error(err);
            toast.error("Failed to download CSV");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadAllData = async () => {
        toast.info("Full database backup disabled for performance. Export individual models.");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setStats(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const res = await axios.post(`/api/admin/bulk?model=${model}`, {
                        data: results.data
                    });
                    setStats(res.data);
                    toast.success("Bulk update process completed");
                } catch (err: any) {
                    console.error(err);
                    toast.error(err.response?.data?.error || "Failed to upload CSV");
                } finally {
                    setLoading(false);
                }
            },
            error: (err) => {
                toast.error("Error parsing CSV file");
                setLoading(false);
            }
        });
    };

    return (
        <Card className="border-2 border-primary/20 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardHeader className="bg-primary/5 border-b">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <FileSpreadsheet className="text-primary w-6 h-6" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-black">Bulk Data Manager</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase tracking-wider">Spreadsheet Inventory Control</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Database Model</label>
                        <Select value={model} onValueChange={setModel}>
                            <SelectTrigger className="h-12 rounded-xl text-xs font-bold border-2">
                                <SelectValue placeholder="Select component" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="product" className="font-bold text-xs">Products (Inventory)</SelectItem>
                                <SelectItem value="category" className="font-bold text-xs">Categories</SelectItem>
                                <SelectItem value="brand" className="font-bold text-xs">Brands</SelectItem>
                                <SelectItem value="activeIngredient" className="font-bold text-xs">Active Ingredients</SelectItem>
                                <SelectItem value="stock" className="font-bold text-xs">Stock Records</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-2 items-end">
                        <Button 
                            variant="outline" 
                            className="h-12 rounded-xl px-6 gap-2 border-2 font-black text-xs min-w-[140px]" 
                            onClick={handleDownloadCSV}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Export
                        </Button>
                        <Button 
                            variant="secondary" 
                            className="h-12 rounded-xl px-6 gap-2 border-2 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-black text-xs min-w-[140px]" 
                            onClick={handleDownloadAllData}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                            Backup All
                        </Button>
                    </div>
                </div>

                <div className="relative group">
                    <div className="absolute inset-0 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20 group-hover:bg-primary/10 transition-colors" />
                    <input 
                        type="file" 
                        accept=".csv" 
                        onChange={handleFileUpload} 
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        disabled={loading}
                    />
                    <div className="relative py-10 px-6 flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                        </div>
                        <div className="text-center">
                            <p className="font-black text-sm">Upload Updated CSV</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Drag and drop or click to import</p>
                        </div>
                    </div>
                </div>

                {stats && (
                    <div className="p-4 rounded-2xl bg-muted/30 border-2 border-muted-foreground/10 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-center pb-2 border-b">
                            <h4 className="text-xs font-black uppercase tracking-wider">Update Results</h4>
                            {stats.errors.length === 0 ? (
                                <Badge variant="default" className="bg-green-500 hover:bg-green-600 gap-1">
                                    <CheckCircle2 size={10} /> Success
                                </Badge>
                            ) : (
                                <Badge variant="destructive" className="gap-1">
                                    <AlertCircle size={10} /> {stats.errors.length} Issues
                                </Badge>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-background rounded-xl border-t-4 border-primary">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Created</p>
                                <p className="text-2xl font-black text-primary">{stats.created}</p>
                            </div>
                            <div className="p-3 bg-background rounded-xl border-t-4 border-indigo-500">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Updated</p>
                                <p className="text-2xl font-black text-indigo-500">{stats.updated}</p>
                            </div>
                        </div>
                        {stats.errors.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-destructive uppercase">Error Logs:</p>
                                <div className="max-h-24 overflow-y-auto rounded-lg border bg-background/50 p-2 space-y-1">
                                    {stats.errors.map((err, i) => (
                                        <p key={i} className="text-[9px] font-medium leading-tight">{err}</p>
                                    ))}
                                </div>
                            </div>
                        )}
                        <Button variant="ghost" className="w-full text-[10px] font-black gap-2 h-8" onClick={() => setStats(null)}>
                            <RefreshCcw size={12} /> Clear Results
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
