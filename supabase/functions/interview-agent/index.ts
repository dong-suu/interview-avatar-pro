
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { role, currentQuestion, userAnswer, mode, resumeText } = await req.json();
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    if (mode === 'generate_question') {
      let prompt;
      if (resumeText) {
        prompt = `As an expert technical interviewer for a ${role} position, analyze this resume:
        ${resumeText}
        
        Based on the candidate's experience and skills, generate a relevant technical interview question. 
        The question should be challenging but clear. Only return the question text, nothing else.`;
      } else {
        prompt = `As an expert technical interviewer for a ${role} position, generate a relevant interview question. 
        The question should be challenging but clear. Only return the question text, nothing else.`;
      }
      
      const result = await model.generateContent(prompt);
      const question = result.response.text();
      
      return new Response(JSON.stringify({ question }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } 
    
    if (mode === 'evaluate_answer') {
      const prompt = `As an expert technical interviewer for a ${role} position, evaluate this candidate's answer to the question: "${currentQuestion}"
      
      Candidate's answer: "${userAnswer}"
      
      Provide feedback in this JSON format:
      {
        "score": (number between 1-10),
        "feedback": "brief constructive feedback",
        "nextQuestion": "a follow-up question based on their answer"
      }`;
      
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      return new Response(response, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (mode === 'final_evaluation') {
      const { answers } = await req.json();
      const prompt = `As an expert technical interviewer for a ${role} position, evaluate these 10 answers:
      ${answers.map((a: any, i: number) => `
      Q${i + 1}: ${a.question}
      A${i + 1}: ${a.answer}
      Score: ${a.score}
      `).join('\n')}
      
      Provide a final evaluation in this JSON format:
      {
        "finalScore": (number between 1-10),
        "overallFeedback": "comprehensive feedback about the candidate's performance",
        "strengths": ["list", "of", "strengths"],
        "areasOfImprovement": ["list", "of", "areas", "to", "improve"]
      }`;
      
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      return new Response(response, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid mode' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
