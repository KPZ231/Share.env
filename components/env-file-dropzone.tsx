"use client";

import { useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { UploadSimple } from "@phosphor-icons/react";

const ACCEPTED_TYPES = [".env", "text/plain", ""];
const MAX_FILE_BYTES = 256 * 1024;

export function EnvFileDropzone({
  onFile,
  hint,
  activeHint,
  fileTypeError,
  fileSizeError,
}: {
  onFile: (file: File) => void;
  hint: string;
  activeHint: string;
  fileTypeError: string;
  fileSizeError: string;
}) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const ext = file.name.slice(file.name.lastIndexOf("."));
    if (ext !== ".env" && !ACCEPTED_TYPES.includes(file.type)) {
      toast.error(fileTypeError);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error(fileSizeError);
      return;
    }
    onFile(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center transition-colors ${
        dragActive ? "border-accent bg-accent/10" : "border-hairline-strong"
      }`}
    >
      <UploadSimple size={24} className="text-mute" />
      <p className="text-sm text-body">{dragActive ? activeHint : hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept=".env,text/plain"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
