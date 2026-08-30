import { promises as fs } from "node:fs";
import { trackEvent } from "@/lib/analytics/track";
import { removeWorkspace } from "@/lib/files/tempStorage";
import { consumeJobOutput } from "@/lib/processing/jobRegistry";
import { DOWNLOAD_RATE_LIMIT_PER_WINDOW, rateLimitResponse } from "@/lib/processing/apiHelpers";
import { clientIpFromRequest } from "@/lib/security/clientIp";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const limited = rateLimitResponse(request, "download", DOWNLOAD_RATE_LIMIT_PER_WINDOW);
  if (limited) return limited;

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

    void trackEvent(
      { name: "download_completed", tool: output.toolId },
      { visitorIp: clientIpFromRequest(request) },
    );

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": output.contentType,
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
