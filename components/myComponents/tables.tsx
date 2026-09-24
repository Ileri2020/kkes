"use client"

import { useEffect, useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type TableColumn = {
  key: string
  label: string
  type: "text" | "number" | "boolean" | "date"
  required?: boolean
  className?: string
  readOnly?: boolean
  conditionalFields?: {
    key: string
    label: string
  }[]
}

export type TableRow = Record<string, string | number | boolean | undefined>

interface TablesProps {
  columns: TableColumn[]
  defaultRowCount?: number
  rows?: TableRow[]
  onRowsChange?: (rows: TableRow[]) => void
  autocomplete?: Record<string, string[]>
  restrictToOptions?: string[]
  showTotals?: boolean
  minWidth?: string
  readOnly?: boolean
  focusRowIndex?: number
}

function createBlankRow(columns: TableColumn[]) {
  return columns.reduce((acc, column) => {
    acc[column.key] = column.type === "boolean" ? false : ""
    return acc
  }, {} as TableRow)
}

export function Tables({
  columns,
  defaultRowCount = 4,
  rows,
  onRowsChange,
  autocomplete,
  showTotals = false,
  minWidth = "1100px",
  readOnly = false,
  focusRowIndex,
}: TablesProps) {
  const [activeSuggestion, setActiveSuggestion] = useState<{ rowIndex: number; columnKey: string } | null>(null)
  const [quantityDialog, setQuantityDialog] = useState<{ rowIndex: number; column: TableColumn } | null>(null)
  const [internalRows, setInternalRows] = useState<TableRow[]>(
    () => Array.from({ length: defaultRowCount }, () => createBlankRow(columns))
  )

  const controlled = rows !== undefined
  const activeRows = controlled ? rows! : internalRows

  useEffect(() => {
    if (controlled) return
    setInternalRows(Array.from({ length: defaultRowCount }, () => createBlankRow(columns)))
  }, [controlled, defaultRowCount, columns])

  useEffect(() => {
    if (!controlled) return
    setInternalRows(rows ?? [])
  }, [controlled, rows])

  const updateRows = (updated: TableRow[]) => {
    if (controlled) {
      onRowsChange?.(updated)
    } else {
      setInternalRows(updated)
      onRowsChange?.(updated)
    }
  }

  const handleCellChange = (
    rowIndex: number,
    column: TableColumn,
    value: string | boolean
  ) => {
    const newRows = [...activeRows]
    const row = { ...newRows[rowIndex] }

    if (column.type === "boolean") {
      row[column.key] = Boolean(value)
    } else if (column.type === "number") {
      row[column.key] = value === "" ? "" : Number(value)
    } else {
      row[column.key] = value
    }

    if (column.key === "salesPrice") {
      row._salesPriceManual = true
    }

    newRows[rowIndex] = row
    updateRows(newRows)
  }

  const [snEditableRows, setSnEditableRows] = useState<Record<number, boolean>>({})

  const addRow = () => {
    updateRows([
      ...activeRows,
      ...Array.from({ length: 5 }, () => createBlankRow(columns)),
    ])
  }

  const footerTotals = useMemo(() => {
    if (!showTotals) {
      return null
    }

    return columns.reduce((acc, column) => {
      if (column.type === "number") {
        acc[column.key] = activeRows.reduce((sum, row) => {
          const value = row[column.key]
          return sum + (typeof value === "number" ? value : Number(value) || 0)
        }, 0)
      }
      return acc
    }, {} as Record<string, number>)
  }, [activeRows, columns, showTotals])

  useEffect(() => {
    if (focusRowIndex !== undefined && focusRowIndex >= 0) {
      const targetId = `cell-${focusRowIndex}-productName`
      const timer = setTimeout(() => {
        const element = document.getElementById(targetId)
        if (element) {
          element.focus({ preventScroll: true })
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [focusRowIndex])

  const filteredSuggestions = useMemo(() => {
    if (!activeSuggestion) return []
    const { rowIndex, columnKey } = activeSuggestion
    const val = String(activeRows[rowIndex]?.[columnKey] ?? "").toLowerCase()
    if (val.length < 4) return []
    const list = autocomplete?.[columnKey] ?? []
    return list.filter((item) => item.toLowerCase().includes(val)).slice(0, 10)
  }, [activeSuggestion, activeRows, autocomplete])

  return (
    <div className="relative w-full max-w-full pb-14">
      <div className="w-full max-w-full overflow-x-auto touch-pan-x touch-pan-y scrollbar-thin [webkit-overflow-scrolling:touch] [overscroll-behavior-x:contain]">
      <div style={{ minWidth }}>
        <Table className="bg-foreground/10">
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={`${column.key === "productName" ? "w-[300px] min-w-[260px]" : ""} ${column.type === "boolean" ? "w-[50px] max-w-[50px] min-w-[50px]" : ""} ${column.className ?? ""}`}
              >
                <div className="flex items-center justify-center text-center">{column.label}</div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeRows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column) => {
                const value = row[column.key]
                const isSn = column.key === "sn"
                const isSnEditable = Boolean(snEditableRows[rowIndex])
                const displayValue = isSn
                  ? String(value === undefined || value === "" ? rowIndex + 1 : value)
                  : value === undefined || value === null
                  ? ""
                  : String(value)

                const isCurrentSuggestionActive = activeSuggestion?.rowIndex === rowIndex && activeSuggestion?.columnKey === column.key

                return (
                  <TableCell
                    key={column.key}
                    className={`align-top py-2 ${column.key === "productName" ? "w-[300px] min-w-[260px]" : ""} ${column.type === "boolean" ? "w-[50px] max-w-[50px] min-w-[50px]" : ""} ${column.type === "number" ? "max-w-[120px]" : ""} ${column.className ?? ""}`}
                  >
                    {column.type === "boolean" ? (
                      <div className="flex w-[50px] max-w-[50px] items-center justify-center gap-2 whitespace-nowrap">
                        <Checkbox
                          checked={Boolean(value)}
                          disabled={readOnly}
                          onCheckedChange={(checked) => {
                            if (readOnly) return
                            const enabled = checked ?? false
                            handleCellChange(rowIndex, column, enabled)
                            if (enabled && column.conditionalFields?.length) {
                              setQuantityDialog({ rowIndex, column })
                            }
                          }}
                        />
                        {!readOnly && Boolean(value) && column.conditionalFields?.length ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => setQuantityDialog({ rowIndex, column })}
                          >
                            🖊️edit
                          </Button>
                        ) : null}
                      </div>
                    ) : isSn && !isSnEditable ? (
                      <div
                        className="cursor-pointer px-2 py-1 text-sm text-muted-foreground"
                        onDoubleClick={() => {
                          setSnEditableRows((prev) => ({
                            ...prev,
                            [rowIndex]: true,
                          }))
                        }}
                      >
                        {rowIndex + 1}
                      </div>
                    ) : (
                      <div className="relative space-y-1">
                        <Input
                          id={`cell-${rowIndex}-${column.key}`}
                          type={column.type === "number" ? "number" : column.type === "date" ? "date" : "text"}
                          className={column.type === "number" ? "max-w-[120px]" : undefined}
                          value={displayValue}
                          placeholder={column.label}
                          onFocus={() => {
                            if (column.type === "text" && displayValue.length >= 4) {
                              setActiveSuggestion({ rowIndex, columnKey: column.key })
                            }
                          }}
                          onChange={(event) => {
                            handleCellChange(rowIndex, column, event.target.value)
                            if (column.type === "text" && event.target.value.length >= 4) {
                              setActiveSuggestion({ rowIndex, columnKey: column.key })
                            } else {
                              setActiveSuggestion(null)
                            }
                          }}
                          readOnly={readOnly || column.readOnly}
                          onBlur={() => {
                            if (isSn) {
                              setSnEditableRows((prev) => ({
                                ...prev,
                                [rowIndex]: false,
                              }))
                            }
                            window.setTimeout(() => setActiveSuggestion(null), 150)
                          }}
                        />
                        {isCurrentSuggestionActive && filteredSuggestions.length > 0 ? (
                          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                            {filteredSuggestions.map((item) => (
                              <button
                                key={item}
                                type="button"
                                className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                                onMouseDown={(event) => {
                                  event.preventDefault()
                                  handleCellChange(rowIndex, column, item)
                                  setActiveSuggestion(null)
                                }}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
          {footerTotals ? (
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.key} className="font-semibold">
                  {column.type === "number" ? footerTotals[column.key] : ""}
                </TableCell>
              ))}
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      </div>
      </div>
      {!readOnly && <div className="absolute bottom-2 right-2 z-20 justify-end">
        <Button type="button" variant="secondary" onClick={addRow}>
          Add row
        </Button>
      </div>}
      <Dialog open={quantityDialog !== null} onOpenChange={(open) => !open && setQuantityDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Set {quantityDialog?.column.label.toLowerCase()} quantities</DialogTitle>
            <DialogDescription>Enter the quantities for this row.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {quantityDialog?.column.conditionalFields?.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`quantity-${quantityDialog.rowIndex}-${field.key}`}>{field.label}</Label>
                <Input
                  id={`quantity-${quantityDialog.rowIndex}-${field.key}`}
                  type="number"
                  min="0"
                  value={String(activeRows[quantityDialog.rowIndex]?.[field.key] ?? "")}
                  onChange={(event) => handleCellChange(quantityDialog.rowIndex, { ...quantityDialog.column, key: field.key, type: "number" }, event.target.value)}
                />
              </div>
            ))}
            {quantityDialog ? (() => {
              const rowData = activeRows[quantityDialog.rowIndex] || {}
              const isCarton = quantityDialog.column.key === "carton"
              const isPack = quantityDialog.column.key === "pack"
              const pCount = Number(rowData.pcsCount) || 1

              if (isCarton) {
                const cQty = Number(rowData.cartonQty) || 0
                const ppc = Number(rowData.packsPerCarton) || 1
                const totalPcsFromCarton = cQty * ppc * pCount
                return (
                  <div className="space-y-1.5 rounded-md border border-border/60 bg-muted/40 p-3">
                    <Label className="text-xs font-semibold text-muted-foreground">Total Pcs from Cartons (Read-only)</Label>
                    <div className="text-base font-bold text-foreground">{totalPcsFromCarton.toLocaleString()} Pcs</div>
                  </div>
                )
              }

              if (isPack) {
                const pkQty = Number(rowData.packQty) || 0
                const totalPcsFromPack = pkQty * pCount
                return (
                  <div className="space-y-1.5 rounded-md border border-border/60 bg-muted/40 p-3">
                    <Label className="text-xs font-semibold text-muted-foreground">Total Pcs from Packs (Read-only)</Label>
                    <div className="text-base font-bold text-foreground">{totalPcsFromPack.toLocaleString()} Pcs</div>
                  </div>
                )
              }

              return null
            })() : null}
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setQuantityDialog(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Tables
