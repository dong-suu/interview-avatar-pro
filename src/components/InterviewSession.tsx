
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Send, VolumeX, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useConversation } from "@11labs/react";

interface Answer {
  question: string;
  answer: string;
}

const InterviewSession = () => {
  const { toast } = useToast();
  const [answer, setAnswer] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionContext, setQuestionContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [finalEvaluation, setFinalEvaluation] = useState<any>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const recognition = useRef<any>(null);
  const role = sessionStorage.getItem('interviewRole') || "Software Engineer";
  const resumeText = sessionStorage.getItem('resumeText') || null;

  const conversation = useConversation({
    overrides: {
      tts: {
        voiceId: "Sarah", // Using Sarah's voice for the interviewer
      },
    },
  });

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognition.current = new (window as any).webkitSpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;

      recognition.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setAnswer(transcript);
      };

      recognition.current.onerror = () => {
        setIsListening(false);
        toast({
          title: "Error",
          description: "Failed to recognize speech. Please try again.",
          variant: "destructive",
        });
      };

      recognition.current.onend = () => {
        if (isListening) {
          recognition.current.start();
        }
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

  const speakText = async (text: string) => {
    if (isMuted) return;
    
    setIsSpeaking(true);
    try {
      await conversation.setVolume({ volume: 1.0 });
      // Use ElevenLabs to speak the text
      // The text will be automatically converted to speech
      await new Promise((resolve) => setTimeout(resolve, 500)); // Small pause for natural feel
    } catch (error) {
      console.error('Speech error:', error);
      toast({
        title: "Error",
        description: "Failed to generate speech. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSpeaking(false);
    }
  };

  const generateQuestion = async () => {
    if (questionCount >= 10) {
      // Generate final evaluation
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('interview-agent', {
          body: {
            role,
            mode: "final_evaluation",
            answers
          }
        });

        if (error) throw error;
        
        setFinalEvaluation(data);
        // Speak the final evaluation
        const summaryText = `Thank you for completing the interview. ${data.overallFeedback}`;
        await speakText(summaryText);
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
          resumeText,
          previousAnswers: answers
        }
      });

      if (error) throw error;
      
      setCurrentQuestion(data.question);
      setQuestionContext(data.context || "");
      setQuestionCount(prev => prev + 1);

      // Speak the new question
      const textToSpeak = data.context 
        ? `${data.context} ${data.question}`
        : data.question;
      await speakText(textToSpeak);
    } catch (error) {
      console.error('Error generating question:', error);
      toast({
        title: "Error",
        description: "Failed to generate question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    // Store answer and reset input
    const newAnswers = [...answers, {
      question: currentQuestion,
      answer: answer.trim(),
    }];
    setAnswers(newAnswers);
    setAnswer("");
    
    // Stop listening when submitting
    if (isListening) {
      recognition.current?.stop();
      setIsListening(false);
    }
    
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

  // Start interview when component mounts
  useEffect(() => {
    generateQuestion();
    return () => {
      if (isListening) {
        recognition.current?.stop();
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-interview-background">
      {/* Avatar Section */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-32 h-32 bg-interview-accent rounded-full animate-float shadow-lg relative">
          {isSpeaking && (
            <div className="absolute inset-0 border-4 border-blue-400 rounded-full animate-ping" />
          )}
        </div>
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
              <h2 className="text-xl font-bold">Interview Feedback</h2>
              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <div className="font-medium text-xl">Score: {finalEvaluation.finalScore}/10</div>
                <div className="space-y-2">
                  <p className="text-gray-600">{finalEvaluation.overallFeedback}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Your Strengths:</p>
                  <ul className="list-disc pl-5">
                    {finalEvaluation.strengths.map((strength: string, i: number) => (
                      <li key={i} className="text-gray-600">{strength}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Areas for Growth:</p>
                  <ul className="list-disc pl-5">
                    {finalEvaluation.areasOfImprovement.map((area: string, i: number) => (
                      <li key={i} className="text-gray-600">{area}</li>
                    ))}
                  </ul>
                </div>
                {finalEvaluation.closingRemarks && (
                  <div className="mt-4 text-gray-600 italic">
                    {finalEvaluation.closingRemarks}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-medium">
                    Question {questionCount}/10
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMuted(!isMuted)}
                    className="ml-2"
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {questionContext && (
                  <p className="text-gray-600 italic">
                    {questionContext}
                  </p>
                )}
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
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default InterviewSession;
