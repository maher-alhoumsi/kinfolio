import { Button } from '@/components/ui/button';
import { assistantSuggestions } from '@/components/assistant/assistant-constants';

interface Props {
  disabled: boolean;
  onSuggestion: (suggestion: string) => void;
}

const AssistantEmptyState = ({ disabled, onSuggestion }: Props) => (
  <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
    <p className="text-sm text-muted-foreground">
      Ask a question about this portfolio.
    </p>
    <div className="flex max-w-lg flex-wrap justify-center gap-2">
      {assistantSuggestions.map((suggestion) => (
        <Button
          key={suggestion}
          variant="outline"
          size="sm"
          onClick={() => onSuggestion(suggestion)}
          disabled={disabled}
        >
          {suggestion}
        </Button>
      ))}
    </div>
  </div>
);

export default AssistantEmptyState;
