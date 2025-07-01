export interface StandupGenerationRequest {
  githubActivity?: any;
  asanaActivity?: any;
  jiraActivity?: any;
  preferences: {
    tone: string;
    length: string;
    customPrompt?: string;
    sprintGoal?: string;
  };
  date: Date;
}

export interface StandupGenerationResponse {
  content: string;
  metadata: {
    model: string;
    tokensUsed: number;
    cost: number;
    generatedAt: string;
  };
}

export interface PromptTemplate {
  system: string;
  user: string;
}