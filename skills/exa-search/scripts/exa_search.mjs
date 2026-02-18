// skills/exa-search/scripts/exa_search.mjs
import Exa from 'exa-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from workspace root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const apiKey = process.env.EXA_API_KEY;

if (!apiKey) {
  console.error('Error: EXA_API_KEY is not defined in .env or environment.');
  console.error('Sign up for a free key at https://exa.ai/login and add EXA_API_KEY=your_key to .env');
  process.exit(1);
}

const exa = new Exa(apiKey);

async function runSearch() {
  const args = process.argv.slice(2);
  const mode = args[0]; // search, crawl, code, etc.
  const queryOrUrl = args[1];
  const options = args[2] ? JSON.parse(args[2]) : {};

  try {
    let result;
    switch (mode) {
      case 'search':
        console.log(`Searching Exa for: "${queryOrUrl}"...`);
        result = await exa.searchAndContents(queryOrUrl, {
          numResults: options.numResults || 5,
          useAutoprompt: true,
          type: 'keyword', // Default to keyword search
          ...options
        });
        break;

      case 'neural': // Semantic/Neural search (Exa default)
        console.log(`Neural search for: "${queryOrUrl}"...`);
        result = await exa.searchAndContents(queryOrUrl, {
          numResults: options.numResults || 5,
          useAutoprompt: true,
          type: 'neural',
          ...options
        });
        break;

      case 'crawl':
        console.log(`Crawling URL: ${queryOrUrl}...`);
        // crawl is actually getContents for specific IDs/URLs in Exa context usually
        // but let's assume they want contents of a specific URL if provided
        // or search specific site.
        // For direct URL content fetching, exa.getContents([url]) works best.
        result = await exa.getContents([queryOrUrl], {
            text: true
        });
        break;

       case 'find-similar':
        console.log(`Finding similar to: ${queryOrUrl}...`);
        result = await exa.findSimilarAndContents(queryOrUrl, {
            numResults: options.numResults || 5,
            ...options
        });
        break;

      default:
        console.error(`Unknown mode: ${mode}`);
        console.error('Usage: node exa_search.mjs <mode> <query/url> [options_json]');
        process.exit(1);
    }

    // Output strictly JSON for OpenClaw to parse if needed, or readable text
    if (options.jsonOutput) {
        console.log(JSON.stringify(result, null, 2));
    } else {
        // Human readable summary
        if (result.results) {
            result.results.forEach((item, index) => {
                console.log(`\n--- Result ${index + 1} ---`);
                console.log(`Title: ${item.title || 'No Title'}`);
                console.log(`URL: ${item.url}`);
                if (item.publishedDate) console.log(`Date: ${item.publishedDate}`);
                if (item.author) console.log(`Author: ${item.author}`);
                if (item.text) {
                    // Truncate text for readability in console
                    const snippet = item.text.slice(0, 500).replace(/\n/g, ' ');
                    console.log(`Snippet: ${snippet}...`);
                }
            });
        } else {
            console.log(JSON.stringify(result, null, 2));
        }
    }

  } catch (error) {
    console.error('Exa API Error:', error.message);
    process.exit(1);
  }
}

runSearch();
