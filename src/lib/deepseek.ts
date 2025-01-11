'use client'

import { DeepseekResponse, GenerationSettings, Topic } from '@/types/mindmap';

const DEEPSEEK_API_KEY = 'sk-7349a0d509cf401680bb045036e34ae0';
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

class DeepseekError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DeepseekError';
  }
}

const DEFAULT_SETTINGS: GenerationSettings = {
  detailLevel: 'normal',
  maxTokens: 2500,
  maxTopics: 5,
  maxSubtopics: 4,
  maxPoints: 3,
  maxSubpoints: 2,
  multipleAICalls: false,
  includeExamples: false,
  includeCitations: false,
  includeDefinitions: false,
  crossTopicRelations: false,
  topicDepth: 'balanced',
  temperature: 0.7,
  style: 'professional'
};

function validateResponse(data: any): data is DeepseekResponse {
  if (!data || !Array.isArray(data.topics)) {
    throw new DeepseekError(
      'Invalid response structure',
      'INVALID_RESPONSE',
      { received: data }
    );
  }

  // Validate each topic
  data.topics.forEach((topic: any, index: number) => {
    if (!topic.title || !Array.isArray(topic.subtopics)) {
      throw new DeepseekError(
        `Invalid topic at index ${index}`,
        'INVALID_TOPIC',
        { topic }
      );
    }

    // Validate subtopics
    topic.subtopics.forEach((subtopic: any, subIndex: number) => {
      if (!subtopic.title || !Array.isArray(subtopic.points)) {
        throw new DeepseekError(
          `Invalid subtopic at topic ${index}, subtopic ${subIndex}`,
          'INVALID_SUBTOPIC',
          { subtopic }
        );
      }

      // Validate points
      subtopic.points.forEach((point: any, pointIndex: number) => {
        if (!point.title) {
          throw new DeepseekError(
            `Invalid point at topic ${index}, subtopic ${subIndex}, point ${pointIndex}`,
            'INVALID_POINT',
            { point }
          );
        }
      });
    });
  });

  return true;
}

function constructSystemPrompt(settings: GenerationSettings): string {
  const topicRange = settings.topicDepth === 'broad' 
    ? '5-8' 
    : settings.topicDepth === 'deep' 
      ? '3-4' 
      : '4-6';

  const subtopicRange = settings.topicDepth === 'broad'
    ? '2-3'
    : settings.topicDepth === 'deep'
      ? '4-6'
      : '3-4';

  const styleGuidelines = settings.style === 'academic'
    ? 'Use formal language and include citations where relevant.'
    : settings.style === 'professional'
      ? 'Use clear, business-oriented language with practical examples.'
      : 'Use engaging, creative language with innovative connections.';

  return `You are a mind map generation expert. Create a ${settings.detailLevel} hierarchical structure for the following topic.
  Return ONLY a valid JSON object with the following structure, and nothing else:
  {
    "topics": [
      {
        "title": "Main Topic Area",
        "description": "Comprehensive overview of this main topic area",
        "keywords": ["key1", "key2"],
        "subtopics": [
          {
            "title": "Key Subtopic",
            "description": "Detailed explanation of this subtopic",
            "importance": "high|medium|low",
            "keywords": ["key1", "key2"],
            "points": [
              {
                "title": "Important Point",
                "description": "Specific detail or example",
                "complexity": "basic|intermediate|advanced",
                "keywords": ["key1", "key2"],
                "examples": ["Example 1", "Example 2"],
                "citations": ["Citation 1", "Citation 2"],
                "subpoints": [
                  "Additional detail 1",
                  "Additional detail 2"
                ]
              }
            ]
          }
        ],
        "crossReferences": [
          {
            "targetTopic": "Other Topic Title",
            "relationship": "Description of relationship",
            "strength": "strong|moderate|weak"
          }
        ]
      }
    ],
    "metadata": {
      "complexity": "basic|intermediate|advanced",
      "estimatedReadingTime": 30,
      "keyTakeaways": ["Key point 1", "Key point 2"],
      "suggestedReadings": ["Resource 1", "Resource 2"]
    }
  }
  
  Important Guidelines:
  1. Create ${topicRange} main topics that cover different aspects
  2. Each main topic should have ${subtopicRange} subtopics
  3. Each subtopic should have ${settings.maxPoints} key points
  4. Points can have 0-${settings.maxSubpoints} subpoints for extra detail
  5. ${styleGuidelines}
  6. Ensure logical flow and connections between levels
  7. ${settings.includeExamples ? 'Include specific examples and case studies' : 'Keep examples minimal'}
  8. ${settings.includeCitations ? 'Include relevant citations and references' : 'Citations are optional'}
  9. ${settings.includeDefinitions ? 'Include detailed definitions and explanations' : 'Keep definitions concise'}
  10. ${settings.crossTopicRelations ? 'Create meaningful cross-references between related topics' : 'Cross-references are optional'}
  11. Return ONLY the JSON object, no other text
  12. Ensure the JSON is properly formatted`;
}

export async function generateMindMapContent(
  prompt: string,
  settings: Partial<GenerationSettings> = {}
): Promise<DeepseekResponse> {
  const mergedSettings: GenerationSettings = {
    ...DEFAULT_SETTINGS,
    ...settings
  };

  const systemPrompt = constructSystemPrompt(mergedSettings);

  try {
    console.log('Sending request to Deepseek API...');
    const startTime = performance.now();

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: mergedSettings.temperature,
        max_tokens: mergedSettings.maxTokens,
        top_p: 0.95,
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
      throw new DeepseekError(
        errorData.error?.message || 'Failed to generate mind map content',
        'API_ERROR',
        errorData
      );
    }

    const data = await response.json();
    console.log('API Response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new DeepseekError(
        'Invalid API response format',
        'INVALID_RESPONSE_FORMAT',
        data
      );
    }

    let content = data.choices[0].message.content;
    console.log('Raw content:', content);

    // Clean up the content if it contains markdown or extra text
    if (content.includes('```json')) {
      content = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      content = content.split('```')[1].split('```')[0].trim();
    }

    console.log('Cleaned content:', content);

    try {
      const parsedContent = JSON.parse(content) as DeepseekResponse;
      console.log('Parsed content:', parsedContent);

      // Validate the response structure
      validateResponse(parsedContent);

      // Add generation time to metadata
      if (!parsedContent.metadata) {
        parsedContent.metadata = {
          complexity: 'intermediate',
          estimatedReadingTime: 0,
          keyTakeaways: [],
          suggestedReadings: []
        };
      }

      return parsedContent;
    } catch (error) {
      if (error instanceof DeepseekError) {
        throw error;
      }
      console.error('Failed to parse mind map content:', error);
      throw new DeepseekError(
        'Failed to parse mind map content',
        'PARSE_ERROR',
        error
      );
    }
  } catch (error) {
    if (error instanceof DeepseekError) {
      throw error;
    }
    console.error('Failed to generate mind map:', error);
    throw new DeepseekError(
      'Failed to generate mind map',
      'GENERATION_ERROR',
      error
    );
  }
}
