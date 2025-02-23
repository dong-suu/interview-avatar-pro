
import { Button } from "@/components/ui/button";
import { VolumeX, Volume2 } from "lucide-react";

interface AudioControlsProps {
  isMuted: boolean;
  onToggleMute: () => void;
}

export const AudioControls = ({ isMuted, onToggleMute }: AudioControlsProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggleMute}
      className="ml-2"
    >
      {isMuted ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
};
