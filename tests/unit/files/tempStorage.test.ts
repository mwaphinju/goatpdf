import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  createJobWorkspace,
  getTempRoot,
  listWorkspaces,
  randomFileName,
  removeWorkspace,
  writeWorkspaceFile,
} from "@/lib/files/tempStorage";

const isolatedRoot = path.join(os.tmpdir(), "goatpdf-test-tempstorage");
process.env.GOATPDF_TEMP_ROOT = isolatedRoot;

afterAll(async () => {
  await fs.rm(isolatedRoot, { recursive: true, force: true });
  delete process.env.GOATPDF_TEMP_ROOT;
});

describe("temp workspaces", () => {
  it("creates workspaces inside the managed temp root, under a random UUID directory", async () => {
    const workspace = await createJobWorkspace();

    expect(workspace.dir.startsWith(getTempRoot())).toBe(true);
    expect(workspace.dir.endsWith(workspace.id)).toBe(true);
    expect(workspace.id).toMatch(/^[0-9a-f-]{36}$/i);

    const stats = await fs.stat(workspace.dir);
    expect(stats.isDirectory()).toBe(true);
  });

  it("never reuses a workspace id across calls", async () => {
    const a = await createJobWorkspace();
    const b = await createJobWorkspace();
    expect(a.id).not.toBe(b.id);
  });

  it("generates random, unpredictable filenames that don't depend on the original name", () => {
    const a = randomFileName(".pdf");
    const b = randomFileName(".pdf");
    expect(a).not.toBe(b);
    expect(a.endsWith(".pdf")).toBe(true);
  });

  it("writes a file into a workspace under a random name and returns its path", async () => {
    const workspace = await createJobWorkspace();

    const filePath = await writeWorkspaceFile(workspace.dir, ".pdf", Buffer.from("%PDF-1.4"));
    expect(filePath.startsWith(workspace.dir)).toBe(true);
    expect(path.basename(filePath)).not.toContain("original");

    const contents = await fs.readFile(filePath);
    expect(contents.toString()).toBe("%PDF-1.4");
  });

  it("lists workspaces currently on disk", async () => {
    const workspace = await createJobWorkspace();

    const workspaces = await listWorkspaces();
    expect(workspaces.some((w) => w.id === workspace.id)).toBe(true);
  });
});

describe("directory traversal protection", () => {
  it("refuses to remove a directory outside the managed temp root", async () => {
    const outsideDir = await fs.mkdtemp(path.join(os.tmpdir(), "goatpdf-traversal-test-"));
    try {
      await expect(removeWorkspace(outsideDir)).rejects.toThrow(/outside the managed temp root/i);
    } finally {
      await fs.rm(outsideDir, { recursive: true, force: true });
    }
  });

  it("refuses to remove the temp root itself, even though it's technically 'inside' it", async () => {
    // A single bad call must never be able to wipe every job's workspace at once.
    await expect(removeWorkspace(getTempRoot())).rejects.toThrow(/outside the managed temp root/i);
  });

  it("refuses a traversal path that climbs back out of the temp root", async () => {
    const traversalAttempt = path.join(getTempRoot(), "..", "..", "etc");
    await expect(removeWorkspace(traversalAttempt)).rejects.toThrow(/outside the managed temp root/i);
  });

  it("refuses to write into a directory outside the managed temp root", async () => {
    const outsideDir = await fs.mkdtemp(path.join(os.tmpdir(), "goatpdf-write-test-"));
    try {
      await expect(writeWorkspaceFile(outsideDir, ".pdf", Buffer.from("x"))).rejects.toThrow(
        /outside the managed temp root/i,
      );
    } finally {
      await fs.rm(outsideDir, { recursive: true, force: true });
    }
  });
});

describe("cleanup", () => {
  it("permanently removes a workspace and everything in it", async () => {
    const workspace = await createJobWorkspace();
    await writeWorkspaceFile(workspace.dir, ".pdf", Buffer.from("%PDF-1.4"));

    await removeWorkspace(workspace.dir);

    await expect(fs.stat(workspace.dir)).rejects.toThrow();
  });

  it("does not throw when removing a workspace that no longer exists", async () => {
    const workspace = await createJobWorkspace();
    await removeWorkspace(workspace.dir);
    await expect(removeWorkspace(workspace.dir)).resolves.toBeUndefined();
  });
});
