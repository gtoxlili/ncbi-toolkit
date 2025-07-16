"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NCBIClient = void 0;
const fast_xml_parser_1 = require("fast-xml-parser");
const NCBIError_1 = require("../errors/NCBIError");
class NCBIClient {
    constructor(options = {}) {
        this.baseUrl =
            options.baseUrl || "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
        this.timeout = options.timeout || 30000;
        this.apiKey = options.apiKey;
        this.xmlParser = new fast_xml_parser_1.XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "",
            textNodeName: "text",
        });
    }
    /**
     * Search NCBI database using ESearch
     */
    async search(term, page, limit) {
        const params = new URLSearchParams({
            retmode: "json",
            db: "pubmed",
            term: term,
            retstart: ((page || 0) * (limit || 10)).toString(),
            retmax: (limit || 10).toString(),
        });
        if (this.apiKey)
            params.append("api_key", this.apiKey);
        const url = `${this.baseUrl}/esearch.fcgi?${params.toString()}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "User-Agent": "ncbi-toolkit/1.0.0",
            },
            signal: AbortSignal.timeout(this.timeout),
        });
        if (!response.ok) {
            throw new NCBIError_1.NCBIError(`HTTP ${response.status}: ${response.statusText}`, response.status);
        }
        const data = await response.json();
        const count = parseInt(data.esearchresult.count, 10);
        const ids = data.esearchresult.idlist || [];
        return {
            count: count,
            papers: await this.summaries(ids),
        };
    }
    // summaries
    async summaries(pmids) {
        const params = new URLSearchParams({
            db: "pubmed",
            id: pmids.join(","),
            retmode: "json",
        });
        if (this.apiKey)
            params.append("api_key", this.apiKey);
        const url = `${this.baseUrl}/esummary.fcgi?${params.toString()}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "User-Agent": "ncbi-toolkit/1.0.0",
            },
            signal: AbortSignal.timeout(this.timeout),
        });
        if (!response.ok) {
            throw new NCBIError_1.NCBIError(`HTTP ${response.status}: ${response.statusText}`, response.status);
        }
        const data = await response.json();
        return this.convertSummaries(data.result);
    }
    async summary(pmid) {
        const summaries = await this.summaries([pmid.toString()]);
        if (summaries.length === 0) {
            throw new NCBIError_1.NCBIError(`No summary found for PMID ${pmid}`, 404);
        }
        return summaries[0];
    }
    async neighbor(pmid, type) {
        const params = new URLSearchParams({
            db: "pubmed",
            dbfrom: "pubmed",
            cmd: "neighbor",
            id: pmid.toString(),
            retmode: "json",
        });
        if (this.apiKey)
            params.append("api_key", this.apiKey);
        const url = `${this.baseUrl}/elink.fcgi?${params.toString()}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "User-Agent": "ncbi-toolkit/1.0.0",
            },
            signal: AbortSignal.timeout(this.timeout),
        });
        if (!response.ok) {
            throw new NCBIError_1.NCBIError(`HTTP ${response.status}: ${response.statusText}`, response.status);
        }
        const data = await response.json();
        let ids = [];
        if (type === "cites") {
            ids = data.linksets[0].linksetdbs.find((db) => db.linkname === "pubmed_pubmed_refs")?.links || [];
        }
        else if (type === "citedby") {
            ids = data.linksets[0].linksetdbs.find((db) => db.linkname === "pubmed_pubmed_citedin")?.links || [];
        }
        else if (type === "similar") {
            ids = data.linksets[0].linksetdbs.find((db) => db.linkname === "pubmed_pubmed")?.links || [];
        }
        if (ids.length === 0) {
            return [];
        }
        return await this.summaries(ids);
    }
    async abstract(pmid) {
        const params = new URLSearchParams({
            db: "pubmed",
            id: pmid.toString(),
            retmode: "xml",
        });
        if (this.apiKey)
            params.append("api_key", this.apiKey);
        const url = `${this.baseUrl}/efetch.fcgi?${params.toString()}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "User-Agent": "ncbi-toolkit/1.0.0",
            },
            signal: AbortSignal.timeout(this.timeout),
        });
        if (!response.ok) {
            throw new NCBIError_1.NCBIError(`HTTP ${response.status}: ${response.statusText}`, response.status);
        }
        const xml = this.xmlParser.parse(await response.text());
        return JSON.stringify(xml.PubmedArticleSet.PubmedArticle.MedlineCitation.Article.Abstract.AbstractText) || "";
    }
    // https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?retmode=xml&db=pmc&id=3315798
    async fulltext(pmid) {
        const summary = await this.summary(pmid);
        if (!summary.pmcid) {
            throw new NCBIError_1.NCBIError(`No full text available for PMID ${pmid}`, 404);
        }
        const params = new URLSearchParams({
            db: "pmc",
            id: summary.pmcid,
            retmode: "xml",
        });
        if (this.apiKey)
            params.append("api_key", this.apiKey);
        const url = `${this.baseUrl}/efetch.fcgi?${params.toString()}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "User-Agent": "ncbi-toolkit/1.0.0",
            },
            signal: AbortSignal.timeout(this.timeout),
        });
        if (!response.ok) {
            throw new NCBIError_1.NCBIError(`HTTP ${response.status}: ${response.statusText}`, response.status);
        }
        return await response.text();
    }
    /**
     * 将 NCBI summary 结果转换为 LLM 友好的简化格式
     */
    convertSummaries(result) {
        const papers = [];
        // 遍历结果中的每个论文
        for (const [pmid, data] of Object.entries(result)) {
            if (pmid === "uids")
                continue; // 跳过 uids 字段
            const paperData = data;
            // 提取关键信息
            const simplifiedPaper = {
                pmid: paperData.uid,
                title: paperData.title || "",
                authors: paperData.authors?.map((author) => author.name) || [],
                journal: paperData.source || "",
                pubdate: paperData.pubdate,
                volume: paperData.volume || "",
                issue: paperData.issue || "",
                pages: paperData.pages || "",
                doi: paperData.articleids?.find((aid) => aid.idtype === "doi")?.value || "",
                pmcid: paperData.articleids?.find((aid) => aid.idtype === "pmc")?.value || "",
                pubTypes: paperData.pubtype || [],
                language: paperData.lang || [],
                publicationStatus: paperData.recordstatus || "",
            };
            papers.push(simplifiedPaper);
        }
        return papers;
    }
}
exports.NCBIClient = NCBIClient;
//# sourceMappingURL=NCBIClient.js.map