import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

export interface ToolActionBarProps {
  actionLabel: ReactNode;
  onAction: () => void;
  disabled: boolean;
  showReset: boolean;
  onReset: () => void;
}

/** The primary action + "Start over" button row shared by every tool. */
export function ToolActionBar({ actionLabel, onAction, disabled, showReset, onReset }: ToolActionBarProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button size="lg" disabled={disabled} onClick={onAction}>
        {actionLabel}
      </Button>
      {showReset && (
        <Button size="lg" variant="secondary" onClick={onReset}>
          Start over
        </Button>
      )}
    </div>
  );
}
