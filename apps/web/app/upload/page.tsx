"use client";

import { useRouter } from "next/navigation";
import Dropzone from "@/components/upload/Dropzone";
import { useUpload } from "@/hooks/useUpload";

export default function UploadPage() {
  const router = useRouter();
  const { upload, loading, error } = useUpload();

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-10">
      <h2 className="text-2xl font-semibold">Upload EDI file</h2>
      <Dropzone
        onFile={async (file) => {
          const uploaded = await upload(file);
          router.push(`/viewer/${uploaded.fileId}`);
        }}
      />
      {loading ? <p>Uploading...</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}
    </main>
  );
}
