
interface FinalEvaluationProps {
  evaluation: {
    finalScore: number;
    overallFeedback: string;
    strengths: string[];
    areasOfImprovement: string[];
    closingRemarks?: string;
  };
}

export const FinalEvaluation = ({ evaluation }: FinalEvaluationProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Interview Feedback</h2>
      <div className="p-4 bg-gray-50 rounded-lg space-y-4">
        <div className="font-medium text-xl">Score: {evaluation.finalScore}/10</div>
        <div className="space-y-2">
          <p className="text-gray-600">{evaluation.overallFeedback}</p>
        </div>
        <div className="space-y-2">
          <p className="font-medium">Your Strengths:</p>
          <ul className="list-disc pl-5">
            {evaluation.strengths.map((strength, i) => (
              <li key={i} className="text-gray-600">{strength}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <p className="font-medium">Areas for Growth:</p>
          <ul className="list-disc pl-5">
            {evaluation.areasOfImprovement.map((area, i) => (
              <li key={i} className="text-gray-600">{area}</li>
            ))}
          </ul>
        </div>
        {evaluation.closingRemarks && (
          <div className="mt-4 text-gray-600 italic">
            {evaluation.closingRemarks}
          </div>
        )}
      </div>
    </div>
  );
};
