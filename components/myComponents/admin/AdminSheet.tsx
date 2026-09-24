"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Plus, 
  Loader2, 
  CheckCircle2, 
  RefreshCcw,
  Package,
  Tags,
  Activity,
  Layers,
  Factory,
  MoreVertical,
  Trash2,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

type SheetModel = "product" | "category" | "brand" | "activeIngredient" | "stock" | "bulkPrice";

interface ColumnDef {
  key: string;
  header: string;
  type: "text" | "number" | "select" | "multiselect" | "boolean" | "relation-child";
  relationModel?: string;
  readOnly?: boolean;
}

const SHEETS: Record<SheetModel, { header: string; icon: any; columns: ColumnDef[] }> = {
  product: {
    header: "Products",
    icon: Package,
    columns: [
      { key: "name", header: "Name", type: "text" },
      { key: "categoryId", header: "Category", type: "select", relationModel: "category" },
      { key: "brandId", header: "Brand", type: "select", relationModel: "brand" },
      { key: "price", header: "Price (₦)", type: "number" },
      { key: "activeIngredients", header: "Ingredients", type: "multiselect", relationModel: "activeIngredient" },
      { key: "scarce", header: "Scarce", type: "boolean" },
      { key: "requiresPrescription", header: "Prescription", type: "boolean" },
      { key: "stock", header: "Units", type: "relation-child", readOnly: true },
    ],
  },
  category: {
    header: "Categories",
    icon: Layers,
    columns: [
      { key: "name", header: "Category Name", type: "text" },
      { key: "description", header: "Description", type: "text" },
      { key: "image", header: "Image URL", type: "text" },
    ],
  },
  brand: {
    header: "Brands",
    icon: Factory,
    columns: [
      { key: "name", header: "Brand Name", type: "text" },
      { key: "order", header: "Sort Order", type: "number" },
    ],
  },
  activeIngredient: {
    header: "Ingredients",
    icon: Activity,
    columns: [
      { key: "name", header: "Ingredient Name", type: "text" },
    ],
  },
  stock: {
    header: "Inventory",
    icon: Database,
    columns: [
      { key: "productId", header: "Product", type: "select", relationModel: "product" },
      { key: "addedQuantity", header: "Qty Added", type: "number" },
      { key: "costPerProduct", header: "Cost (₦)", type: "number" },
    ],
  },
  bulkPrice: {
    header: "Bulk Prices",
    icon: Tags,
    columns: [
      { key: "productId", header: "Product", type: "select", relationModel: "product" },
      { key: "name", header: "Unit Name", type: "text" },
      { key: "quantity", header: "Qty In Unit", type: "number" },
      { key: "price", header: "Bulk Price (₦)", type: "number" },
    ],
  },
};

