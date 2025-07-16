# NCBI Toolkit

A lightweight TypeScript library for interacting with NCBI E-utilities API.

## Features

- 🔍 Search NCBI databases using ESearch
- 📥 Fetch records using EFetch
- 🔧 TypeScript support with full type definitions
- 🚀 Built with modern fetch API
- 📝 XML parsing with fast-xml-parser
- ⚡ Minimal dependencies

## Installation

```bash
npm install ncbi-toolkit
```

## Quick Start

```typescript
import { NCBIClient } from "ncbi-toolkit";

const client = new NCBIClient({
  apiKey: "your-api-key", // optional but recommended
});

// Search for articles
const searchResult = await client.search({
  db: "pubmed",
  term: "cancer AND therapy",
  retmax: 10,
});

console.log(`Found ${searchResult.count} articles`);
console.log("First 10 IDs:", searchResult.idlist);

// Fetch detailed records
const fetchResult = await client.fetch({
  db: "pubmed",
  id: searchResult.idlist.slice(0, 5), // First 5 IDs
  rettype: "abstract",
  retmode: "xml",
});

console.log("Fetched data:", fetchResult.data);
```

## API Reference

### NCBIClient

#### Constructor Options

- `baseUrl` (string, optional): Base URL for NCBI E-utilities (default: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils')
- `timeout` (number, optional): Request timeout in milliseconds (default: 30000)
- `apiKey` (string, optional): NCBI API key for increased rate limits

#### Methods

##### search(options: ESearchOptions): Promise<ESearchResult>

Search NCBI databases.

**Options:**

- `db` (string): Database name (e.g., 'pubmed', 'nucleotide', 'protein')
- `term` (string): Search term
- `retmax` (number, optional): Maximum number of results (default: 20)
- `retstart` (number, optional): Starting index (default: 0)
- `sort` (string, optional): Sort order
- `field` (string, optional): Search field
- `datetype` (string, optional): Date type for date range
- `reldate` (number, optional): Relative date in days
- `mindate` (string, optional): Minimum date (YYYY/MM/DD)
- `maxdate` (string, optional): Maximum date (YYYY/MM/DD)

##### fetch(options: EFetchOptions): Promise<EFetchResult>

Fetch records from NCBI databases.

**Options:**

- `db` (string): Database name
- `id` (string | string[]): Record ID(s)
- `rettype` (string, optional): Return type (default: 'xml')
- `retmode` (string, optional): Return mode (default: 'xml')

## Database Names

Common NCBI database names:

- `pubmed`: PubMed citations
- `nucleotide`: Nucleotide sequences
- `protein`: Protein sequences
- `structure`: 3D structures
- `genome`: Genome assemblies
- `sra`: Sequence Read Archive
- `bioproject`: BioProject records
- `biosample`: BioSample records

## Error Handling

The library throws `NCBIError` for API-related errors:

```typescript
import { NCBIError } from "ncbi-toolkit";

try {
  const result = await client.search({ db: "pubmed", term: "test" });
} catch (error) {
  if (error instanceof NCBIError) {
    console.error("NCBI API Error:", error.message);
    console.error("Status Code:", error.statusCode);
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development with watch mode
npm run dev

# Clean build directory
npm run clean
```

## License

MIT
