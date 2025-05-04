/**
 * Wikipedia API Service
 * Handles fetching search results from the Wikipedia API
 */

import { createLogger } from './logger';
import { getSettings } from "@/lib/settingsStore";

// Create a specific logger for the Wikipedia service
const logger = createLogger('Wikipedia');

interface WikipediaSearchResult {
  id: number;
  key: string;
  title: string;
  excerpt: string;
  matched_title: string | null;
  anchor: string | null;
  description: string | null;
  thumbnail?: {
    mimetype: string;
    width: number;
    height: number;
    duration: number | null;
    url: string;
  };
}

interface WikipediaSearchResponse {
  pages: WikipediaSearchResult[];
}

const WIKIPEDIA_API_ENDPOINT = "https://en.wikipedia.org/w/rest.php/v1/search/page";
const DEFAULT_LIMIT = 10;
const WIKIPEDIA_BASE_URL = "https://en.wikipedia.org/wiki/";
const MAX_QUERIES = 3; // Maximum number of queries to generate
const AI_EXTRACT_ENDPOINT = "/api/extract-keywords"; // Endpoint for AI-based keyword extraction

/**
 * Extracts keywords from a question using the selected AI model
 * @param question - The user's question
 * @param modelName - The AI model name to use (optional)
 * @returns Array of keywords extracted with the '#' prefix
 */
export async function extractKeywords(question: string, modelName?: string): Promise<string[]> {
  logger.info(`Intelligent extraction of keywords from the question...`);
  
  try {
    // Check if there are already hashtags in the question (highest priority)
    const hashtagPattern = /#([a-zA-Z0-9À-ÿ]+(?:\s+[a-zA-Z0-9À-ÿ]+)*)/g;
    const hashtags = [];
    let match;
    
    while ((match = hashtagPattern.exec(question)) !== null) {
      if (match[1] && match[1].trim()) {
        hashtags.push('#' + match[1].trim());
      }
    }
    
    // If the user has already specified hashtags, respect their choice
    if (hashtags.length > 0) {
      logger.info(`Using hashtags specified by the user: ${hashtags.join(', ')}`);
      return hashtags.slice(0, MAX_QUERIES);
    }
    
    // Otherwise, use AI to extract keywords
    logger.info(`No hashtags found, using AI for extraction...`);
    
    logger.debug(`Selected model: ${modelName || "default"}`);
    // Get site settings to use maxTokens limit
    const apiSettings = getSettings();
    const response = await fetch(AI_EXTRACT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: question,
        modelName: modelName || undefined, // Use the model selected by the user, if available
        maxTokens: apiSettings.maxTokens // Token limit from site settings
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Keyword extraction API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.keywords || !Array.isArray(data.keywords)) {
      logger.error("Invalid keyword API response:", data);
      throw new Error("Invalid response format from keyword extraction API");
    }
    
    // Add the '#' prefix to all keywords returned by the AI
    const formattedKeywords = data.keywords
      .filter((kw: string) => kw && typeof kw === 'string') // Make sure they are valid strings
      .map((kw: string) => kw.startsWith('#') ? kw : '#' + kw); // Add '#' if not present
    
    // Filter out any <think> tags from each keyword
    const cleanedKeywords = formattedKeywords.map((kw: string) =>
      kw.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<\/?think>/g, '').trim()
    );
    
    logger.success(`Keywords extracted successfully: ${cleanedKeywords.join(', ')}`);
    return cleanedKeywords.slice(0, MAX_QUERIES);
    
  } catch (error) {
    logger.error("Error during intelligent keyword extraction:", error);
    // Fallback: use the entire question as query
    return ['#' + question.slice(0, 50)]; // Limit to 50 characters to avoid queries that are too long
  }
}

/**
 * Utility function to introduce a delay between requests
 * @param ms - Milliseconds to wait
 */