export const AdminSheet = () => {
  const [activeModel, setActiveModel] = useState<SheetModel>("product");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [relations, setRelations] = useState<Record<string, any[]>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/sheet?model=${activeModel}`);
      setData(res.data);
    } catch (err) {
      toast.error("Failed to fetch sheet data");
    } finally {
      setLoading(false);
    }
  };

  const fetchRelations = async () => {
    try {
      const models = ["category", "brand", "activeIngredient", "product"];
      const results = await Promise.all(models.map(m => axios.get(`/api/sheet?model=${m}`)));
      const rels: any = {};
      models.forEach((m, i) => rels[m] = results[i].data);
      setRelations(rels);
    } catch (err) {
      console.error("Relation sync error", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRelations();
  }, [activeModel]);

  const handleUpdate = async (id: string, field: string, value: any) => {
    const originalValue = data.find(d => d.id === id)?.[field];
    
    // 1. Optimistic UI Update
    setData(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
    setSaving(`${id}-${field}`);

    try {
      await axios.put("/api/sheet", { model: activeModel, id, field, value });
      toast.success("Saved");
    } catch (err) {
      // 2. Rollback on Failure
      setData(prev => prev.map(row => row.id === id ? { ...row, [field]: originalValue } : row));
      toast.error("Cloud sync failed");
    } finally {
      setSaving(null);
    }
  };

  const deleteRow = async (id: string) => {
    if (!confirm("Are you sure? This action is permanent.")) return;
    try {
      await axios.delete(`/api/sheet?model=${activeModel}&id=${id}`);
      setData(prev => prev.filter(row => row.id !== id));
      toast.success("Deleted from database");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const createRow = async () => {
    try {
      const res = await axios.post("/api/sheet", { model: activeModel, data: {} });
      setData(prev => [res.data, ...prev]);
      toast.success("New empty record created");
    } catch (err) {
      toast.error("Failed to create record");
    }
  };

  const renderCell = (row: any, col: ColumnDef) => {
    const value = row[col.key];
    const isSaving = saving === `${row.id}-${col.key}`;

    if (col.readOnly) {
      if (col.type === "relation-child") {
         const count = Array.isArray(value) ? value.reduce((s: number, i: any) => s + (i.addedQuantity || 0), 0) : 0;
         return <Badge variant={count > 0 ? "default" : "outline"} className="text-[10px] font-mono h-5">
           {count} Units
         </Badge>;
      }
      return <span className="text-[10px] text-muted-foreground">{String(value || "—")}</span>;
    }

    switch (col.type) {
      case "text":
        return (
          <Input 
            defaultValue={value}
            className="h-9 text-xs border-transparent hover:border-input focus:border-primary transition-all bg-transparent focus:bg-white"
            onBlur={(e) => {
              if (e.target.value !== value) handleUpdate(row.id, col.key, e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
          />
        );

      case "number":
        return (
          <Input 
            type="number"
            defaultValue={value}
            className="h-9 text-xs border-transparent hover:border-input focus:border-primary bg-transparent focus:bg-white text-right font-mono"
            onBlur={(e) => {
              const num = parseFloat(e.target.value);
              if (num !== value) handleUpdate(row.id, col.key, isNaN(num) ? 0 : num);
            }}
          />
        );

      case "boolean":
        return (
          <div className="flex justify-center w-full">
            <Checkbox 
                checked={!!value} 
                onCheckedChange={(checked) => handleUpdate(row.id, col.key, checked)}
            />
          </div>
        );

      case "select":
        const opts = relations[col.relationModel!] || [];
        return (
          <Select 
            value={value || "unassigned"} 
            onValueChange={(val) => handleUpdate(row.id, col.key, val)}
          >
            <SelectTrigger className="h-8 text-[10px] border-transparent hover:border-input bg-transparent px-2 w-full">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {opts.map((opt: any) => (
                <SelectItem key={opt.id} value={opt.id} className="text-[10px]">
                  {opt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multiselect":
        const currentItems = Array.isArray(value) ? value.map((i: any) => i.name) : [];
        const allPossible = relations[col.relationModel!] || [];
        
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="h-8 w-full justify-start px-2 font-normal text-[10px] border-transparent hover:border-input">
                {currentItems.length > 0 ? (
                  <div className="flex gap-1 overflow-hidden">
                    {currentItems.slice(0, 2).map((v, idx) => (
                      <Badge key={idx} variant="secondary" className="px-1 text-[8px] h-4">{v}</Badge>
                    ))}
                    {currentItems.length > 2 && <span className="text-[8px] text-muted-foreground">+{currentItems.length - 2}</span>}
                  </div>
                ) : <span className="text-muted-foreground italic">Add...</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              <Command>
                <CommandInput placeholder={`Search ${col.header}...`} />
                <CommandEmpty>No matching found.</CommandEmpty>
                <CommandGroup className="max-h-60 overflow-y-auto">
                  {allPossible.map((opt) => (
                    <CommandItem
                      key={opt.id}
                      onSelect={() => {
                        const exists = currentItems.includes(opt.name);
                        const next = exists 
                          ? currentItems.filter(i => i !== opt.name)
                          : [...currentItems, opt.name];
                        handleUpdate(row.id, col.key, next);
                      }}
                      className="text-xs font-bold"
                    >
                      <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", currentItems.includes(opt.name) ? "bg-primary text-primary-foreground" : "opacity-50")}>
                        {currentItems.includes(opt.name) && <CheckCircle2 className="h-3 w-3" />}
                      </div>
                      {opt.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        );

      default:
        return <span className="text-xs px-2">{String(value || "")}</span>;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background select-none">
      {/* HEADERBAR */}
      <div className="flex flex-col bg-muted/30 border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-black rounded-lg flex items-center justify-center text-white">
               <Database size={20} />
            </div>
            <div>
               <h1 className="text-xl font-black italic uppercase tracking-tighter">CliqueSheet<span className="text-primary italic font-medium ml-1">v2.0</span></h1>
               <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Active Sync Enabled</span>
               </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <Button variant="outline" size="sm" onClick={fetchData} className="h-8 gap-2 uppercase font-black text-[10px] tracking-widest border-2">
               <RefreshCcw size={12} className={loading ? "animate-spin" : ""} /> Sync Cloud
             </Button>
             <Button size="sm" onClick={createRow} className="h-8 gap-2 uppercase font-black text-[10px] tracking-widest">
               <Plus size={12} /> New Record
             </Button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex px-4 gap-1 overflow-x-auto">
          {(Object.keys(SHEETS) as SheetModel[]).map((key) => {
            const S = SHEETS[key];
            const active = activeModel === key;
            return (
              <button
                key={key}
                onClick={() => setActiveModel(key)}
                className={cn(
                  "px-6 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all border-b-2",
                  active ? "border-primary text-primary bg-white shadow-sm" : "border-transparent text-muted-foreground hover:bg-muted/50"
                )}
              >
                {S.header}
              </button>
            );
          })}
        </div>
      </div>

      {/* GRID */}
      <div className="flex-1 overflow-auto relative bg-[#fcfcfc]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm z-50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Refreshing Model Layer...</span>
          </div>
        ) : (
          <Table className="border-collapse table-fixed w-full">
            <TableHeader className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b shadow-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-center border-r h-10 text-[10px] font-black">#</TableHead>
                {SHEETS[activeModel].columns.map((col) => (
                  <TableHead key={col.key} className="text-[10px] font-black uppercase tracking-wider text-foreground border-r px-4 h-10 min-w-[140px]">
                    <div className="flex items-center justify-between">
                       {col.header}
                       <ChevronDown size={10} className="opacity-40" />
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-14"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={row.id} className="group hover:bg-indigo-50/20 transition-all even:bg-muted/5">
                  <TableCell className="text-[10px] font-mono text-center border-r text-muted-foreground/50">
                    {String(i + 1).padStart(3, '0')}
                  </TableCell>
                  {SHEETS[activeModel].columns.map((col) => (
                    <TableCell key={col.key} className={cn("p-0 border-r relative", saving === `${row.id}-${col.key}` && "bg-primary/5")}>
                       <div className="w-full h-10 flex items-center relative">
                          {renderCell(row, col)}
                          {saving === `${row.id}-${col.key}` && (
                            <div className="absolute right-1">
                               <Loader2 className="h-3 w-3 animate-spin text-primary" />
                            </div>
                          )}
                       </div>
                    </TableCell>
                  ))}
                  <TableCell className="p-0 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"><MoreVertical size={12} /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-[11px] font-black uppercase">
                         <DropdownMenuItem onClick={() => window.open(`/products/${row.id}`)} className="gap-2">
                            <ExternalLink size={12} /> View Public
                         </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => deleteRow(row.id)} className="text-destructive gap-2 font-black">
                            <Trash2 size={12} /> Remove Record
                         </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* STATUSBAR */}
      <div className="h-8 border-t bg-muted/20 px-6 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
         <div className="flex gap-6 items-center">
            <span className="text-foreground">Total Rows: {data.length}</span>
            <div className="h-3 w-[1px] bg-muted-foreground/30" />
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Database Ready</span>
         </div>
         <div>
            CliqueAdmin • High Performance Grid Engine
         </div>
      </div>
    </div>
  );
};
