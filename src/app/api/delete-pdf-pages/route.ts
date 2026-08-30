import { buildJobResponse, extractFilesFromFormData } from "@/lib/processing/apiHelpers";
import { runProcessingJob } from "@/lib/processing/runProcessingJob";
import type { DeletePagesOptions } from "@/lib/pdf/deletePages";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { code: "VALIDATION_FAILED", message: "The upload couldn't be read. Please try again." },
      { status: 400 },
    );
  }

  const files = await extractFilesFromFormData(formData);

  const pagesRaw = formData.get("pages");
  let pages: number[] = [];
  if (typeof pagesRaw === "string") {
    try {
      const parsed: unknown = JSON.parse(pagesRaw);
      pages = Array.isArray(parsed) ? parsed.filter((value): value is number => typeof value === "number") : [];
    } catch {
      pages = [];
    }
  }

  const options: DeletePagesOptions = { pages };
  const result = await runProcessingJob("delete-pdf-pages", files, options);
  return buildJobResponse(result);
}
