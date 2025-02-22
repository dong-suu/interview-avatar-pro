
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { role, currentQuestion, userAnswer, mode } = await req.json();
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    if (mode === 'generate_question') {
      const prompt = `As an expert technical interviewer for a ${role} position, generate a relevant interview question. The question should be challenging but clear. Only return the question text, nothing else.`;
      
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
