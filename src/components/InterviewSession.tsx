
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Send, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Answer {
  question: string;
  answer: string;
  score: number;
  feedback: string;
}

const InterviewSession = () => {
  const { toast } = useToast();
  const [answer, setAnswer] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<{
    score: number;
    feedback: string;
  } | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [finalEvaluation, setFinalEvaluation] = useState<any>(null);
  
  const recognition = useRef<any>(null);

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

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        setResumeText(text);
        generateQuestion();
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Error reading PDF:', error);
      toast({
        title: "Error",
        description: "Failed to process the resume. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateQuestion = async () => {
    if (questionCount >= 10 && answers.length >= 10) {
      // Generate final evaluation
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('interview-agent', {
          body: {
            role: "Software Engineer",
            mode: "final_evaluation",
            answers
          }
        });

        if (error) throw error;
        setFinalEvaluation(data);
      } catch (error) {
        console.error('Error generating final evaluation:', error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('interview-agent', {
        body: {
          role: "Software Engineer",
          mode: "generate_question",
          resumeText
        }
      });

      if (error) throw error;
      setCurrentQuestion(data.question);
      setFeedback(null);
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

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('interview-agent', {
        body: {
          role: "Software Engineer",
          currentQuestion,
          userAnswer: answer,
          mode: "evaluate_answer"
        }
      });

      if (error) throw error;
      
      const newFeedback = {
        score: data.score,
        feedback: data.feedback
      };
      
      setFeedback(newFeedback);
      setAnswers(prev => [...prev, {
        question: currentQuestion,
        answer: answer,
        score: data.score,
        feedback: data.feedback
      }]);
      
      // After a delay, show the next question
      setTimeout(() => {
        setAnswer("");
        generateQuestion();
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
      {/* Resume Upload Section */}
      {questionCount === 0 && (
        <div className="p-4 flex justify-center">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Upload Resume (Optional)</h3>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".pdf"
                onChange={handleResumeUpload}
                className="hidden"
                id="resume-upload"
              />
              <label
                htmlFor="resume-upload"
                className="flex items-center gap-2 cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                <Upload className="h-4 w-4" />
                Choose PDF
              </label>
            </div>
          </Card>
        </div>
      )}

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