async function delay(ms: number): Promise<void> {
  logger.debug(`Delay of ${ms}ms...`);
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Searches Wikipedia for the given query
 * @param query - The search query
 * @param limit - Maximum number of results to return (default: 10)
 * @returns A promise that resolves to the search results
 */
export async function searchWikipedia(
  query: string, 
  limit: number = DEFAULT_LIMIT
): Promise<WikipediaSearchResult[]> {
  try {
    // If the query has a '#' prefix, remove it before searching
    const cleanQuery = query.startsWith('#') ? query.substring(1) : query;
    
    logger.info(`Searching Wikipedia: "${cleanQuery}" (limit: ${limit})`);
    
    // Construct URL with query parameters
    const url = new URL(WIKIPEDIA_API_ENDPOINT);
    url.searchParams.append("q", cleanQuery);
    url.searchParams.append("limit", limit.toString());

    logger.debug(`Request URL: ${url.toString()}`);

    // Add a 500ms delay to avoid 429 Too Many Requests
    await delay(500);

    // Make the request
    const response = await fetch(url.toString());
    
    // Handle API errors
    if (!response.ok) {
      logger.error(`Wikipedia API error: ${response.status} ${response.statusText}`);
      throw new Error(`Wikipedia API error: ${response.status} ${response.statusText}`);
    }
    
    // Parse the response
    const data: WikipediaSearchResponse = await response.json();
    const resultCount = data.pages?.length || 0;
    
    if (resultCount > 0) {
      logger.success(`Found ${resultCount} results for "${cleanQuery}"`);
    } else {
      logger.warn(`No results found for "${cleanQuery}"`);
    }
    
    return data.pages || [];
  } catch (error) {
    logger.error(`Error searching "${query}" on Wikipedia:`, error);
    throw error;
  }
}

/**
 * Performs multiple Wikipedia searches using keywords extracted from the question
 * @param question - The user's question
 * @param limit - Total limit of results
 * @param modelName - The AI model name to use for keyword extraction
 * @returns Combined results from all searches
 */
export async function searchWikipediaWithKeywords(
  question: string,
  limit: number = DEFAULT_LIMIT,
  modelName?: string
): Promise<WikipediaSearchResult[]> {
  logger.info(`Starting intelligent search with keyword analysis...`);
  
  try {
    // Extract keywords from the question using the AI model
    const keywords = await extractKeywords(question, modelName);
    logger.info(`Extracted keywords: ${keywords.join(', ')}`);
    
    if (keywords.length === 0) {
      logger.warn(`No keywords found, using the entire question`);
      return await searchWikipedia(question, limit);
    }
    
    // Perform searches for each keyword, with delays between requests
    const allResults: WikipediaSearchResult[] = [];
    
    logger.info(`Executing searches for ${keywords.length} keywords...`);
    
    for (const keyword of keywords) {
      try {
        logger.info(`Searching for keyword: "${keyword}"`);
        // Add a delay between requests to avoid 429
        await delay(1000);
        
        const results = await searchWikipedia(keyword, Math.ceil(limit / keywords.length));
        allResults.push(...results);
        
        logger.info(`Found ${results.length} results for "${keyword}"`);
      } catch (error) {
        logger.error(`Error in search for "${keyword}":`, error);
        // Continue with other keywords
      }
    }
    
    // Combine and remove duplicates
    const uniqueResults: WikipediaSearchResult[] = [];
    const seenIds: {[key: number]: boolean} = {};
    
    allResults.forEach(result => {
      if (!seenIds[result.id]) {
        seenIds[result.id] = true;
        uniqueResults.push(result);
      }
    });
    
    // Limit the results
    const finalResults = uniqueResults.slice(0, limit);
    logger.success(`Search completed: ${finalResults.length} unique combined results`);
    
    return finalResults;
  } catch (error) {
    logger.error("Error in Wikipedia search with keywords:", error);
    // Fallback to standard search
    logger.warn("Falling back to standard search using the entire question");
    return searchWikipedia(question, limit);
  }
}

/**
 * Formats Wikipedia search results as a context message for AI
 * @param results - The search results from Wikipedia
 * @returns A formatted string with the search results
 */
export function formatWikipediaResultsForAI(results: WikipediaSearchResult[]): string {
  if (!results || results.length === 0) {
    logger.warn("No results to format for AI");
    return "No results found on Wikipedia for this search.";
  }
  
  logger.info(`Formatting ${results.length} results for AI`);
  
  let formattedResults = "### Relevant Results from Wikipedia\n\n";
  
  results.forEach((result, index) => {
    // Create the full article URL
    const articleUrl = `${WIKIPEDIA_BASE_URL}${encodeURIComponent(result.key)}`;
    
    // Add title with link
    formattedResults += `${index + 1}. **[${result.title}](${articleUrl})**\n\n`;
    
    if (result.description) {
      formattedResults += `   *${result.description}*\n\n`;
    }
    
    if (result.excerpt) {
      // Clean up and format the excerpt
      const cleanExcerpt = result.excerpt
        .replace(/Disambiguation – /g, '')
        .replace(/If you're looking for /g, '')
        .replace(/\bsee\b/g, 'refer to');
      
      formattedResults += `   ${cleanExcerpt}\n\n`;
    }
    
    // Add direct link to the article to facilitate citation
    formattedResults += `   [Read the full article](${articleUrl})\n\n`;
  });
  
  // Add citations section with clickable links and ensure at least 4 sources
  formattedResults += "### Citations:\n";
  // Build citation entries for each result
  results.forEach((result, index) => {
    const articleUrl = `${WIKIPEDIA_BASE_URL}${encodeURIComponent(result.key)}`;
    formattedResults += `[${index + 1}]: [${result.title}](${articleUrl})\n`;
  });
  // If fewer than 4 citations, duplicate the last source until 4 total
  const minCitations = 4;
  if (results.length > 0 && results.length < minCitations) {
    const last = results[results.length - 1];
    const lastUrl = `${WIKIPEDIA_BASE_URL}${encodeURIComponent(last.key)}`;
    for (let i = results.length; i < minCitations; i++) {
      formattedResults += `[${i + 1}]: [${last.title}](${lastUrl})\n`;
    }
  }
  formattedResults += "\n";
  
  logger.debug(`Formatted result: ${formattedResults.length} characters`);
  
  return formattedResults;
}

// To manually run the test, uncomment this code:
/*
// Manual test of keyword extraction
const testQueries = [
  "Tell me about the history of FL Studio and then compare it with Ableton Live.",
  "Tell me about #FL Studio and #Ableton Live",
  "Who are Barack Obama and Donald Trump?",
  "What are the differences between \"machine learning\" and \"deep learning\"?",
  "Tell me about Ferrari and Lamborghini"
];

testQueries.forEach(query => {
  console.log(`\nQuery: "${query}"`);
  const keywords = extractKeywords(query);
  console.log("Extracted keywords:", keywords);
});
*/ 