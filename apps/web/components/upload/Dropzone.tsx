"use client";

import { useRef } from "react";

type Props = {
  onFile: (file: File) => void;
};

export default function Dropzone({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div
      className="cursor-pointer rounded-lg border-2 border-dashed border-slate-300 bg-white p-10 text-center hover:border-primary"
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".edi,.txt,.dat,.x12"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onFile(file);
          }
        }}
      />
      <p className="text-sm text-slate-600">Drag & drop is supported by browser, or click here to select a file.</p>
      <p className="mt-2 font-medium">Accepted: .edi, .txt, .dat, .x12</p>
    </div>
  );
}
