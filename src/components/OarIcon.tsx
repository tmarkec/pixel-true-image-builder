export function OarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 21l2.5-2.5" />
      <path d="M5.5 18.5L14 10" />
      <path d="M14 10c0-3 2.5-6.5 5.5-7.5 1 3-1 7-4 7.5L14 10z" />
    </svg>
  );
}
