import { SpinnerIcon } from "@/components/icons";

export interface ProcessingStateProps {
  label?: string;
}

export function ProcessingState({ label = "Processing your file…" }: ProcessingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-900"
    >
      <SpinnerIcon className="h-8 w-8 animate-spin text-emerald-600 motion-reduce:animate-none dark:text-emerald-400" />
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
    </div>
  );
}
