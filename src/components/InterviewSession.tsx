
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const InterviewSession = () => {
  const [answer, setAnswer] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    score: number;
    feedback: string;
  } | null>(null);

  const generateQuestion = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('interview-agent', {
        body: {
          role: "Software Engineer", // This should come from your setup
          mode: "generate_question"
        }
      });

      if (error) throw error;
      setCurrentQuestion(data.question);
      setFeedback(null);
    } catch (error) {
      console.error('Error generating question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('interview-agent', {
        body: {
          role: "Software Engineer", // This should come from your setup
          currentQuestion,
          userAnswer: answer,
          mode: "evaluate_answer"
        }
      });

      if (error) throw error;
      
      setFeedback({
        score: data.score,
        feedback: data.feedback
      });
      
      // After a delay, show the next question
      setTimeout(() => {
        setCurrentQuestion(data.nextQuestion);
        setFeedback(null);
        setAnswer("");
      }, 5000);

    } catch (error) {
      console.error('Error evaluating answer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate first question when component mounts
  useEffect(() => {
    generateQuestion();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-interview-background">
      {/* Avatar Section */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-32 h-32 bg-interview-accent rounded-full animate-float shadow-lg" />
      </div>

      {/* Interview Interface */}
      <div className="p-4 bg-interview-card shadow-lg">
        <Card className="p-6 space-y-4">
          {isLoading ? (
            <div className="text-lg font-medium text-gray-500">
              Thinking...
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <p className="text-lg font-medium">
                  {currentQuestion}
                </p>
                {feedback && (
                  <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                    <div className="font-medium">Score: {feedback.score}/10</div>
                    <p className="text-gray-600">{feedback.feedback}</p>
                  </div>
                )}
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
                  disabled={isLoading || !answer.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default InterviewSession;
