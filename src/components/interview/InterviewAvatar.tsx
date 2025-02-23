
interface InterviewAvatarProps {
  isSpeaking: boolean;
}

export const InterviewAvatar = ({ isSpeaking }: InterviewAvatarProps) => {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-32 h-32 bg-interview-accent rounded-full animate-float shadow-lg relative">
        {isSpeaking && (
          <div className="absolute inset-0 border-4 border-blue-400 rounded-full animate-ping" />
        )}
      </div>
    </div>
  );
};
