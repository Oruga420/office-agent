export const CLAUDE_TRIGGERS: readonly RegExp[] = [
  /\b(code\s*review|review\s*(my|this|the)?\s*code)\b/i,
  /\bdebugg?(ing)?\b/i,
  /\barchitect(ure)?\b/i,
  /\bsecurity\b/i,
  /\banalyz(e|ing)\b/i,
  /\bcompar(e|ing)\b/i,
  /\bdesign\b/i,
  /\bmulti[- ]?step\b/i,
  /\b(write|create|build|implement)\s+(a\s+)?(code|function|class|module|component|script|program)\b/i,
];

export const NEMOTRON_TRIGGERS: readonly RegExp[] = [
  /\bsummariz(e|ing)\b/i,
  /\btranslat(e|ing)\b/i,
  /\b(what|who|when|where)\s+(is|are|was|were|did|does|do)\b/i,
  /\blist\s+(all|the|some|every)?\b/i,
  /\bdefin(e|ition)\b/i,
  /\bformat\b/i,
  /\bconvert\b/i,
  /\bgrammar\b/i,
];

export const COMPLEXITY_CHAR_THRESHOLD = 500;

export const THREAD_DEPTH_THRESHOLD = 5;
