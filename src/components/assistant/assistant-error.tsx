import { Button } from '@/components/ui/button';

interface Props {
  onRetry: () => void;
}

const AssistantError = ({ onRetry }: Props) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
    <span>We could not reach the assistant. Please try again.</span>
    <Button variant="outline" size="sm" onClick={onRetry}>
      Retry
    </Button>
  </div>
);

export default AssistantError;
