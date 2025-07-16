import { NCBIClient } from "./src";

async function example() {
  const client = new NCBIClient();

  try {
    // Search for articles about COVID-19
    console.log("Searching for COVID-19 articles...");
    const searchResult = await client.search({
      db: "pubmed",
      term: "COVID-19",
      retmax: 5,
    });

    console.log(`Found ${searchResult.count} articles`);
    console.log("First 5 IDs:", searchResult.idlist);

    if (searchResult.idlist.length > 0) {
      // Fetch detailed information for the first article
      console.log("\nFetching detailed information for first article...");
      const fetchResult = await client.fetch({
        db: "pubmed",
        id: searchResult.idlist[0],
        rettype: "abstract",
        retmode: "xml",
      });

      console.log("Fetched data structure:", Object.keys(fetchResult.data));
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the example
example();
