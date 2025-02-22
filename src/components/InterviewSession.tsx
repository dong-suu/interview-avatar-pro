import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Send, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Answer {
  question: string;
  answer: string;
}

const InterviewSession = () => {
  const { toast } = useToast();
  const [answer, setAnswer] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [finalEvaluation, setFinalEvaluation] = useState<any>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const recognition = useRef<any>(null);
  const role = sessionStorage.getItem('interviewRole') || "Software Engineer";
  const resumeText = sessionStorage.getItem('resumeText') || null;

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognition.current = new (window as any).webkitSpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;

      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setAnswer(transcript);
        setIsListening(false);
      };

      recognition.current.onerror = () => {
        setIsListening(false);
        toast({
          title: "Error",
          description: "Failed to recognize speech. Please try again.",
          variant: "destructive",
        });
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognition.current?.stop();
      setIsListening(false);
    } else {
      recognition.current?.start();
      setIsListening(true);
    }
  };

  const generateQuestion = async () => {
    if (questionCount >= 10) {
      // Generate final evaluation
      setIsLoading(true);
      try {
        console.log('Sending answers for evaluation:', answers);
        const { data, error } = await supabase.functions.invoke('interview-agent', {
          body: {
            role,
            mode: "final_evaluation",
            answers
          }
        });

        if (error) {
          console.error('Supabase function error:', error);
          throw error;
        }
        
        console.log('Final evaluation data:', data);
        setFinalEvaluation(data);
      } catch (error) {
        console.error('Error generating final evaluation:', error);
        toast({
          title: "Error",
          description: "Failed to generate final evaluation. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('interview-agent', {
        body: {
          role,
          mode: "generate_question",
          resumeText
        }
      });

      if (error) throw error;
      setCurrentQuestion(data.question);
      setQuestionCount(prev => prev + 1);
    } catch (error) {
      console.error('Error generating question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    // Store answer
    const newAnswers = [...answers, {
      question: currentQuestion,
      answer: answer.trim(),
    }];
    setAnswers(newAnswers);
    setAnswer("");
    
    // If this was the 10th question, trigger final evaluation
    if (questionCount === 10) {
      await generateQuestion(); // This will trigger final evaluation
      return;
    }
    
    // Otherwise, start countdown for next question
    let count = 5;
    setCountdown(count);
    
    const timer = setInterval(() => {
      count -= 1;
      setCountdown(count);
      
      if (count === 0) {
        clearInterval(timer);
        setCountdown(null);
        generateQuestion();
      }
    }, 1000);
  };

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
          ) : finalEvaluation ? (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Final Evaluation</h2>
              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <div className="font-medium text-xl">Final Score: {finalEvaluation.finalScore}/10</div>
                <div className="space-y-2">
                  <p className="font-medium">Overall Feedback:</p>
                  <p className="text-gray-600">{finalEvaluation.overallFeedback}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Strengths:</p>
                  <ul className="list-disc pl-5">
                    {finalEvaluation.strengths.map((strength: string, i: number) => (
                      <li key={i} className="text-gray-600">{strength}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Areas for Improvement:</p>
                  <ul className="list-disc pl-5">
                    {finalEvaluation.areasOfImprovement.map((area: string, i: number) => (
                      <li key={i} className="text-gray-600">{area}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-medium">
                    Question {questionCount}/10
                  </p>
                </div>
                <p className="text-lg">
                  {currentQuestion}
                </p>
                {countdown !== null && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-lg font-medium">Next question in {countdown}s...</p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={`flex-shrink-0 ${isListening ? 'bg-red-100' : ''}`}
                  onClick={toggleListening}
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
                  disabled={isLoading || !answer.trim() || countdown !== null}
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
