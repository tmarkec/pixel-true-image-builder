import { cn } from "@/lib/utils";

export function TypeBadge({ type }: { type: string }) {
  const have = type === "have";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        have ? "bg-have-soft text-have-strong" : "bg-want-soft text-want-strong",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", have ? "bg-have" : "bg-want")} aria-hidden />
      {have ? "Have" : "Want"}
    </span>
  );
}
