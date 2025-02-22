
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const InterviewSetup = () => {
  const [role, setRole] = useState("");

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

          <Button
            className="w-full bg-interview-accent hover:bg-opacity-90"
            disabled={!role.trim()}
            onClick={() => window.location.href = "/interview"}
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default InterviewSetup;
