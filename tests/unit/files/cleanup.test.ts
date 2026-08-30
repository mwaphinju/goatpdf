import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { JOB_TTL_MS, sweepExpiredWorkspaces } from "@/lib/files/cleanup";
import { createJobWorkspace, listWorkspaces } from "@/lib/files/tempStorage";

const isolatedRoot = path.join(os.tmpdir(), "goatpdf-test-cleanup");
process.env.GOATPDF_TEMP_ROOT = isolatedRoot;

afterAll(async () => {
  await fs.rm(isolatedRoot, { recursive: true, force: true });
  delete process.env.GOATPDF_TEMP_ROOT;
});

describe("sweepExpiredWorkspaces", () => {
  it("removes workspaces older than the TTL", async () => {
    const workspace = await createJobWorkspace();

    const farFuture = Date.now() + JOB_TTL_MS + 60_000;
    const removed = await sweepExpiredWorkspaces(JOB_TTL_MS, farFuture);

    expect(removed).toContain(workspace.id);
    const workspaces = await listWorkspaces();
    expect(workspaces.some((w) => w.id === workspace.id)).toBe(false);
  });

  it("leaves workspaces younger than the TTL untouched", async () => {
    const workspace = await createJobWorkspace();

    const removed = await sweepExpiredWorkspaces(JOB_TTL_MS, Date.now());

    expect(removed).not.toContain(workspace.id);
    const workspaces = await listWorkspaces();
    expect(workspaces.some((w) => w.id === workspace.id)).toBe(true);
  });

  it("does nothing and does not throw when no workspaces are expired", async () => {
    const removed = await sweepExpiredWorkspaces(JOB_TTL_MS, Date.now());
    expect(removed).toEqual([]);
  });
});
