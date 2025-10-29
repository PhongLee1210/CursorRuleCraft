import type { RuleType } from '@cursorrulecraft/shared-types';

export interface RuleGenerationIntent {
  hasIntent: boolean;
  confidence: number;
  techStack: string[];
  ruleType: RuleType | null;
  specificity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}

// Tech stack keywords mapping
const TECH_STACK_KEYWORDS: Record<string, string[]> = {
  javascript: ['js', 'javascript', 'node', 'nodejs', 'npm', 'yarn', 'webpack'],
  typescript: ['ts', 'typescript', 'tsc', 'tsconfig'],
  react: ['react', 'jsx', 'tsx', 'nextjs', 'next.js', 'vite', 'create-react-app'],
  vue: ['vue', 'vue.js', 'nuxt', 'nuxtjs', 'vue-router'],
  angular: ['angular', 'ng', 'angular-cli'],
  python: ['python', 'py', 'django', 'flask', 'fastapi', 'pip'],
  java: ['java', 'spring', 'maven', 'gradle', 'jvm'],
  'c#': ['csharp', 'dotnet', 'asp.net', 'entity framework', '.net'],
  go: ['go', 'golang'],
  rust: ['rust', 'cargo'],
  php: ['php', 'laravel', 'symfony', 'composer'],
  ruby: ['ruby', 'rails', 'gem'],
  database: ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'prisma', 'mongoose'],
  devops: ['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'terraform', 'ci/cd', 'jenkins'],
  mobile: ['react native', 'flutter', 'ionic', 'cordova', 'expo'],
  testing: ['jest', 'mocha', 'cypress', 'testing-library', 'vitest'],
};

// Intent detection keywords
const INTENT_KEYWORDS = {
  generate: ['generate', 'create', 'make', 'build', 'setup', 'configure'],
  rules: ['cursor rule', 'rule', 'cursor rules', 'rules', 'cursor-rules'],
  help: ['help me with', 'i need', 'i want', 'assist with', 'guide for'],
  bestPractices: ['best practices', 'conventions', 'standards', 'guidelines'],
  structure: ['structure', 'organization', 'folder structure', 'file structure'],
};

// Rule type indicators
const RULE_TYPE_INDICATORS = {
  PROJECT_RULE: [
    'project',
    'code style',
    'component',
    'structure',
    'organization',
    'naming',
    'imports',
  ],
  COMMAND: ['command', 'cli', 'script', 'build', 'run', 'deploy', 'automation'],
  USER_RULE: ['personal', 'preference', 'workflow', 'editor', 'settings', 'my way'],
};

/**
 * Detects tech stack from message content
 */
function detectTechStack(message: string): string[] {
  const lowerMessage = message.toLowerCase();
  const detectedTech: string[] = [];

  for (const [tech, keywords] of Object.entries(TECH_STACK_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        if (!detectedTech.includes(tech)) {
          detectedTech.push(tech);
        }
        break; // Found a match for this tech, move to next
      }
    }
  }

  return detectedTech;
}

/**
 * Determines rule type based on message content
 */
function detectRuleType(message: string): RuleType | null {
  const lowerMessage = message.toLowerCase();

  // Check for COMMAND indicators
  for (const indicator of RULE_TYPE_INDICATORS.COMMAND) {
    if (lowerMessage.includes(indicator)) {
      return 'COMMAND';
    }
  }

  // Check for USER_RULE indicators
  for (const indicator of RULE_TYPE_INDICATORS.USER_RULE) {
    if (lowerMessage.includes(indicator)) {
      return 'USER_RULE';
    }
  }

  // Default to PROJECT_RULE for rule-related content
  for (const keyword of INTENT_KEYWORDS.rules) {
    if (lowerMessage.includes(keyword)) {
      return 'PROJECT_RULE';
    }
  }

  return null;
}

/**
 * Calculates specificity level
 */
