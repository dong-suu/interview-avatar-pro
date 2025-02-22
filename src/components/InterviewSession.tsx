
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Send } from "lucide-react";

const InterviewSession = () => {
  const [answer, setAnswer] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle answer submission
    setAnswer("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-interview-background">
      {/* Avatar Section */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-32 h-32 bg-interview-accent rounded-full animate-float shadow-lg" />
      </div>

      {/* Interview Interface */}
      <div className="p-4 bg-interview-card shadow-lg">
        <Card className="p-6 space-y-4">
          <div className="space-y-4">
            <p className="text-lg font-medium">
              Tell me about your experience with React.js
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="flex-shrink-0"
            >
              <Mic className="h-4 w-4" />
            </Button>
            
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-interview-accent"
              placeholder="Type your answer..."
            />
            
            <Button
              type="submit"
              className="bg-interview-accent hover:bg-opacity-90 flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default InterviewSession;
