import { GoogleGenAI, Type } from "@google/genai";

// --- Types ---

export interface MetricBreakdown {
  label: string;
  score: number;
  maxScore: number;
}

export interface MetricDetail {
  score: number;
  reasoning: string;
  relevantFiles: string[];
  breakdown: MetricBreakdown[];
}

export interface ComplianceItem {
  item: string;
  status: "Pass" | "Fail";
}

export interface Contributor {
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

export interface RepoAnalysis {
  score: number;
  medal: "Gold" | "Silver" | "Bronze" | "Iron";
  metrics: {
    readme: MetricDetail;
    quality: MetricDetail;
    history: MetricDetail;
    structure: MetricDetail;
    tests: MetricDetail;
  };
  checklist: ComplianceItem[];
  summary: string;
  techStack: string[];
  roadmap: Array<{
    title: string;
    description: string;
    priority: "High" | "Medium" | "Low";
  }>;
}

export interface RepoMetadata {
  name: string;
  description: string;
  owner: { login: string; avatar_url: string };
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
  language: string;
  html_url: string;
  default_branch: string;
  homepage: string | null;
}

export interface FileNode {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

// --- API Helpers ---

export const parseGithubUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return { owner: parts[0], repo: parts[1] };
    }
  } catch (e) {
    return null;
  }
  return null;
};

export const fetchFileContent = async (owner: string, repo: string, path: string) => {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
    if (!res.ok) throw new Error("Failed to fetch file");
    const data = await res.json();
    if (Array.isArray(data)) return "Cannot display directory content directly.";
    if (!data.content) return "File content not available.";
    // Handle newlines in base64
    return atob(data.content.replace(/\s/g, ''));
  } catch (e) {
    return "Error reading file content.";
  }
};

export const fetchGithubData = async (owner: string, repo: string) => {
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
  
  try {
    // 1. Fetch Metadata
    const metaRes = await fetch(baseUrl);
    if (!metaRes.ok) throw new Error("Repository not found or private.");
    const metadata: RepoMetadata = await metaRes.json();

    // 2. Fetch README
    const readmeRes = await fetch(`${baseUrl}/readme`);
    let readmeContent = "";
    if (readmeRes.ok) {
      const readmeData = await readmeRes.json();
      readmeContent = atob(readmeData.content.replace(/\s/g, ''));
    }

    // 3. Fetch Recursive Tree (limited to 1MB response usually, good for visualization)
    const treeRes = await fetch(`${baseUrl}/git/trees/${metadata.default_branch}?recursive=1`);
    let fileTree: FileNode[] = [];
    if (treeRes.ok) {
        const treeData = await treeRes.json();
        fileTree = treeData.tree || [];
    }

    // 4. Fetch Recent Commits
    const commitsRes = await fetch(`${baseUrl}/commits?per_page=10`);
    let recentCommits = [];
    if (commitsRes.ok) {
        recentCommits = await commitsRes.json();
    }

    // 5. Fetch Contributors
    const contribRes = await fetch(`${baseUrl}/contributors?per_page=10`);
    let contributors: Contributor[] = [];
    if (contribRes.ok) {
        contributors = await contribRes.json();
    }

    return { metadata, fileTree, readmeContent, recentCommits, contributors };
  } catch (error) {
    throw error;
  }
};