function calculateSpecificity(
  message: string,
  techStack: string[],
  ruleType: RuleType | null
): 'HIGH' | 'MEDIUM' | 'LOW' {
  const lowerMessage = message.toLowerCase();
  let specificityScore = 0;

  // Tech stack mentioned = +1
  if (techStack.length > 0) {
    specificityScore += 1;
  }

  // Specific rule type mentioned = +1
  if (ruleType !== null) {
    specificityScore += 1;
  }

  // Specific keywords like "naming", "structure", etc. = +1
  const specificTerms = ['naming', 'structure', 'component', 'folder', 'file', 'import', 'export'];
  for (const term of specificTerms) {
    if (lowerMessage.includes(term)) {
      specificityScore += 1;
      break;
    }
  }

  if (specificityScore >= 2) return 'HIGH';
  if (specificityScore >= 1) return 'MEDIUM';
  return 'LOW';
}

/**
 * Generates a description for the detected intent
 */
function generateDescription(
  hasIntent: boolean,
  techStack: string[],
  ruleType: RuleType | null
): string {
  if (!hasIntent) {
    return 'General conversation';
  }

  const techStr = techStack.length > 0 ? techStack.join(', ') : 'general development';
  const ruleTypeStr = ruleType ? ruleType.toLowerCase().replace('_', ' ') : 'project';

  return `Generate ${ruleTypeStr} cursor rules for ${techStr}`;
}

/**
 * Classifies user intent for rule generation
 */
export function classifyRuleIntent(message: string): RuleGenerationIntent {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return {
      hasIntent: false,
      confidence: 0,
      techStack: [],
      ruleType: null,
      specificity: 'LOW',
      description: 'Empty or invalid message',
    };
  }

  const lowerMessage = message.toLowerCase();
  let intentScore = 0;
  let maxConfidence = 0;

  // Check for intent keywords
  const hasGenerateKeywords = INTENT_KEYWORDS.generate.some((keyword) =>
    lowerMessage.includes(keyword)
  );
  const hasRuleKeywords = INTENT_KEYWORDS.rules.some((keyword) => lowerMessage.includes(keyword));
  const hasHelpKeywords = INTENT_KEYWORDS.help.some((keyword) => lowerMessage.includes(keyword));
  const hasBestPracticeKeywords = INTENT_KEYWORDS.bestPractices.some((keyword) =>
    lowerMessage.includes(keyword)
  );

  // Calculate intent score
  if (hasGenerateKeywords && hasRuleKeywords) {
    intentScore += 3; // Strong indicator
    maxConfidence = 0.95;
  } else if (hasGenerateKeywords || hasRuleKeywords) {
    intentScore += 2; // Medium indicator
    maxConfidence = 0.8;
  } else if (hasHelpKeywords && hasBestPracticeKeywords) {
    intentScore += 2; // Help with best practices
    maxConfidence = 0.75;
  } else if (hasHelpKeywords || hasBestPracticeKeywords) {
    intentScore += 1; // Weak indicator
    maxConfidence = 0.6;
  }

  // Detect tech stack
  const techStack = detectTechStack(message);

  // Detect rule type
  const ruleType = detectRuleType(message);

  // Calculate specificity
  const specificity = calculateSpecificity(message, techStack, ruleType);

  // Generate description
  const description = generateDescription(intentScore > 0, techStack, ruleType);

  // Calculate final confidence based on specificity
  let confidence = maxConfidence;
  if (specificity === 'LOW') {
    confidence *= 0.7; // Reduce confidence for low specificity
  } else if (specificity === 'MEDIUM') {
    confidence *= 0.85; // Slight reduction for medium specificity
  }

  // Ensure minimum confidence threshold
  const hasIntent = intentScore > 0 && confidence > 0.5;

  return {
    hasIntent,
    confidence: hasIntent ? confidence : 0,
    techStack,
    ruleType,
    specificity,
    description,
  };
}
