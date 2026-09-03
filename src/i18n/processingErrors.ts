import type { JobErrorCode } from "@/lib/processing/errors";
import { DEFAULT_LOCALE, type Locale } from "./config";

/**
 * Generic German presentations for the server's stable JobErrorCode values
 * (see lib/processing/errors.ts and apiHelpers.ts's buildJobResponse,
 * which already includes `code` in every error response body). Not every
 * code is mapped: UNKNOWN_TOOL and NOT_IMPLEMENTED can't occur for any of
 * the 4 launched German tools (they're all real, implemented tools), so
 * they're deliberately left out rather than translated for a case that
 * can't happen.
 *
 * These are intentionally generic (they don't reproduce the exact
 * filename or byte limit some English messages include), the same
 * simplification this app's shared error/upload dictionary already makes
 * elsewhere (see dictionaries/de.ts's errors.corruptedFile).
 */
const GERMAN_JOB_ERROR_MESSAGES: Partial<Record<JobErrorCode, string>> = {
  UNREADABLE_FILE: "Diese Datei konnte nicht gelesen werden. Sie ist möglicherweise beschädigt oder passwortgeschützt.",
  TOTAL_SIZE_TOO_LARGE: "Die kombinierte Dateigröße deiner Dateien ist zu groß.",
  VALIDATION_FAILED: "Deine Eingabe konnte nicht verarbeitet werden. Bitte überprüfe sie und versuche es erneut.",
  TOO_FEW_FILES: "Es werden mindestens zwei PDF-Dateien benötigt.",
  TOO_MANY_FILES: "Es wurden zu viele Dateien ausgewählt.",
  PROCESSING_TIMEOUT: "Die Verarbeitung hat zu lange gedauert. Bitte versuche es erneut.",
  PROCESSING_FAILED: "Bei der Verarbeitung ist ein Fehler aufgetreten. Bitte versuche es erneut.",
};

/**
 * Presents a server-returned processing error for `locale`, using the
 * stable `code` the server always includes rather than duplicating or
 * reimplementing any server-side validation/processing logic (the server
 * itself stays entirely locale-unaware; only this client-side
 * presentation step varies by locale).
 *
 * English behavior is completely unchanged: the server's own message is
 * always shown verbatim, since it's often more specific (naming the
 * actual offending file, or a real byte limit) than a generic per-code
 * translation could be. For a non-English locale, a mapped code's
 * generic translated message is preferred over the raw English one; a
 * code with no mapped translation (or no code at all) still falls back
 * to the real server message, so nothing is ever hidden, dropped, or
 * replaced with a missing/broken string.
 */
export function localizeProcessingErrorMessage(
  code: string | undefined,
  serverMessage: string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (locale === DEFAULT_LOCALE || !code) return serverMessage;
  return GERMAN_JOB_ERROR_MESSAGES[code as JobErrorCode] ?? serverMessage;
}
