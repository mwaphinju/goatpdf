import type { LaunchedGermanToolSlug, LocalizedToolContent } from "../toolContent";

/**
 * Real, reviewed German content for the 4 tools launched in German as of
 * Week 2 Day 5 (see GOAT_PDF_WEEK2_DAY5_GERMAN_LAUNCH_REPORT.md). Written
 * for natural German search intent, not translated word for word from
 * lib/tools.ts's English content, and not machine-translated.
 */
export const germanToolContent: Record<LaunchedGermanToolSlug, LocalizedToolContent> = {
  "compress-pdf": {
    name: "PDF komprimieren",
    seoTitle: "PDF komprimieren, online und kostenlos",
    metaDescription:
      "PDF-Dateien kostenlos online komprimieren. Verkleinere die Dateigröße bei bestmöglicher Qualität. Keine Anmeldung, kein Wasserzeichen, Dateien werden nach der Verarbeitung automatisch gelöscht.",
    supportedFormats: "PDF rein, PDF raus.",
    whyUseIt: [
      "Keine Konten, kein Wasserzeichen und kein festes Kompressionsversprechen: nur das echte, gemessene Ergebnis für deine Datei.",
      "Drei unterschiedliche Stufen (Empfohlen, Hohe Qualität, Maximale Komprimierung) statt einer starren Einheitslösung.",
      "Hochgeladene und komprimierte Dateien werden vertraulich auf unserem Server verarbeitet und danach automatisch gelöscht.",
    ],
    useCases: [
      "Eine gescannte PDF-Datei so verkleinern, dass sie unter das Anhanglimit einer E-Mail passt",
      "Eine PDF-Datei verkleinern, bevor du sie in ein Formular oder Portal mit Größenbeschränkung hochlädst",
      "Speicherplatz für ein umfangreiches PDF-Archiv sparen",
    ],
    intro:
      "Verkleinere die Dateigröße einer PDF-Datei, ohne die Qualität unnötig zu beeinträchtigen. GOAT PDF komprimiert die eingebetteten Bilder in deiner Datei je nach gewählter Stufe neu und zeigt anschließend genau, wie viel Speicherplatz du gespart hast, nie eine erfundene Prozentzahl.",
    howTo: [
      "Lade die PDF-Datei hoch, die du verkleinern möchtest.",
      "Wähle Empfohlen, Hohe Qualität oder Maximale Komprimierung.",
      "Lade die komprimierte Datei herunter und vergleiche die Größe vorher und nachher.",
    ],
    faqs: [
      {
        question: "Wie stark wird meine PDF-Datei kleiner?",
        answer:
          "Das hängt ganz vom Inhalt der Datei ab: Eine PDF-Datei voller großer gescannter Bilder kann deutlich kleiner werden, während eine reine Textdatei kaum schrumpft. GOAT PDF zeigt immer das echte, gemessene Ergebnis und liefert nie eine größere Datei zurück, als du hochgeladen hast.",
      },
      {
        question: "Verschlechtert die Komprimierung die Qualität?",
        answer:
          "Etwas. Die Komprimierung kodiert eingebettete Fotos mit etwas geringerer Qualität neu, um Platz zu sparen. Empfohlen balanciert Größe und Qualität, Hohe Qualität hält Bilder näher am Original, und Maximale Komprimierung erzielt die kleinstmögliche Datei.",
      },
      {
        question: "Kann ich eine PDF-Datei für den E-Mail-Versand verkleinern?",
        answer:
          "Ja. Viele E-Mail-Anbieter begrenzen Anhänge auf etwa 20 bis 25 MB. PDF komprimieren ist ein schneller Weg, ein großes gescanntes Dokument vor dem Versand unter dieses Limit zu bringen, ganz ohne Zusatzsoftware.",
      },
      {
        question: "Was unterscheidet die drei Komprimierungsstufen?",
        answer:
          "Empfohlen balanciert Größe und Qualität für den alltäglichen Versand. Hohe Qualität hält Bilder näher am Original bei etwas geringerer Größenreduzierung. Maximale Komprimierung erzielt die kleinstmögliche Datei mit sichtbarerem Qualitätsverlust bei Bildern.",
      },
      {
        question: "Ist meine Datei sicher, wenn ich sie online komprimiere?",
        answer:
          "Ja. Dateien werden über eine private Verbindung hochgeladen, auf unserem Server verarbeitet und nach dem Download automatisch gelöscht, oder nach kurzer Zeit, falls du sie nicht herunterlädst. Details findest du in der Datenschutzerklärung.",
      },
    ],
  },
  "merge-pdf": {
    name: "PDF zusammenfügen",
    seoTitle: "PDF-Dateien zusammenfügen, online und kostenlos",
    metaDescription:
      "PDF-Dateien kostenlos online zusammenfügen. Mehrere PDFs in der gewünschten Reihenfolge zu einem Dokument kombinieren. Schnell, privat und ohne Konto.",
    supportedFormats: "PDF rein, PDF raus.",
    whyUseIt: [
      "Kein Konto, kein Wasserzeichen auf der zusammengefügten Datei und keine Tricks bei der Seitenzahl: einfach hochladen, sortieren und zusammenfügen.",
      "Per Ziehen oder mit Auf- und Ab-Schaltflächen sortieren: Die zusammengefügte Datei entsteht genau in der von dir festgelegten Reihenfolge.",
      "Dateien werden vertraulich auf unserem Server verarbeitet und danach automatisch gelöscht.",
    ],
    useCases: [
      "Mehrere gescannte Seiten zu einem Dokument zusammenfügen",
      "Einen Bericht aus einzelnen PDF-Abschnitten zusammenstellen",
      "Eine Rechnung mit den zugehörigen Anhängen in einer Datei zusammenführen",
    ],
    intro:
      "Kombiniere zwei oder mehr PDF-Dateien zu einem einzigen Dokument, in der Reihenfolge deiner Wahl. Dateien hinzufügen, per Ziehen anordnen und zusammenfügen. Kein Wasserzeichen auf dem Ergebnis.",
    howTo: [
      "Lade zwei oder mehr PDF-Dateien hoch.",
      "Ordne sie per Ziehen oder mit den Auf- und Ab-Schaltflächen.",
      "Klicke auf PDFs zusammenfügen und lade die kombinierte Datei herunter.",
    ],
    faqs: [
      {
        question: "Gibt es ein Limit, wie viele Dateien ich zusammenfügen kann?",
        answer: "Bis zu 20 PDF-Dateien gleichzeitig, mit einer kombinierten Größenbegrenzung von 200 MB für alle zusammen.",
      },
      {
        question: "Kann ich die Seitenreihenfolge nach dem Zusammenfügen noch ändern?",
        answer:
          "Nicht direkt innerhalb der zusammengefügten Datei: Du kannst das Ergebnis anschließend aber mit PDF drehen oder PDF-Seiten löschen bearbeiten, oder erneut zusammenfügen, ausgehend von einer anderen Dateireihenfolge.",
      },
      {
        question: "Verändert das Zusammenfügen meine Originaldateien?",
        answer:
          "Nein. Beim Zusammenfügen entsteht eine neue, separate PDF-Datei. Deine Originaldateien werden nicht verändert und nur zum Erstellen der neuen Datei verwendet.",
      },
      {
        question: "Kann ich gescannte PDF-Dateien zusammenfügen?",
        answer: "Ja. PDF zusammenfügen funktioniert mit jeder gültigen PDF-Datei, unabhängig davon, wie sie erstellt wurde, auch mit gescannten Dokumenten.",
      },
      {
        question: "Was passiert, wenn eine meiner Dateien beschädigt ist?",
        answer:
          "Das Zusammenfügen wird mit einer klaren Fehlermeldung abgelehnt, die das betroffene Dokument benennt, statt stillschweigend ein fehlerhaftes Ergebnis zu erzeugen. Deine anderen ausgewählten Dateien gehen dabei nicht verloren, sodass du die problematische Datei entfernen und es erneut versuchen kannst.",
      },
    ],
  },
  "split-pdf": {
    name: "PDF teilen",
    seoTitle: "PDF teilen, online und kostenlos",
    metaDescription:
      "PDF-Dateien kostenlos online teilen. Bestimmte Seiten extrahieren oder eine PDF-Datei in Sekunden in einzelne Dateien aufteilen. Ohne Softwareinstallation.",
    supportedFormats: "PDF rein, PDF oder ZIP raus.",
    whyUseIt: [
      "Sieh die echte Seitenzahl deiner PDF-Datei, bevor du entscheidest, wie du sie teilst: kein Rätselraten.",
      "Zwei echte Modi: in einzelne Seiten teilen oder genau den benötigten Bereich extrahieren.",
      "Dateien werden vertraulich auf unserem Server verarbeitet und nach dem Download automatisch gelöscht.",
    ],
    useCases: [
      "Ein einzelnes Kapitel oder einen Abschnitt aus einer langen PDF-Datei herausziehen",
      "Eine PDF-Datei mit mehreren Rechnungen in einzelne Rechnungen aufteilen",
      "Eine einzelne Seite extrahieren, um sie statt des gesamten Dokuments zu versenden",
    ],
    intro:
      "Teile eine PDF-Datei auf: entweder in eine Datei pro Seite oder durch Extrahieren eines bestimmten Seitenbereichs in ein neues Dokument. Nützlich, um ein einzelnes Kapitel, eine Rechnung oder ein Formular aus einer längeren Datei zu ziehen.",
    howTo: [
      "Lade eine PDF-Datei hoch. GOAT PDF liest die Seitenzahl für dich aus.",
      "Wähle, ob du in einzelne Seiten teilen oder einen Seitenbereich wie 1-3, 5, 7-9 eingeben möchtest.",
      "Lade das Ergebnis herunter: eine einzelne PDF-Datei für einen Bereich oder ein ZIP mit einzelnen Seiten.",
    ],
    faqs: [
      {
        question: "Welche Formate für Seitenbereiche werden unterstützt?",
        answer:
          "Durch Kommas getrennte Seitenzahlen und Bereiche, z. B. 1-3, 5, 7-9. Ungültige oder außerhalb liegende Eingaben werden sofort erkannt, bevor du irgendetwas herunterlädst.",
      },
      {
        question: "Was bekomme ich, wenn ich in einzelne Seiten teile?",
        answer: "Eine ZIP-Datei mit einer PDF-Datei pro Seite, fortlaufend nummeriert.",
      },
      {
        question: "Kann ich nur eine einzelne Seite aus einer PDF-Datei extrahieren?",
        answer: "Ja. Gib eine einzelne Seitenzahl (z. B. 5) als Bereich ein, und PDF teilen extrahiert genau diese Seite als eigene PDF-Datei.",
      },
      {
        question: "Verändert das Teilen meine originale PDF-Datei?",
        answer:
          "Nein. Beim Teilen entstehen neue Dateien aus deinem Upload. Das Original bleibt unverändert, und alles wird nach der Verarbeitung von unserem Server gelöscht.",
      },
      {
        question: "Was passiert, wenn ich einen ungültigen Seitenbereich eingebe?",
        answer:
          "Du siehst sofort eine klare Fehlermeldung, noch bevor du überhaupt absendest: Ein Bereich außerhalb der tatsächlichen Seitenzahl wird direkt im Browser erkannt.",
      },
    ],
  },
  "pdf-to-word": {
    name: "PDF in Word umwandeln",
    seoTitle: "PDF in Word umwandeln, online und kostenlos",
    metaDescription:
      "PDF kostenlos online in ein bearbeitbares Word-Dokument umwandeln. Erhalte eine herunterladbare .docx-Datei, die du wirklich bearbeiten kannst. Ohne Konto.",
    supportedFormats: "PDF rein, DOCX raus.",
    whyUseIt: [
      "Läuft auf einer echten, lokalen Konvertierungssoftware: Deine Datei verlässt unseren Server nie in Richtung einer Drittanbieter-API.",
      "Erzeugt eine echte, bearbeitbare .docx-Datei, keine gesperrte Vorschau und kein reines Bild.",
      "Ehrlich bei den Grenzen: Komplexe Layouts können eine manuelle Nachbearbeitung brauchen, und das sagen wir vor und nach der Konvertierung.",
    ],
    useCases: [
      "Den Text einer PDF-Datei bearbeiten, für die du die ursprüngliche Quelldatei nicht mehr hast",
      "Eine Vertrags- oder Formularvorlage aktualisieren, die ursprünglich als PDF vorlag",
      "Inhalte aus einem PDF-Bericht in einem neuen Word-Dokument weiterverwenden",
    ],
    intro:
      "Wandle eine PDF-Datei in ein bearbeitbares Word-Dokument (.docx) um, sodass du Text, Tabellen und Formatierung anpassen kannst, statt von vorn zu beginnen. Wie gut die Konvertierung gelingt, hängt davon ab, wie komplex die ursprüngliche PDF-Datei ist.",
    howTo: [
      "Lade deine PDF-Datei hoch.",
      "Lies den Formatierungshinweis: Die Konvertierungsqualität ist je nach Dokument unterschiedlich.",
      "Konvertiere, lade die .docx-Datei herunter und prüfe die Formatierung, bevor du dich darauf verlässt.",
    ],
    faqs: [
      {
        question: "Kommt die Formatierung perfekt heraus?",
        answer:
          "Das ist nicht garantiert. Einfache, überwiegend textbasierte PDF-Dateien werden sauber umgewandelt, aber komplexe Layouts, Tabellen, ungewöhnliche Schriftarten und Bilder benötigen möglicherweise eine manuelle Nachbearbeitung. Prüfe das Ergebnis immer, bevor du dich darauf verlässt.",
      },
      {
        question: "Worauf läuft die Konvertierung tatsächlich?",
        answer:
          "Auf einer echten, lokalen Konvertierungssoftware, nicht auf einer externen Cloud-API: Deine Datei verlässt den eigenen Server von GOAT PDF während der Konvertierung nie.",
      },
      {
        question: "Kann ich gescannte PDF-Dateien in Word umwandeln?",
        answer:
          "GOAT PDF wandelt den echten Text und die Layoutstruktur um, die bereits in einer PDF-Datei vorhanden sind. Eine gescannte PDF-Datei, die nur ein Foto einer Seite ist, ohne zugrunde liegende Textebene, lässt sich nicht in bearbeitbaren Text umwandeln, weil kein Text zum Extrahieren vorhanden ist: Dieses Tool enthält keine OCR-Funktion.",
      },
      {
        question: "Ist die Word-Datei wirklich bearbeitbar?",
        answer:
          "Ja. Das Ergebnis ist eine echte .docx-Datei, die du direkt in Microsoft Word, Google Docs oder einer kompatiblen App öffnen und bearbeiten kannst, kein reines Bild und keine reine Vorschau.",
      },
      {
        question: "Verändert die Konvertierung meine originale PDF-Datei?",
        answer:
          "Nein. Deine hochgeladene PDF-Datei bleibt unverändert. Das Word-Dokument wird daraus erzeugt, und beide Dateien werden anschließend von unserem Server gelöscht.",
      },
    ],
  },
};
