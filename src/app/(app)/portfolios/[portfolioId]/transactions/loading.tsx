import { Skeleton } from '@/components/ui/skeleton';

export default function TransactionsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
