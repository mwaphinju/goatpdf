import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";

export interface ToolActionBarProps {
  actionLabel: ReactNode;
  onAction: () => void;
  disabled: boolean;
  showReset: boolean;
  onReset: () => void;
  /** Defaults to English; every existing call site omits this and is unaffected. */
  locale?: Locale;
}

/** The primary action + "Start over" button row shared by every tool. */
export function ToolActionBar({
  actionLabel,
  onAction,
  disabled,
  showReset,
  onReset,
  locale = DEFAULT_LOCALE,
}: ToolActionBarProps) {
  const t = getDictionary(locale);

  return (
    <div className="flex flex-wrap gap-3">
      <Button size="lg" disabled={disabled} onClick={onAction}>
        {actionLabel}
      </Button>
      {showReset && (
        <Button size="lg" variant="secondary" onClick={onReset}>
          {t.buttons.startOver}
        </Button>
      )}
    </div>
  );
}
