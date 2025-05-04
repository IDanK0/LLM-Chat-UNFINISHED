import { Router } from "express";
import { getProviderForModel } from "../api/modelAdapter";

const router = Router();

/**
 * Endpoint for extracting keywords from text using an AI model
 * POST /api/extract-keywords
 * 
 * Body:
 * {
 *   text: string,       // The text from which to extract keywords
 *   modelName?: string  // The model name to use (optional)
 * }
 * 
 * Response:
 * {
 *   keywords: string[]  // Array of extracted keywords
 * }
 */
router.post("/", async (req, res) => {
  try {
    const { text, modelName } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing or invalid text" });
    }

    // Get the appropriate AI provider based on the selected model
    const provider = getProviderForModel(modelName);
    
    // System prompt to extract keywords
    const prompt = `
Analyze the following text and extract 2-4 main keywords to search on Wikipedia for the best results.
Return ONLY a JSON array of strings, without additional text.
Example output: ["keyword1", "keyword2", "keyword3"]

TEXT: "${text}"
`;

    // Call the model with low temperature for more deterministic results
    const response = await provider.chat({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      // We don't specify max_tokens to use the default value of -1
    });

    // Extract keywords from the output
    let keywords: string[] = [];
    try {
      // Try to extract the JSON array from the response
      const content = response.message.content;
      
      // Look for a pattern that matches a JSON array
      // We use a simple regex compatible with ES2015
      const match = content.match(/\[([\s\S]*?)\]/);
      if (match) {
        // Parse JSON array of keywords
        keywords = JSON.parse(match[0]) as string[];
      } else {
        // If it doesn't find an array, split the text by commas or lines
        keywords = content
          .split(/[,\n]/)
          .map((k: string) => k.trim())
          .filter((k: string) => k && !k.includes("[") && !k.includes("]"));
      }
      
      // Make sure they are only non-empty strings
      keywords = keywords
        .filter((k: any) => k && typeof k === "string")
        // Remove surrounding quotes
        .map((k: string) => k.replace(/^['"`]|['"`]$/g, "").trim())
        // Remove any <think> tags and their content
        .map((k: string) => k.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/<\/?think>/g, "").trim())
        // Remove empty results
        .filter((k: string) => k.length > 0);
        
    } catch (parseError) {
      console.error("Error parsing keywords:", parseError);
      // Fallback: use the first words of the text
      keywords = text
        .split(/\s+/)
        .slice(0, 3)
        .filter(Boolean);
    }

    return res.json({ keywords });
  } catch (error) {
    console.error("Error extracting keywords:", error);
    return res.status(500).json({ error: "Error processing the request" });
  }
});

export default router; 