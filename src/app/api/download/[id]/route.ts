import { promises as fs } from "node:fs";
import { removeWorkspace } from "@/lib/files/tempStorage";
import { consumeJobOutput } from "@/lib/processing/jobRegistry";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const output = consumeJobOutput(id);
  if (!output) {
    return Response.json(
      { code: "NOT_FOUND", message: "This download link has expired or was already used." },
      { status: 404 },
    );
  }

  try {
    const fileBuffer = await fs.readFile(output.filePath);

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${output.fileName}"`,
        "Content-Length": String(fileBuffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json(
      { code: "NOT_FOUND", message: "This file is no longer available." },
      { status: 404 },
    );
  } finally {
    await removeWorkspace(output.workspaceDir).catch(() => {
      // Best-effort cleanup; the periodic sweep is the backstop if this fails.
    });
  }
}
