import path from "node:path";

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export type SupportedFileKind = "pdf" | "jpeg" | "png";

export type ValidationErrorCode =
  | "EMPTY_FILE"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_EXTENSION"
  | "UNSUPPORTED_MIME_TYPE"
  | "CONTENT_TYPE_MISMATCH";

export interface ValidationFailure {
  ok: false;
  code: ValidationErrorCode;
  message: string;
}

export interface ValidationSuccess {
  ok: true;
  kind: SupportedFileKind;
  safeName: string;
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

interface FileSignature {
  kind: SupportedFileKind;
  extensions: string[];
  mimeTypes: string[];
  matchesMagicBytes: (buffer: Buffer) => boolean;
}

const SIGNATURES: FileSignature[] = [
  {
    kind: "pdf",
    extensions: [".pdf"],
    mimeTypes: ["application/pdf"],
    matchesMagicBytes: (buffer) => buffer.subarray(0, 5).toString("latin1") === "%PDF-",
  },
  {
    kind: "jpeg",
    extensions: [".jpg", ".jpeg"],
    mimeTypes: ["image/jpeg"],
    matchesMagicBytes: (buffer) =>
      buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  },
  {
    kind: "png",
    extensions: [".png"],
    mimeTypes: ["image/png"],
    matchesMagicBytes: (buffer) =>
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a,
  },
];

const SAFE_NAME_FALLBACK = "file";
const MAX_SAFE_NAME_LENGTH = 150;

function isPrintableAscii(charCode: number): boolean {
  return charCode >= 0x20 && charCode !== 0x7f;
}

function removeControlCharacters(value: string): string {
  let result = "";
  for (const char of value) {
    if (isPrintableAscii(char.charCodeAt(0))) result += char;
  }
  return result;
}

/**
 * Reduces an arbitrary, possibly hostile, client-supplied filename to a safe
 * display name: no directory components, no traversal sequences, no control
 * characters. This name is only ever used for display/labeling — it is never
 * used to construct a filesystem path (temp files always use random UUIDs).
 */
export function sanitizeFileName(rawName: string): string {
  const withoutControlChars = removeControlCharacters(rawName);
  const base = path.basename(withoutControlChars.replace(/\\/g, "/"));

  const stripped = base
    .replace(/[^a-zA-Z0-9 ._()-]/g, "_")
    .replace(/^\.+/, "")
    .trim();

  const truncated = stripped.slice(0, MAX_SAFE_NAME_LENGTH);
  return truncated.length > 0 ? truncated : SAFE_NAME_FALLBACK;
}

function detectKindFromMagicBytes(buffer: Buffer): SupportedFileKind | null {
  for (const signature of SIGNATURES) {
    if (signature.matchesMagicBytes(buffer)) return signature.kind;
  }
  return null;
}

export interface FileToValidate {
  fileName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

/**
 * Validates an uploaded file against an allow-list of accepted kinds using
 * three independent checks — reported size, extension, and reported MIME
 * type — plus an authoritative magic-byte sniff of the actual bytes. All
 * must agree; the client-reported extension/MIME type are never trusted on
 * their own.
 */
export function validateFile(
  file: FileToValidate,
  acceptedKinds: SupportedFileKind[],
  maxSizeBytes: number = MAX_FILE_SIZE_BYTES,
): ValidationResult {
  if (file.size <= 0 || file.buffer.length === 0) {
    return { ok: false, code: "EMPTY_FILE", message: "The uploaded file is empty." };
  }

  if (file.size > maxSizeBytes) {
    return {
      ok: false,
      code: "FILE_TOO_LARGE",
      message: `The file exceeds the ${Math.round(maxSizeBytes / (1024 * 1024))} MB limit.`,
    };
  }

  const safeName = sanitizeFileName(file.fileName);
  const extension = path.extname(safeName).toLowerCase();
  const signatures = SIGNATURES.filter((sig) => acceptedKinds.includes(sig.kind));

  const extensionMatch = signatures.find((sig) => sig.extensions.includes(extension));
  if (!extensionMatch) {
    return {
      ok: false,
      code: "UNSUPPORTED_EXTENSION",
      message: "This tool doesn't accept that file extension.",
    };
  }

  const mimeMatch = signatures.find((sig) => sig.mimeTypes.includes(file.mimeType.toLowerCase()));
  if (!mimeMatch) {
    return {
      ok: false,
      code: "UNSUPPORTED_MIME_TYPE",
      message: "This tool doesn't accept that file type.",
    };
  }

  const detectedKind = detectKindFromMagicBytes(file.buffer);
  if (!detectedKind || !acceptedKinds.includes(detectedKind) || detectedKind !== extensionMatch.kind) {
    return {
      ok: false,
      code: "CONTENT_TYPE_MISMATCH",
      message: "The file's contents don't match its name. It may be corrupted or mislabeled.",
    };
  }

  return { ok: true, kind: detectedKind, safeName };
}
