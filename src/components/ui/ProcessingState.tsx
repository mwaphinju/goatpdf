import { SpinnerIcon } from "@/components/icons";

export interface ProcessingStateProps {
  label?: string;
}

export function ProcessingState({ label = "Processing your file…" }: ProcessingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-8 text-center"
    >
      <SpinnerIcon className="h-8 w-8 animate-spin text-emerald-600" />
      <p className="text-sm font-medium text-slate-700">{label}</p>
    </div>
  );
}
