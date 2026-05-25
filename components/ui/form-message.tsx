import { cn } from "@/lib/utils";

export function FormError({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  if (!message) return null;
  return (
    <p className={cn("text-sm text-brand-700 mt-1", className)}>{message}</p>
  );
}

export function FormHelp({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={cn("text-xs text-gray-500 mt-1", className)}>{children}</p>;
}
