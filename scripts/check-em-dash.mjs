// Scans src/app, src/components, and src/lib for the Unicode em dash
// (U+2014) outside of code comments, to catch it before it reaches
// user-facing content (page copy, metadata, structured data, error
// messages). See CLAUDE.md's "User-facing writing style" section.
//
// The character is built from its code point rather than embedded
// literally in this file, so this script itself never contains the
// character it's checking for.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const EM_DASH = String.fromCodePoint(0x2014);

const SCAN_ROOTS = ["src/app", "src/components", "src/lib"];
const SCAN_EXTENSIONS = new Set([".ts", ".tsx"]);
const EXCLUDED_DIR_NAMES = new Set([".git", "node_modules", ".next", "dist", "build", "coverage"]);

function collectFiles(rootDir) {
  const files = [];

  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (EXCLUDED_DIR_NAMES.has(entry.name)) continue;
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && SCAN_EXTENSIONS.has(extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }

  if (statSync(rootDir, { throwIfNoEntry: false })) walk(rootDir);
  return files;
}

/**
 * Returns true if `line` contains the em dash somewhere outside of a
 * `//` line comment, given whether we're already inside a `/* ... *\/`
 * block comment carried over from a previous line. Also returns the
 * updated block-comment state for the next line.
 *
 * This is a lightweight, line-oriented heuristic, not a full parser: it
 * does not attempt to distinguish `//`/`/*` that appear inside a string
 * literal from a real comment marker. That's an acceptable trade-off for
 * a prevention check, not a security boundary.
 */
function analyzeLine(line, inBlockComment) {
  const trimmed = line.trim();

  if (inBlockComment) {
    const endIndex = line.indexOf("*/");
    if (endIndex === -1) return { violates: false, inBlockComment: true };
    return analyzeLine(line.slice(endIndex + 2), false);
  }

  if (trimmed === "" || trimmed.startsWith("*") || trimmed.startsWith("//")) {
    // A full-line comment (JSDoc continuation, `//` line, or blank).
    if (trimmed.startsWith("/*")) {
      const endIndex = line.indexOf("*/", line.indexOf("/*") + 2);
      if (endIndex === -1) return { violates: false, inBlockComment: true };
    }
    return { violates: false, inBlockComment: false };
  }

  const blockStart = line.indexOf("/*");
  const lineCommentStart = line.indexOf("//");

  let codePart = line;
  let nextInBlockComment = false;

  if (blockStart !== -1 && (lineCommentStart === -1 || blockStart < lineCommentStart)) {
    const blockEnd = line.indexOf("*/", blockStart + 2);
    if (blockEnd === -1) {
      codePart = line.slice(0, blockStart);
      nextInBlockComment = true;
    } else {
      // Only handle a single block comment per line; good enough for the
      // JSDoc-style `/** ... */` comments this codebase actually uses.
      codePart = line.slice(0, blockStart) + line.slice(blockEnd + 2);
    }
  }

  const trailingCommentIndex = codePart.indexOf("//");
  if (trailingCommentIndex !== -1) {
    codePart = codePart.slice(0, trailingCommentIndex);
  }

  return { violates: codePart.includes(EM_DASH), inBlockComment: nextInBlockComment };
}

function findViolations(filePath) {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const violations = [];
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const result = analyzeLine(lines[i], inBlockComment);
    inBlockComment = result.inBlockComment;
    if (result.violates) violations.push({ line: i + 1, text: lines[i].trim() });
  }

  return violations;
}

function main() {
  const projectRoot = process.cwd();
  const allViolations = [];

  for (const root of SCAN_ROOTS) {
    const files = collectFiles(join(projectRoot, root));
    for (const file of files) {
      const violations = findViolations(file);
      for (const violation of violations) {
        allViolations.push({ file: file.slice(projectRoot.length + 1).replace(/\\/g, "/"), ...violation });
      }
    }
  }

  if (allViolations.length === 0) {
    console.log("check:em-dash: no em dash (U+2014) found outside code comments in src/app, src/components, src/lib.");
    return;
  }

  console.error(`check:em-dash: found ${allViolations.length} em dash occurrence(s) outside code comments:\n`);
  for (const violation of allViolations) {
    console.error(`  ${violation.file}:${violation.line}  ${violation.text}`);
  }
  console.error("\nReplace with a comma, period, colon, semicolon, parentheses, or hyphen, whichever reads naturally.");
  process.exitCode = 1;
}

main();
