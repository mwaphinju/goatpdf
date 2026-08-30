import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { contentTypeForFileName } from "@/lib/files/contentType";
import { writeWorkspaceFile } from "@/lib/files/tempStorage";
import { loadPdfOrThrow } from "@/lib/pdf/loadPdf";
import { ConversionFailedError } from "@/lib/processing/errors";
import type { ProcessingContext, ProcessingResult } from "@/lib/processing/types";

const execFileAsync = promisify(execFile);

// A little under the tool's configured job timeout (120s), so the LibreOffice
// child process itself gets killed (execFile's `timeout` sends SIGTERM) rather
// than being left running in the background after runProcessingJob's own
// timeout gives up on it.
const SOFFICE_TIMEOUT_MS = 110_000;

// winget's default LibreOffice install location on Windows dev machines —
// on Linux/Docker (the real deployment target), `soffice` is expected to
// already be on PATH, so the bare command name is tried last.
const WINDOWS_SOFFICE_CANDIDATES = [
  "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
  "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
];

async function resolveSofficeCommand(): Promise<string> {
  if (process.env.SOFFICE_PATH) return process.env.SOFFICE_PATH;

  for (const candidate of WINDOWS_SOFFICE_CANDIDATES) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // try the next candidate
    }
  }

  return "soffice";
}

export async function pdfToWord(context: ProcessingContext): Promise<ProcessingResult> {
  const file = context.files[0];

  // The same pdf-lib check every other tool uses — catches corrupted and
  // password-protected PDFs before ever spawning LibreOffice.
  await loadPdfOrThrow(file.path, file.safeName);

  const outputDir = path.join(context.workspaceDir, "lo-output");
  const profileDir = path.join(context.workspaceDir, "lo-profile");
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(profileDir, { recursive: true });

  const soffice = await resolveSofficeCommand();
  const args = [
    "--headless",
    "--invisible",
    "--norestore",
    // A dedicated profile directory per job avoids "another instance is
    // already running" lock conflicts between concurrent conversions —
    // LibreOffice instances sharing a user profile serialize on it.
    `-env:UserInstallation=${pathToFileURL(profileDir).href}`,
    // Without this, LibreOffice imports a PDF into Draw (an editable-drawing
    // representation) by default, and a Draw document has no DOCX export
    // filter — the conversion fails outright. Forcing the Writer PDF import
    // filter is what makes a genuine reflowed, editable Word document
    // possible at all. Verified empirically: omitting this produced
    // "no export filter" / "Io Class:Write" errors on every attempt.
    "--infilter=writer_pdf_import",
    "--convert-to",
    "docx",
    "--outdir",
    outputDir,
    file.path,
  ];

  try {
    await execFileAsync(soffice, args, { timeout: SOFFICE_TIMEOUT_MS });
  } catch {
    throw new ConversionFailedError();
  }

  const expectedOutputPath = path.join(outputDir, `${path.basename(file.path, path.extname(file.path))}.docx`);

  let convertedBytes: Buffer;
  try {
    convertedBytes = await fs.readFile(expectedOutputPath);
  } catch {
    throw new ConversionFailedError();
  }

  if (convertedBytes.byteLength === 0) {
    throw new ConversionFailedError();
  }

  const outputPath = await writeWorkspaceFile(context.workspaceDir, ".docx", convertedBytes);
  const fileName = "converted.docx";
  return { outputs: [{ path: outputPath, fileName, contentType: contentTypeForFileName(fileName) }] };
}
