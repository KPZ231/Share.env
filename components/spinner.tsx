export function Spinner({ className = "size-5" }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`animate-spin rounded-full border-2 border-accent border-t-transparent ${className}`}
    />
  );
}
