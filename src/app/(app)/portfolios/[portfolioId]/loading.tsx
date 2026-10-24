import { Skeleton } from '@/components/ui/skeleton';

export default function PortfolioLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-full sm:w-72" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-52 w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
