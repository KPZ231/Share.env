"use client";

import { type ClipboardEvent, type Dispatch, type SetStateAction } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Eye, EyeSlash, Plus, Trash } from "@phosphor-icons/react";
import { parseEnv, type EnvPair } from "@/lib/env-format";

export type Row = { id: string; key: string; value: string; masked: boolean };

let rowCounter = 0;
export function newRow(key = "", value = ""): Row {
  rowCounter += 1;
  return { id: `row-${rowCounter}`, key, value, masked: true };
}

export function rowsFromPairs(pairs: EnvPair[]): Row[] {
  return pairs.length > 0 ? pairs.map((p) => newRow(p.key, p.value)) : [newRow()];
}

export function pairsFromRows(rows: Row[]): EnvPair[] {
  return rows.filter((r) => r.key.trim()).map((r) => ({ key: r.key.trim(), value: r.value }));
}

/** Shared key/value grid: keyboard-driven row add/remove, paste-a-whole-.env bulk-fill, masking. */
export function EnvPairsGrid({
  rows,
  setRows,
  onSubmit,
  readOnly = false,
}: {
  rows: Row[];
  setRows: Dispatch<SetStateAction<Row[]>>;
  onSubmit: () => void;
  readOnly?: boolean;
}) {
  const t = useTranslations("environments.new");

  function updateRow(id: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  function addRow(focusKey = true) {
    const row = newRow();
    setRows((prev) => [...prev, row]);
    if (focusKey) {
      requestAnimationFrame(() => {
        document.getElementById(`key-${row.id}`)?.focus();
      });
    }
  }

  function handlePasteIntoKey(e: ClipboardEvent<HTMLInputElement>, rowId: string) {
    const text = e.clipboardData.getData("text");
    if (!text.includes("=") || !text.includes("\n")) return; // single value paste, let it through
    const parsed = parseEnv(text);
    if (parsed.length === 0) return;
    e.preventDefault();
    setRows((prev) => {
      const withoutBlankTarget = prev.filter((r) => r.id !== rowId || r.key || r.value);
      return [...withoutBlankTarget, ...parsed.map((p) => newRow(p.key, p.value))];
    });
    toast.success(t("bulkImported", { count: parsed.length }));
  }

  function handleKeyDown(e: React.KeyboardEvent, field: "key" | "value") {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmit();
      return;
    }
    if (e.key === "Enter" && field === "value") {
      e.preventDefault();
      addRow();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {!readOnly && <p className="text-[12px] text-mute">{t("manualHint")}</p>}

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center gap-2">
            <input
              id={`key-${row.id}`}
              type="text"
              value={row.key}
              readOnly={readOnly}
              onChange={(e) => updateRow(row.id, { key: e.target.value })}
              onPaste={(e) => handlePasteIntoKey(e, row.id)}
              onKeyDown={(e) => handleKeyDown(e, "key")}
              placeholder={t("keyPlaceholder")}
              spellCheck={false}
              className="w-2/5 rounded-md border border-hairline bg-background px-3 py-2 font-mono text-[13px] text-foreground outline-none transition-colors focus:border-foreground read-only:opacity-70"
            />
            <input
              type={row.masked ? "password" : "text"}
              value={row.value}
              readOnly={readOnly}
              onChange={(e) => updateRow(row.id, { value: e.target.value })}
              onKeyDown={(e) => handleKeyDown(e, "value")}
              placeholder={t("valuePlaceholder")}
              spellCheck={false}
              className="flex-1 rounded-md border border-hairline bg-background px-3 py-2 font-mono text-[13px] text-foreground outline-none transition-colors focus:border-foreground read-only:opacity-70"
            />
            <button
              type="button"
              onClick={() => updateRow(row.id, { masked: !row.masked })}
              aria-label={row.masked ? t("show") : t("hide")}
              className="shrink-0 rounded-md p-2 text-mute hover:text-foreground"
            >
              {row.masked ? <Eye size={16} /> : <EyeSlash size={16} />}
            </button>
            {!readOnly && (
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                aria-label={t("removeRow")}
                disabled={rows.length === 1}
                className="shrink-0 rounded-md p-2 text-mute hover:text-foreground disabled:opacity-30"
              >
                <Trash size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={() => addRow()}
          className="flex items-center gap-1.5 self-start text-[13px] font-medium text-accent hover:opacity-80"
        >
          <Plus size={14} />
          {t("addRow")}
        </button>
      )}
    </div>
  );
}
