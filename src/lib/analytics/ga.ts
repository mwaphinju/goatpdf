"use client";

import { sendGAEvent } from "@next/third-parties/google";

/**
 * The Measurement ID is a NEXT_PUBLIC_* value, inlined into the client
 * bundle at build time (never read at request time) — see the ARG/ENV bridge
 * in the Dockerfile for how that reaches a Docker build. When unset, GA4 is
 * simply off: <GoogleAnalytics> is never mounted (see layout.tsx) and every
 * function below becomes a no-op, so the app behaves identically with or
 * without analytics configured.
 */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function isGaEnabled(): boolean {
  return Boolean(GA_MEASUREMENT_ID);
}

/**
 * Every parameter GA4 events in this app are allowed to carry. Structurally
 * narrow by design, matching this project's other analytics types
 * (lib/analytics/events.ts's AnalyticsEvent, processing/logger.ts's
 * JobLogEvent) — there is no field for a filename, extracted text, file
 * content, or any upload/download URL, so a call site cannot accidentally
 * leak any of those into Google Analytics.
 */
interface GaEventParams {
  tool_name?: string;
  success?: boolean;
  file_count?: number;
}

function track(eventName: string, params: GaEventParams = {}): void {
  if (!isGaEnabled()) return;
  try {
    sendGAEvent("event", eventName, params);
  } catch {
    // Never let analytics interfere with the actual user flow.
  }
}

/** A tool page was viewed — distinct from GA4's own automatic page_view (see layout.tsx), since this needs the app's own tool identifier as a parameter. */
export function trackToolView(toolName: string): void {
  track("tool_view", { tool_name: toolName });
}

/** A user added one or more files to a tool's upload zone. Never includes a filename. */
export function trackFileUpload(toolName: string, fileCount: number): void {
  track("file_upload", { tool_name: toolName, file_count: fileCount });
}

/** A processing request was sent to the server for a given tool. */
export function trackProcessingStarted(toolName: string, fileCount: number): void {
  track("processing_started", { tool_name: toolName, file_count: fileCount });
}

/** A processing request completed successfully. */
export function trackProcessingCompleted(toolName: string): void {
  track("processing_completed", { tool_name: toolName, success: true });
}

/** A processing request failed (validation error, server error, or a network failure). */
export function trackProcessingFailed(toolName: string): void {
  track("processing_failed", { tool_name: toolName, success: false });
}

/** A generated file was downloaded. Never includes the download URL or the generated filename. */
export function trackFileDownload(toolName: string): void {
  track("file_download", { tool_name: toolName });
}
