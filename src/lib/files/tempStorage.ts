import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const DEFAULT_TEMP_ROOT = path.join(tmpdir(), "goatpdf");

/**
 * Resolved lazily (not cached at module load) so tests can point it at an
 * isolated directory via GOATPDF_TEMP_ROOT without leaking real job files
 * into the shared OS temp directory, and without racing other test files
 * that exercise the same temp root.
 */
export function getTempRoot(): string {
  return process.env.GOATPDF_TEMP_ROOT || DEFAULT_TEMP_ROOT;
}

export interface JobWorkspace {
  id: string;
  dir: string;
}

/**
 * Guards against ever operating outside a job workspace inside the managed
 * temp root — the only defense needed against path traversal, since no user
 * input ever reaches a filesystem path in this module. The root itself is
 * deliberately excluded so a bad call can never wipe every job at once.
 */
function assertInsideTempRoot(target: string): string {
  const root = path.resolve(/* turbopackIgnore: true */ getTempRoot());
  const resolved = path.resolve(target);
  if (!resolved.startsWith(root + path.sep)) {
    throw new Error("Refusing to operate outside the managed temp root");
  }
  return resolved;
}

/** Creates a new job workspace directory named with a cryptographically random UUID. */
export async function createJobWorkspace(): Promise<JobWorkspace> {
  const root = getTempRoot();
  await fs.mkdir(root, { recursive: true, mode: 0o700 });
  const id = randomUUID();
  const dir = assertInsideTempRoot(path.join(root, id));
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  return { id, dir };
}

/** Generates a random on-disk filename for a piece of job input/output. Never derived from a user-supplied name. */
export function randomFileName(extension: string): string {
  const normalizedExt = extension.startsWith(".") ? extension : `.${extension}`;
  return `${randomUUID()}${normalizedExt}`;
}

/** Writes a validated file buffer into a job workspace under a random filename and returns its absolute path. */
export async function writeWorkspaceFile(
  workspaceDir: string,
  extension: string,
  buffer: Buffer,
): Promise<string> {
  assertInsideTempRoot(workspaceDir);
  const filePath = path.join(workspaceDir, randomFileName(extension));
  await fs.writeFile(filePath, buffer, { mode: 0o600 });
  return filePath;
}

/** Recursively and permanently deletes a job workspace. Safe to call even if the directory no longer exists. */
export async function removeWorkspace(dir: string): Promise<void> {
  const resolved = assertInsideTempRoot(dir);
  await fs.rm(resolved, { recursive: true, force: true });
}

/** Lists job workspace directories currently on disk, with their last-modified time. */
export async function listWorkspaces(): Promise<{ id: string; dir: string; mtimeMs: number }[]> {
  const root = getTempRoot();
  let entries;
  try {
    entries = await fs.readdir(/* turbopackIgnore: true */ root, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const workspaces = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const dir = path.join(root, entry.name);
        const stats = await fs.stat(dir);
        return { id: entry.name, dir, mtimeMs: stats.mtimeMs };
      }),
  );

  return workspaces;
}
