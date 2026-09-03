import type { Dictionary } from "../dictionary";

/**
 * The complete, authoritative English dictionary. Every other locale's
 * dictionary is validated and filled in against this shape; any key
 * missing from a non-English dictionary falls back to the matching value
 * here (see getDictionary in ../dictionary.ts).
 */
export const en: Dictionary = {
  common: {
    siteName: "GOAT PDF",
    tagline: "Free PDF tools that just work.",
  },
  navigation: {
    home: "Home",
    tools: "Tools",
    allTools: "All tools",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  footer: {
    description:
      "Free PDF tools that just work. No accounts, no watermarks. Uploaded files are processed privately and deleted automatically after a short time.",
    guides: "Guides",
    company: "Company",
  },
  buttons: {
    chooseFile: "Choose file",
    startOver: "Start over",
    tryAgain: "Try again",
    download: "Download",
    cancel: "Cancel",
    processAnotherFile: "Process another file",
  },
  upload: {
    dragDropLabel: "Drag and drop your PDF file here",
    dropHere: "Drop your file here",
    browsePrefix: "or",
    browseLink: "browse files",
    browseSuffix: "from your device",
    unsupportedFileType: "\"{fileName}\" isn't a supported file type.",
    fileTooLargeDetail: "\"{fileName}\" is larger than the {maxSizeMB} MB limit.",
    removeFile: "Remove {fileName}",
  },
  processing: {
    processing: "Processing",
    pleaseWait: "This can take a moment.",
    processingFile: "Processing your file…",
  },
  errors: {
    networkError: "Network error. Please check your connection and try again.",
    invalidFile: "Invalid file",
    fileTooLarge: "File too large",
    processingFailed: "Something went wrong while processing your file. Please try again.",
    corruptedFile: "This file couldn't be read. It may be corrupted or password protected.",
  },
  success: {
    downloadReady: "Your file is ready to download.",
  },
  pageStatus: {
    reading: "Reading your PDF…",
    pageCountSingular: "This PDF has {count} page.",
    pageCountPlural: "This PDF has {count} pages.",
  },
  fileList: {
    moveUp: "Move {fileName} up",
    moveDown: "Move {fileName} down",
  },
  a11y: {
    languageSelector: "Language",
    currentLanguage: "Current language: English",
  },
};
