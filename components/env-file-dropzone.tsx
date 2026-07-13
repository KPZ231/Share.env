"use client";

import { useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { UploadSimple } from "@phosphor-icons/react";

const MAX_FILE_BYTES = 256 * 1024;
const NULL_BYTE = String.fromCharCode(0);
// Extension is the only trustworthy signal here — file.type is client-reported
// and empty/spoofable, so it must never be allowed to override this check.
const ALLOWED_EXTENSIONS = [".env", ".txt"];

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

  async function handleFile(file: File) {
    const dotIdx = file.name.lastIndexOf(".");
    const ext = dotIdx === -1 ? file.name : file.name.slice(dotIdx);
    if (!ALLOWED_EXTENSIONS.includes(ext) && file.name !== ".env") {
      toast.error(fileTypeError);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error(fileSizeError);
      return;
    }
    // Binary content (null byte) can't be a real .env file — a renamed
    // executable/image would otherwise sail through the extension check above.
    const text = await file.text();
    if (text.includes(NULL_BYTE)) {
      toast.error(fileTypeError);
      return;
    }
    onFile(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
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
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
