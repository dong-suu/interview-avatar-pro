
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
    const { role, mode, answers, resumeText, previousAnswers } = await req.json();
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    if (mode === 'generate_question') {
      let prompt;
      if (resumeText) {
        prompt = `You are Sarah, a friendly and professional technical interviewer for a ${role} position. 
        You've reviewed this resume: ${resumeText}
        
        Based on the candidate's experience, generate the next interview question.
        Make it conversational, like you're having a friendly chat, but still professional.
        If this isn't the first question, consider their previous answers for context.
        
        Previous answers: ${JSON.stringify(previousAnswers || [])}
        
        Format your response in JSON like this:
        {
          "question": "your question here",
          "context": "optional friendly lead-in to the question"
        }
        `;
      } else {
        prompt = `You are Sarah, a friendly and professional technical interviewer for a ${role} position.
        Generate the next interview question.
        Make it conversational, like you're having a friendly chat, but still professional.
        If this isn't the first question, consider their previous answers for context.
        
        Previous answers: ${JSON.stringify(previousAnswers || [])}
        
        Format your response in JSON like this:
        {
          "question": "your question here",
          "context": "optional friendly lead-in to the question"
        }
        `;
      }
      
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const parsedResponse = JSON.parse(response.trim());
      
      return new Response(JSON.stringify(parsedResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } 

    if (mode === 'final_evaluation') {
      console.log('Generating final evaluation for answers:', answers);
      
      const answersText = answers.map((a: any, i: number) => 
        `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}`
      ).join('\n\n');

      const prompt = `You are Sarah, a friendly and professional technical interviewer for a ${role} position. 
      You've just finished conducting an interview and need to provide feedback.
      Be encouraging and constructive, while maintaining professionalism.
      
      Here are the candidate's answers:
      ${answersText}

      Provide a friendly, detailed evaluation in this JSON format:
      {
        "finalScore": <number between 1-10>,
        "overallFeedback": "<start with a friendly greeting and provide detailed, encouraging feedback>",
        "strengths": ["<strength1>", "<strength2>", "<strength3>"],
        "areasOfImprovement": ["<area1>", "<area2>", "<area3>"],
        "closingRemarks": "<friendly closing statement with encouragement for future growth>"
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
