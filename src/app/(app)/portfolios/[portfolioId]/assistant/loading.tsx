import { Skeleton } from '@/components/ui/skeleton';

export default function AssistantLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-[28rem] w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}
