/**
 * A private helper function to manage the fetch request and safely extract JSON from Gemini's response.
 */
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
          // Gemini has a built-in feature to force pure JSON output!
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    // Extract the text content from the Gemini response structure
    const textContent = data.candidates[0].content.parts[0].text;
    
    // Because we set responseMimeType to application/json, we don't need regex. 
    // Gemini guarantees the output is a valid JSON string.
    return JSON.parse(textContent);
  } catch (error) {
    console.error('AI Helper Error:', error.message);
    throw new Error('Failed to process AI request. Make sure your Gemini API key is correct.');
  }
}

/**
 * 1. Generates subtasks from a main task description
 */
async function generateSubtasks(taskDescription) {
  const systemPrompt = `You are a helpful task breakdown assistant. 
  You must ALWAYS respond with ONLY a raw JSON array of objects. 
  Each object must have exactly two keys: "title" (string) and "description" (string).`;
  
  const userPrompt = `Please break down the following task into 3 to 5 smaller, manageable subtasks.\n\nTask:\n${taskDescription}`;
  
  return await callGeminiAndParseJSON(systemPrompt, userPrompt);
}

/**
 * 2. Analyzes code and returns quality scores and suggestions
 */
async function analyzeCode(code, language) {
  const systemPrompt = `You are an expert strict code reviewer. 
  You must ALWAYS respond with ONLY a raw JSON object. 
  The object must have these exact keys: "quality_score" (a number between 1 and 10), "issues" (an array of strings), and "suggestions" (an array of strings).`;
  
  const userPrompt = `Review the following ${language} code:\n\n${code}`;
  
  return await callGeminiAndParseJSON(systemPrompt, userPrompt);
}

/**
 * 3. Suggests priority based on task and project context
 */
async function suggestPriority(title, description, projectContext) {
  const systemPrompt = `You are an expert agile project manager. 
  You must ALWAYS respond with ONLY a raw JSON object. 
  The object must have exactly these keys: "priority" (must be strictly one of: "low", "medium", "high", "critical"), "estimatedHours" (a number), and "reasoning" (a brief string explaining why).`;
  
  const userPrompt = `Evaluate the priority for this task based on the context:\n\nTask Title: ${title}\nDescription: ${description}\nProject Context: ${projectContext}`;
  
  return await callGeminiAndParseJSON(systemPrompt, userPrompt);
}

/**
 * 4. Parses unstructured meeting notes to extract action items
 */
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
