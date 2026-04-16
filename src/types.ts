export type GuidanceLevel = 'minimal' | 'guided' | 'highly-guided';

export interface PromptDetails {
  subject: string;
  action: string;
  setting: string;
  style: string;
  lighting: string;
  composition: string;
  mood: string;
  colorPalette: string;
}

export interface AppStyle {
  id: string;
  name: string;
  description: string;
  referenceImage?: string;
  details?: Partial<PromptDetails>;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  prompt?: string;
  structuredPrompt?: PromptDetails;
  timestamp: number;
}

export interface AppState {
  messages: Message[];
  currentStyle: AppStyle | null;
  savedStyles: AppStyle[];
  guidanceLevel: GuidanceLevel;
  isGenerating: boolean;
  isRefining: boolean;
}
