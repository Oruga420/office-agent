export type ModelChoice = "nemotron" | "claude";

export interface RouteDecision {
  readonly model: ModelChoice;
  readonly reason: string;
  readonly confidence: number;
}

export interface RouterInput {
  readonly text: string;
  readonly forceModel?: ModelChoice;
  readonly threadDepth?: number;
}
