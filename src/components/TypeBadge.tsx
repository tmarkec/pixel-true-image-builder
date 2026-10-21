import { cn } from "@/lib/utils";

export function TypeBadge({ type }: { type: string }) {
  const have = type === "have";
  return (
    <span
      className={cn(
        "inline-block rounded-sm px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        have ? "bg-have text-have-foreground" : "bg-want text-want-foreground",
      )}
    >
      {have ? "Have" : "Want"}
    </span>
  );
}
