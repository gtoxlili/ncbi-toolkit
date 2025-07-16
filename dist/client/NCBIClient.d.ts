export declare class NCBIClient {
    private readonly baseUrl;
    private readonly timeout;
    private readonly apiKey?;
    private xmlParser;
    constructor(options?: Options);
    /**
     * Search NCBI database using ESearch
     */
    search(term: string, page?: number, limit?: number): Promise<{
        count: number;
        papers: Array<Paper>;
    }>;
    summaries(pmids: string[]): Promise<Paper[]>;
    summary(pmid: number): Promise<Paper>;
    neighbor(pmid: number, type: "cites" | "citedby" | "similar"): Promise<Paper[]>;
    abstract(pmid: number): Promise<string>;
    fulltext(pmid: number): Promise<string>;
    /**
     * 将 NCBI summary 结果转换为 LLM 友好的简化格式
     */
    private convertSummaries;
}
//# sourceMappingURL=NCBIClient.d.ts.map