const logger = require('./logger');


async function callGeminiAndParseJSON(systemPrompt, userPrompt) {
  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    const MODEL = 'gemini-2.5-flash';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          { parts: [{ text: userPrompt }] }
        ],
        generationConfig: {
          
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    
    const textContent = data.candidates[0].content.parts[0].text;
    
    
    
    return JSON.parse(textContent);
  } catch (error) {
    logger.error('AI Helper Error:', { error: error.message });
    throw new Error('Failed to process AI request. Make sure your Gemini API key is correct.');
  }
}


async function generateSubtasks(taskDescription) {
  const systemPrompt = `You are a helpful task breakdown assistant. 
  You must ALWAYS respond with ONLY a raw JSON array of objects. 
  Each object must have exactly two keys: "title" (string) and "description" (string).`;
  
  const userPrompt = `Please break down the following task into 3 to 5 smaller, manageable subtasks.\n\nTask:\n${taskDescription}`;
  
  return await callGeminiAndParseJSON(systemPrompt, userPrompt);
}


async function analyzeCode(code, language) {
  const systemPrompt = `You are an expert strict code reviewer. 
  You must ALWAYS respond with ONLY a raw JSON object. 
  The object must have these exact keys: "quality_score" (a number between 1 and 10), "issues" (an array of strings), and "suggestions" (an array of strings).`;
  
  const userPrompt = `Review the following ${language} code:\n\n${code}`;
  
  return await callGeminiAndParseJSON(systemPrompt, userPrompt);
}


async function suggestPriority(title, description, projectContext) {
  const systemPrompt = `You are an expert agile project manager. 
  You must ALWAYS respond with ONLY a raw JSON object. 
  The object must have exactly these keys: "priority" (must be strictly one of: "low", "medium", "high", "critical"), "estimatedHours" (a number), and "reasoning" (a brief string explaining why).`;
  
  const userPrompt = `Evaluate the priority for this task based on the context:\n\nTask Title: ${title}\nDescription: ${description}\nProject Context: ${projectContext}`;
  
  return await callGeminiAndParseJSON(systemPrompt, userPrompt);
}


async function parseMeetingNotes(notes) {
  const systemPrompt = `You are a sharp assistant that extracts action items from meeting transcripts. 
  You must ALWAYS respond with ONLY a raw JSON array of objects. 
  Each object must represent a task and contain these keys: "title" (string), "assignee" (string name, or null if unknown), and "dueDate" (ISO date string, or null if unknown).`;
  
  const userPrompt = `Extract all tasks or action items from these meeting notes:\n\n${notes}`;
  
  return await callGeminiAndParseJSON(systemPrompt, userPrompt);
}

module.exports = {
  generateSubtasks,
  analyzeCode,
  suggestPriority,
  parseMeetingNotes
};
