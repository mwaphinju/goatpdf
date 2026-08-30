import { AlertIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

export interface ErrorMessageProps {
  title?: string;
  message: string;
  tone?: "error" | "info";
  className?: string;
}

export function ErrorMessage({ title, message, tone = "error", className }: ErrorMessageProps) {
  const toneClasses =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <div
      role="alert"
      className={cn("flex items-start gap-3 rounded-lg border p-4 text-sm", toneClasses, className)}
    >
      <AlertIcon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        {title && <p className="font-medium">{title}</p>}
        <p className={title ? "mt-0.5" : undefined}>{message}</p>
      </div>
    </div>
  );
}
