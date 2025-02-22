
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { role, mode, answers, resumeText } = await req.json();
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

    if (mode === 'final_evaluation') {
      console.log('Generating final evaluation for answers:', answers);
      
      const answersText = answers.map((a: any, i: number) => 
        `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}`
      ).join('\n\n');

      const prompt = `As an expert technical interviewer for a ${role} position, evaluate these interview answers:

${answersText}

Provide a comprehensive evaluation in this JSON format (maintain the exact structure):
{
  "finalScore": <number between 1-10>,
  "overallFeedback": "<detailed feedback about overall performance>",
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "areasOfImprovement": ["<area1>", "<area2>", "<area3>"]
}`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      try {
        const parsedResponse = JSON.parse(response.trim());
        return new Response(JSON.stringify(parsedResponse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.log('Raw AI response:', response);
        throw new Error('Failed to parse evaluation response');
      }
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
