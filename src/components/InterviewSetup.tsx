
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowRight, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const InterviewSetup = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [resumeText, setResumeText] = useState<string | null>(null);

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
        toast({
          title: "Resume uploaded",
          description: "Your resume has been successfully processed.",
        });
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

  const handleStart = () => {
    sessionStorage.setItem('interviewRole', role);
    if (resumeText) {
      sessionStorage.setItem('resumeText', resumeText);
    }
    navigate('/interview');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-interview-background p-4">
      <Card className="max-w-md w-full p-6 space-y-6 animate-fadeIn shadow-lg bg-interview-card">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Interview Setup</h2>
          <p className="text-gray-500">Configure your mock interview session</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Job Role</Label>
            <Input
              id="role"
              placeholder="e.g. Software Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume">Resume (Optional)</Label>
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
              {resumeText && (
                <span className="text-sm text-green-600">Resume uploaded</span>
              )}
            </div>
          </div>

          <Button
            className="w-full bg-interview-accent hover:bg-opacity-90"
            disabled={!role.trim()}
            onClick={handleStart}
          >
            Start Interview
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default InterviewSetup;
