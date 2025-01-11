import { Timestamp } from 'firebase/firestore';

export interface MindMapNode {
  id: string;
  type: 'root' | 'topic' | 'subtopic' | 'point' | 'subpoint';
  data: {
    label: string;
    description?: string;
    level?: number;
    details?: NodeDetails;
    crossReferences?: CrossReference[];
  };
  position: { x: number; y: number };
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    fontSize?: number;
    width?: number;
    height?: number;
  };
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  type?: 'default' | 'custom' | 'smoothstep' | 'straight' | 'curved';
  animated?: boolean;
  style?: {
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    opacity?: number;
  };
  label?: string;
  data?: {
    relationship?: string;
    strength?: 'strong' | 'moderate' | 'weak';
  };
}

export interface NodeDetails {
  definition?: string;
  examples?: string[];
  citations?: string[];
  keywords?: string[];
  importance?: 'high' | 'medium' | 'low';
  complexity?: 'basic' | 'intermediate' | 'advanced';
}

export interface CrossReference {
  sourceId: string;
  targetId: string;
  targetTopic: string;
  relationship: string;
  strength: 'strong' | 'moderate' | 'weak';
}

export interface GenerationSettings {
  detailLevel: 'normal' | 'detailed' | 'extreme';
  maxTokens: number;
  maxTopics: number;
  maxSubtopics: number;
  maxPoints: number;
  maxSubpoints: number;
  multipleAICalls: boolean;
  includeExamples: boolean;
  includeCitations: boolean;
  includeDefinitions: boolean;
  crossTopicRelations: boolean;
  topicDepth: 'balanced' | 'deep' | 'broad';
  language?: string;
  temperature?: number;
  style?: 'academic' | 'professional' | 'creative';
}

export interface Point {
  title: string;
  description?: string;
  subpoints?: string[];
  keywords?: string[];
  examples?: string[];
  citations?: string[];
  complexity?: 'basic' | 'intermediate' | 'advanced';
}

export interface Subtopic {
  title: string;
  description?: string;
  points: Point[];
  keywords?: string[];
  importance?: 'high' | 'medium' | 'low';
}

export interface Topic {
  title: string;
  description?: string;
  subtopics: Subtopic[];
  keywords?: string[];
  crossReferences?: CrossReference[];
}

export interface DeepseekResponse {
  topics: Topic[];
  metadata?: {
    complexity: 'basic' | 'intermediate' | 'advanced';
    estimatedReadingTime?: number;
    keyTakeaways?: string[];
    suggestedReadings?: string[];
  };
}

export interface MindMapData {
  id: string;
  title: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  prompt: string;
  settings?: GenerationSettings;
  metadata: {
    complexity: 'basic' | 'intermediate' | 'advanced';
    estimatedReadingTime?: number;
    keyTakeaways?: string[];
    suggestedReadings?: string[];
    version: string;
    generationTime: number;
  };
}

export interface MindMapProject {
  id: string;
  title: string;
  description: string;
  mindMapId: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  collaborators?: string[];
  tags?: string[];
}
