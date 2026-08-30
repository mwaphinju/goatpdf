const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/** Maps an output filename's extension to its MIME type for download responses. Defaults to a generic binary type for anything unrecognized. */
export function contentTypeForFileName(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1) return "application/octet-stream";
  const extension = fileName.slice(dotIndex).toLowerCase();
  return CONTENT_TYPES[extension] ?? "application/octet-stream";
}
