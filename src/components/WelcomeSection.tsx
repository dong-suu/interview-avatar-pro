
import { ArrowRight } from "lucide-react";

const WelcomeSection = () => {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-interview-background animate-fadeIn">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
            Master Your Interview Skills
          </h1>
          <p className="text-xl text-gray-600">
            Practice with our AI-powered interview assistant and get personalized feedback
          </p>
        </div>
        
        <div className="w-24 h-24 bg-interview-accent rounded-full mx-auto animate-float shadow-lg" />
        
        <a
          href="/interview-setup"
          className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-interview-accent rounded-full hover:bg-opacity-90 transition-all duration-200 gap-2"
        >
          Start Interview
          <ArrowRight className="w-5 h-5" />
        </a>
      </div>
    </section>
  );
};

export default WelcomeSection;