export const analyzeWithGemini = async (
  metadata: any,
  fileTree: FileNode[],
  readme: string,
  commits: any[]
): Promise<RepoAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Filter tree to top 300 files
  const simplifiedTree = fileTree
    .filter(f => f.type === 'blob')
    .slice(0, 300)
    .map(f => f.path)
    .join('\n');

  const commitSummary = commits.map((c: any) => 
    `- ${c.commit.author.date.split('T')[0]}: ${c.commit.message.split('\n')[0]}`
  ).join('\n');
  
  const prompt = `
    You are a Senior Software Architect. Analyze this GitHub repository.
    
    **Metadata:**
    - Name: ${metadata.name}
    - Lang: ${metadata.language}
    - Stars: ${metadata.stargazers_count}
    - Last Update: ${metadata.updated_at}

    **Recent Commits:**
    ${commitSummary}

    **File Structure (Partial View):**
    ${simplifiedTree}

    **README (Truncated):**
    ${readme.slice(0, 5000)}

    **Task:**
    Evaluate the repository.

    **SCORING RULES (CRITICAL):**
    - **ALL scores must be strictly on a scale of 0 to 100.**
    - 0 is the worst, 100 is the best.
    - Do NOT use a scale of 1-10. If the quality is an 8/10, output 80.
    - The 'overall score' and all 'metric scores' must be 0-100.
    - Breakdowns maxScore should typically be 100 or the sum of items should equal the metric score.

    **Specific Evaluation Criteria for Metrics:**
    1. **Readme**: Allocate points specifically for "Setup Instructions" and "Software Requirements".
    2. **Code Quality**: Allocate points specifically for "Comments/Documentation" and "Readability/Naming".
    3. **History**: Commit frequency and message clarity.
    4. **Structure**: Logical organization.
    5. **Tests**: Coverage and CI.

    **Standardized Checklist:**
    Verify the existence of: License, Readme, Contribution Guidelines, Test Suite, CI Configuration.

    **Output:** JSON only.
  `;

  const breakdownSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        label: { type: Type.STRING },
        score: { type: Type.NUMBER },
        maxScore: { type: Type.NUMBER }
      },
      required: ["label", "score", "maxScore"]
    }
  };

  const metricSchema = {
    type: Type.OBJECT, 
    properties: { 
      score: { type: Type.NUMBER }, 
      reasoning: { type: Type.STRING }, 
      relevantFiles: { type: Type.ARRAY, items: { type: Type.STRING } },
      breakdown: breakdownSchema
    },
    required: ["score", "reasoning", "relevantFiles", "breakdown"]
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          medal: { type: Type.STRING, enum: ["Gold", "Silver", "Bronze", "Iron"] },
          metrics: {
            type: Type.OBJECT,
            properties: {
              readme: metricSchema,
              quality: metricSchema,
              history: metricSchema,
              structure: metricSchema,
              tests: metricSchema,
            },
            required: ["readme", "quality", "history", "structure", "tests"]
          },
          checklist: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                item: { type: Type.STRING },
                status: { type: Type.STRING, enum: ["Pass", "Fail"] }
              },
              required: ["item", "status"]
            }
          },
          summary: { type: Type.STRING },
          techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
          roadmap: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
              },
              required: ["title", "description", "priority"]
            }
          }
        },
        required: ["score", "medal", "metrics", "checklist", "summary", "techStack", "roadmap"]
      }
    }
  });

  if (response.text) {
    const json = JSON.parse(response.text);
    // Defensive defaults
    const defaultMetric = { score: 0, reasoning: "No data", relevantFiles: [], breakdown: [] };
    if (!json.metrics) json.metrics = {};
    ['readme', 'quality', 'history', 'structure', 'tests'].forEach(k => {
        if (!json.metrics[k]) json.metrics[k] = defaultMetric;
        if (!json.metrics[k].relevantFiles) json.metrics[k].relevantFiles = [];
        if (!json.metrics[k].breakdown) json.metrics[k].breakdown = [];
        
        // --- DATA SANITIZATION ---
        // Force score to be 0-100 if the model hallucinates a small number
        // Heuristic: If score is <= 10 and reasoning suggests it's good, multiply by 10.
        // However, it's safer to rely on the prompt instructions first.
        // If the model returns 8/100, we display 8/100.
        // The fix above in the prompt should resolve the issue of scale ambiguity.
    });
    if (!json.checklist) json.checklist = [];
    return json;
  }
  throw new Error("Failed to generate analysis.");
};