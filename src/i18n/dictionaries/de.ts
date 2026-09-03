import type { PartialDictionary } from "../dictionary";

/**
 * German dictionary: Day 4 architecture-proving content only, NOT a
 * finished translation. "de" is not in READY_LOCALES (see ../config.ts),
 * so nothing here is ever exposed as a public route, sitemap entry, or
 * hreflang alternate yet.
 *
 * Only short, unambiguous, standard UI vocabulary is filled in below,
 * each value chosen deliberately rather than machine-translated. Every
 * other section (footer copy, longer sentences, tool names/descriptions)
 * is left undefined on purpose, so getDictionary() falls back to the
 * reviewed English text instead of guessing at a translation nobody has
 * checked. Filling in the remaining sections is Day 5+ scope, alongside
 * the actual German tool/homepage content described in
 * GOAT_PDF_WEEK2_DAY4_I18N_REPORT.md's Day 5 launch plan.
 */
export const de: PartialDictionary = {
  navigation: {
    home: "Startseite",
    tools: "Tools",
    allTools: "Alle Tools",
    openMenu: "Menü öffnen",
    closeMenu: "Menü schließen",
  },
  buttons: {
    chooseFile: "Datei auswählen",
    startOver: "Neu starten",
    tryAgain: "Erneut versuchen",
    download: "Herunterladen",
    cancel: "Abbrechen",
  },
  processing: {
    processing: "Wird verarbeitet",
  },
  errors: {
    networkError: "Netzwerkfehler. Bitte überprüfe deine Verbindung und versuche es erneut.",
    invalidFile: "Ungültige Datei",
    fileTooLarge: "Datei zu groß",
  },
  a11y: {
    languageSelector: "Sprache",
    currentLanguage: "Aktuelle Sprache: Deutsch",
  },
};
