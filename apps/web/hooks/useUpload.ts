"use client";

import { useState } from "react";
import { uploadFile } from "@/lib/api";

export function useUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setLoading(true);
    setError(null);
    try {
      return await uploadFile(file);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
      throw uploadError;
    } finally {
      setLoading(false);
    }
  }

  return { upload, loading, error };
}
