
import { Button } from "@/components/ui/button";
import { Mic, Send } from "lucide-react";

interface AnswerInputProps {
  answer: string;
  isListening: boolean;
  isLoading: boolean;
  countdown: number | null;
  onAnswerChange: (value: string) => void;
  onToggleListening: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AnswerInput = ({
  answer,
  isListening,
  isLoading,
  countdown,
  onAnswerChange,
  onToggleListening,
  onSubmit
}: AnswerInputProps) => {
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={`flex-shrink-0 ${isListening ? 'bg-red-100' : ''}`}
        onClick={onToggleListening}
      >
        <Mic className="h-4 w-4" />
      </Button>
      
      <input
        type="text"
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-interview-accent"
        placeholder={isListening ? "Listening..." : "Type your answer..."}
      />
      
      <Button
        type="submit"
        className="bg-interview-accent hover:bg-opacity-90 flex-shrink-0"
        disabled={isLoading || !answer.trim() || countdown !== null}
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};
