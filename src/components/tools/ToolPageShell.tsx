"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { UploadZone } from "@/components/ui/UploadZone";

export interface ToolPageShellProps {
  accept: string;
  multiple: boolean;
  actionLabel: string;
}

export function ToolPageShell({ accept, multiple, actionLabel }: ToolPageShellProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [showUnavailable, setShowUnavailable] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <UploadZone
        accept={accept}
        multiple={multiple}
        files={files}
        onFilesChange={(next) => {
          setFiles(next);
          setShowUnavailable(false);
        }}
        label={multiple ? "Drag and drop your files here" : "Drag and drop your file here"}
        hint="Max 50 MB per file. Files are processed privately and deleted automatically."
      />

      <Button
        size="lg"
        disabled={files.length === 0}
        onClick={() => setShowUnavailable(true)}
        className="self-start"
      >
        {actionLabel}
      </Button>

      {showUnavailable && (
        <ErrorMessage
          tone="info"
          title="This tool is coming soon"
          message="GOAT PDF's processing engine is still under construction. You'll be able to run this tool for real in an upcoming update — check back soon."
        />
      )}
    </div>
  );
}
