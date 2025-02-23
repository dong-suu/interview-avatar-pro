import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useConversation } from "@11labs/react";
import { InterviewAvatar } from "./interview/InterviewAvatar";
import { AudioControls } from "./interview/AudioControls";
import { AnswerInput } from "./interview/AnswerInput";
import { FinalEvaluation } from "./interview/FinalEvaluation";

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
        voiceId: "Sarah",
        model: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
    },
  });

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognition.current = new (window as any).webkitSpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setAnswer(transcript);
      };

      recognition.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Error",
          description: `Speech recognition error: ${event.error}`,
          variant: "destructive",
        });
      };

      recognition.current.onend = () => {
        if (isListening) {
          recognition.current.start();
        }
      };
    } else {
      toast({
        title: "Warning",
        description: "Speech recognition is not supported in this browser. Please use Chrome.",
        variant: "destructive",
      });
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognition.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognition.current?.start();
        setIsListening(true);
      } catch (error) {
        console.error('Speech recognition start error:', error);
        toast({
          title: "Error",
          description: "Failed to start speech recognition. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const speakText = async (text: string) => {
    if (isMuted) return;
    
    setIsSpeaking(true);
    try {
      await conversation.startConversation({
        agentId: "sarah_interviewer",
      });
      await conversation.setVolume({ volume: 1.0 });
      await conversation.sendMessage({ text });
      await new Promise((resolve) => setTimeout(resolve, 500));
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

    const newAnswers = [...answers, {
      question: currentQuestion,
      answer: answer.trim(),
    }];
    setAnswers(newAnswers);
    setAnswer("");
    
    if (isListening) {
      recognition.current?.stop();
      setIsListening(false);
    }
    
    if (questionCount === 10) {
      await generateQuestion();
      return;
    }
    
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
    return () => {
      if (isListening) {
        recognition.current?.stop();
      }
      conversation.endSession();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-interview-background">
      <InterviewAvatar isSpeaking={isSpeaking} />

      <div className="p-4 bg-interview-card shadow-lg">
        <Card className="p-6 space-y-4">
          {isLoading ? (
            <div className="text-lg font-medium text-gray-500">
              Thinking...
            </div>
          ) : finalEvaluation ? (
            <FinalEvaluation evaluation={finalEvaluation} />
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-medium">
                    Question {questionCount}/10
                  </p>
                  <AudioControls 
                    isMuted={isMuted}
                    onToggleMute={() => setIsMuted(!isMuted)}
                  />
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

              <AnswerInput
                answer={answer}
                isListening={isListening}
                isLoading={isLoading}
                countdown={countdown}
                onAnswerChange={setAnswer}
                onToggleListening={toggleListening}
                onSubmit={handleSubmit}
              />
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default InterviewSession;
