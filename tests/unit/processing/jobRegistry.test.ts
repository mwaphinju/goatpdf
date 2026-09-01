import { beforeEach, describe, expect, it } from "vitest";
import {
  _resetJobRegistryForTests,
  consumeJobOutput,
  registerJobOutput,
  sweepExpiredJobOutputs,
} from "@/lib/processing/jobRegistry";

const SAMPLE_OUTPUT = {
  filePath: "/tmp/goatpdf/some-job/output.pdf",
  fileName: "merged.pdf",
  contentType: "application/pdf",
  workspaceDir: "/tmp/goatpdf/some-job",
  toolId: "merge-pdf",
};

beforeEach(() => {
  _resetJobRegistryForTests();
});

describe("sweepExpiredJobOutputs", () => {
  it("removes registry entries older than the TTL", () => {
    registerJobOutput("job-1", SAMPLE_OUTPUT);

    const ttlMs = 60 * 60 * 1000;
    const farFuture = Date.now() + ttlMs + 60_000;
    const removed = sweepExpiredJobOutputs(ttlMs, farFuture);

    expect(removed).toContain("job-1");
    expect(consumeJobOutput("job-1")).toBeUndefined();
  });

  it("leaves entries younger than the TTL untouched", () => {
    registerJobOutput("job-2", SAMPLE_OUTPUT);

    const ttlMs = 60 * 60 * 1000;
    const removed = sweepExpiredJobOutputs(ttlMs, Date.now());

    expect(removed).not.toContain("job-2");
    expect(consumeJobOutput("job-2")).toEqual(SAMPLE_OUTPUT);
  });

  it("does nothing and does not throw when the registry is empty", () => {
    const removed = sweepExpiredJobOutputs(60 * 60 * 1000, Date.now());
    expect(removed).toEqual([]);
  });
});

describe("consumeJobOutput", () => {
  it("is single-use: a second consume of the same jobId returns undefined", () => {
    registerJobOutput("job-3", SAMPLE_OUTPUT);

    expect(consumeJobOutput("job-3")).toEqual(SAMPLE_OUTPUT);
    expect(consumeJobOutput("job-3")).toBeUndefined();
  });

  it("a swept entry cannot later be consumed", () => {
    registerJobOutput("job-4", SAMPLE_OUTPUT);

    const ttlMs = 60 * 60 * 1000;
    sweepExpiredJobOutputs(ttlMs, Date.now() + ttlMs + 1);

    expect(consumeJobOutput("job-4")).toBeUndefined();
  });
});
