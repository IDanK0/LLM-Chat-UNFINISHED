/**
 * Test for keyword extraction and Wikipedia search
 * This script performs a complete search and shows the results in the terminal
 */

import { extractKeywords, searchWikipedia, searchWikipediaWithKeywords, formatWikipediaResultsForAI } from './services/wikipediaService';

async function runTest() {
  // Test queries 
  const testQueries = [
    "Tell me about the history of FL Studio and then compare it with Ableton Live.",
    "Tell me about #FL Studio and #Ableton Live",
    "Who are Barack Obama and Donald Trump?",
    "What are the differences between \"machine learning\" and \"deep learning\"?",
    "Tell me about Ferrari and Lamborghini"
  ];

  console.log("=".repeat(80));
  console.log("KEYWORD EXTRACTION AND WIKIPEDIA SEARCH TEST");
  console.log("=".repeat(80));

  // Test user query
  const userQuery = "Tell me about the history of FL Studio and then compare it with Ableton Live.";
  
  console.log(`\n\nTEST QUERY: "${userQuery}"`);
  console.log("-".repeat(80));

  console.log("\nPHASE 1: Keyword extraction");
  console.log("-".repeat(50));
  
  const keywords = await extractKeywords(userQuery);
  console.log("Extracted keywords:", keywords);
  
  if (keywords.length === 0) {
    console.log("ERROR: No keywords extracted!");
  }

  console.log("\nPHASE 2: Wikipedia search for each keyword");
  console.log("-".repeat(50));

  try {
    console.log("Starting search with keywords...");
    for (const keyword of keywords) {
      console.log(`\nSearch for keyword: "${keyword}"`);
      
      const results = await searchWikipedia(keyword, 3);
      
      if (results.length === 0) {
        console.log(`No results found for "${keyword}"`);
      } else {
        console.log(`Found ${results.length} results for "${keyword}":`);
        results.forEach((result, index) => {
          console.log(`  ${index + 1}. ${result.title} (ID: ${result.id})`);
          console.log(`     ${result.excerpt ? result.excerpt.slice(0, 100) + '...' : 'No excerpt'}`);
        });
      }
    }

    console.log("\nPHASE 3: Combined search with all keywords");
    console.log("-".repeat(50));
    
    console.log("Starting combined search with all keywords...");
    const combinedResults = await searchWikipediaWithKeywords(userQuery);
    
    if (combinedResults.length === 0) {
      console.log("ERROR: No combined results found!");
    } else {
      console.log(`Found ${combinedResults.length} combined results:`);
      combinedResults.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.title} (ID: ${result.id})`);
        console.log(`     ${result.excerpt ? result.excerpt.slice(0, 100) + '...' : 'No excerpt'}`);
      });
    }

    console.log("\nPHASE 4: Formatting results for AI");
    console.log("-".repeat(50));
    
    const formattedResults = formatWikipediaResultsForAI(combinedResults);
    console.log("First 500 characters of formatted results:");
    console.log(formattedResults.slice(0, 500) + "...");
    
    console.log("\n=".repeat(80));
    console.log("TEST COMPLETED");
    console.log("=".repeat(80));

  } catch (error) {
    console.error("ERROR during test:", error);
  }
}

// Run the test
runTest().catch(error => {
  console.error("Test error:", error);
}); 