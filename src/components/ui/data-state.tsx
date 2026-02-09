import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingState({ message = 'Loading...', className }: { message?: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm text-slate-600', className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl border border-dashed border-border bg-card p-8 text-center', className)}>
      <p className="text-base font-semibold text-slate-900">{title}</p>
      {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
    </div>
  );
}
