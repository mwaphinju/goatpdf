import type { PartialDictionary } from "../dictionary";

/**
 * German dictionary. As of Week 2 Day 5, this covers full, reviewed
 * German UI text for the 5 launched German pages (homepage, Compress,
 * Merge, Split, PDF to Word), so those pages show no unexpected raw
 * English in their shared UI (upload flow, buttons, processing, errors,
 * navigation, footer). Sections that only ever appear on the 4
 * not-yet-translated tools (delete-pdf-pages, jpg-to-pdf, pdf-to-jpg,
 * rotate-pdf specific copy) are out of scope here since no German route
 * renders them; see GOAT_PDF_WEEK2_DAY5_GERMAN_LAUNCH_REPORT.md for the
 * exact translated scope and what's still deferred to a later phase.
 */
export const de: PartialDictionary = {
  common: {
    siteName: "GOAT PDF",
    tagline: "Kostenlose PDF-Tools, die einfach funktionieren.",
  },
  navigation: {
    home: "Startseite",
    tools: "Tools",
    allTools: "Alle Tools",
    openMenu: "Menü öffnen",
    closeMenu: "Menü schließen",
  },
  footer: {
    description:
      "Kostenlose PDF-Tools, die einfach funktionieren. Keine Konten, keine Wasserzeichen. Hochgeladene Dateien werden vertraulich verarbeitet und nach kurzer Zeit automatisch gelöscht.",
    guides: "Anleitungen",
    company: "Unternehmen",
  },
  buttons: {
    chooseFile: "Datei auswählen",
    startOver: "Neu starten",
    tryAgain: "Erneut versuchen",
    download: "Herunterladen",
    cancel: "Abbrechen",
    processAnotherFile: "Weitere Datei bearbeiten",
  },
  upload: {
    dragDropLabel: "Ziehe deine PDF-Datei hierher",
    dropHere: "Datei hier ablegen",
    browsePrefix: "oder",
    browseLink: "Dateien durchsuchen",
    browseSuffix: "auf deinem Gerät",
    unsupportedFileType: "\"{fileName}\" wird als Dateityp nicht unterstützt.",
    fileTooLargeDetail: "\"{fileName}\" überschreitet das Limit von {maxSizeMB} MB.",
    removeFile: "{fileName} entfernen",
  },
  processing: {
    processing: "Wird verarbeitet",
    pleaseWait: "Das kann einen Moment dauern.",
    processingFile: "Deine Datei wird verarbeitet…",
  },
  errors: {
    networkError: "Netzwerkfehler. Bitte überprüfe deine Verbindung und versuche es erneut.",
    invalidFile: "Ungültige Datei",
    fileTooLarge: "Datei zu groß",
    processingFailed: "Bei der Verarbeitung deiner Datei ist ein Fehler aufgetreten. Bitte versuche es erneut.",
    corruptedFile: "Diese Datei konnte nicht gelesen werden. Sie ist möglicherweise beschädigt oder passwortgeschützt.",
  },
  success: {
    downloadReady: "Deine Datei steht zum Download bereit.",
  },
  pageStatus: {
    reading: "PDF wird gelesen…",
    pageCountSingular: "Diese PDF-Datei hat {count} Seite.",
    pageCountPlural: "Diese PDF-Datei hat {count} Seiten.",
  },
  fileList: {
    moveUp: "{fileName} nach oben verschieben",
    moveDown: "{fileName} nach unten verschieben",
  },
  a11y: {
    languageSelector: "Sprache",
    currentLanguage: "Aktuelle Sprache: Deutsch",
  },
};
