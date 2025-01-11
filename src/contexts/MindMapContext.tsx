'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
  MindMapData, 
  MindMapNode, 
  MindMapEdge,
  Topic,
  Subtopic,
  Point,
  DeepseekResponse,
  GenerationSettings,
  CrossReference,
  NodeDetails
} from '@/types/mindmap';
import { generateMindMapContent } from '@/lib/deepseek';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { generateNodePosition } from '@/lib/layout';
import { extractTextFromPDF, mergePDFContentWithPrompt } from '@/lib/pdfUtils';

interface MindMapContextType {
  currentMindMap: MindMapData | null;
  isLoading: boolean;
  error: string | null;
  generateMindMap: (prompt: string, pdfFile?: File, settings?: Partial<GenerationSettings>) => Promise<void>;
  saveMindMap: () => Promise<void>;
  clearMindMap: () => void;
  loadSavedMap: (map: MindMapData) => void;
}

const MindMapContext = createContext<MindMapContextType | undefined>(undefined);

export function MindMapProvider({ children }: { children: ReactNode }) {
  const [currentMindMap, setCurrentMindMap] = useState<MindMapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setCurrentMindMap(null);
      setError(null);
    }
  }, [user]);

  const generateMindMap = async (
    prompt: string, 
    pdfFile?: File,
    settings?: Partial<GenerationSettings>
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let finalPrompt = prompt;
      
      if (pdfFile) {
        try {
          const pdfText = await extractTextFromPDF(pdfFile);
          finalPrompt = await mergePDFContentWithPrompt(pdfText, prompt);
        } catch (error) {
          console.error('Error processing PDF:', error);
          setError('Failed to process PDF file. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      const startTime = performance.now();
      const mindMapData = await generateMindMapContent(finalPrompt, settings);
      const generationTime = performance.now() - startTime;

      const defaultMetadata = {
        complexity: 'intermediate' as const,
        estimatedReadingTime: 0,
        keyTakeaways: [],
        suggestedReadings: [],
        version: '2.0',
        generationTime
      };

      const nodes: MindMapNode[] = [];
      const edges: MindMapEdge[] = [];
      
      // Add root node
      const rootId = 'root';
      nodes.push({
        id: rootId,
        type: 'root',
        position: { x: 0, y: 0 },
        data: { 
          label: finalPrompt,
          description: 'Root topic'
        },
        style: {
          backgroundColor: '#4F46E5',
          borderColor: '#4338CA',
          fontSize: 16
        }
      });

      // Process topics
      mindMapData.topics.forEach((topic: Topic, topicIndex: number) => {
        const topicId = `topic-${topicIndex}`;
        
        // Add topic node
        nodes.push({
          id: topicId,
          type: 'topic',
          position: generateNodePosition(1, topicIndex, mindMapData.topics.length),
          data: {
            label: topic.title,
            description: topic.description || '',
            details: {
              keywords: topic.keywords,
              examples: [],
              citations: [],
              importance: 'high'
            }
          },
          style: {
            backgroundColor: '#3B82F6',
            borderColor: '#2563EB',
            fontSize: 14
          }
        });

        // Connect to root
        edges.push({
          id: `edge-root-${topicId}`,
          source: rootId,
          target: topicId,
          type: 'default',
          style: {
            stroke: '#6366F1',
            strokeWidth: 2
          }
        });

        // Process subtopics
        topic.subtopics.forEach((subtopic: Subtopic, subtopicIndex: number) => {
          const subtopicId = `subtopic-${topicIndex}-${subtopicIndex}`;
          
          nodes.push({
            id: subtopicId,
            type: 'subtopic',
            position: generateNodePosition(2, subtopicIndex, topic.subtopics.length),
            data: {
              label: subtopic.title,
              description: subtopic.description || '',
              details: {
                keywords: subtopic.keywords,
                importance: subtopic.importance || 'medium',
                examples: [],
                citations: []
              }
            },
            style: {
              backgroundColor: '#60A5FA',
              borderColor: '#3B82F6',
              fontSize: 12
            }
          });

          edges.push({
            id: `edge-${topicId}-${subtopicId}`,
            source: topicId,
            target: subtopicId,
            type: 'default',
            style: {
              stroke: '#60A5FA',
              strokeWidth: 1.5
            }
          });

          // Process points
          subtopic.points.forEach((point: Point, pointIndex: number) => {
            const pointId = `point-${topicIndex}-${subtopicIndex}-${pointIndex}`;
            
            nodes.push({
              id: pointId,
              type: 'point',
              position: generateNodePosition(3, pointIndex, subtopic.points.length),
              data: {
                label: point.title,
                description: point.description || '',
                details: {
                  keywords: point.keywords,
                  examples: point.examples || [],
                  citations: point.citations || [],
                  complexity: point.complexity || 'basic'
                }
              },
              style: {
                backgroundColor: '#93C5FD',
                borderColor: '#60A5FA',
                fontSize: 11
              }
            });

            edges.push({
              id: `edge-${subtopicId}-${pointId}`,
              source: subtopicId,
              target: pointId,
              type: 'default',
              style: {
                stroke: '#93C5FD',
                strokeWidth: 1
              }
            });

            // Add subpoints
            if (point.subpoints) {
              point.subpoints.forEach((subpoint: string, subpointIndex: number) => {
                const subpointId = `subpoint-${topicIndex}-${subtopicIndex}-${pointIndex}-${subpointIndex}`;
                
                nodes.push({
                  id: subpointId,
                  type: 'subpoint',
                  position: generateNodePosition(4, subpointIndex, point.subpoints?.length || 0),
                  data: {
                    label: subpoint,
                    description: ''
                  },
                  style: {
                    backgroundColor: '#BFDBFE',
                    borderColor: '#93C5FD',
                    fontSize: 10
                  }
                });

                edges.push({
                  id: `edge-${pointId}-${subpointId}`,
                  source: pointId,
                  target: subpointId,
                  type: 'default',
                  style: {
                    stroke: '#BFDBFE',
                    strokeWidth: 1
                  }
                });
              });
            }
          });
        });
      });

      // Add cross-topic relations if enabled
      if (settings?.crossTopicRelations && mindMapData.topics.some(t => t.crossReferences)) {
        mindMapData.topics.forEach((topic: Topic, topicIndex: number) => {
          if (topic.crossReferences) {
            topic.crossReferences.forEach((ref: CrossReference) => {
              const targetTopic = mindMapData.topics.findIndex(t => t.title === ref.targetTopic);
              if (targetTopic !== -1) {
                edges.push({
                  id: `cross-edge-${topicIndex}-${targetTopic}`,
                  source: `topic-${topicIndex}`,
                  target: `topic-${targetTopic}`,
                  type: 'smoothstep',
                  animated: true,
                  label: ref.relationship,
                  style: {
                    stroke: '#94A3B8',
                    strokeDasharray: '5 5',
                    opacity: 0.6
                  },
                  data: {
                    relationship: ref.relationship,
                    strength: ref.strength
                  }
                });
              }
            });
          }
        });
      }

      const newMindMap: MindMapData = {
        id: Date.now().toString(),
        title: prompt,
        nodes,
        edges,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user?.uid || '',
        prompt,
        settings: settings as GenerationSettings,
        metadata: {
          ...defaultMetadata,
          ...mindMapData.metadata
        }
      };

      setCurrentMindMap(newMindMap);
    } catch (error) {
      console.error('Error in generateMindMap:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate mind map. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveMindMap = async () => {
    if (!currentMindMap || !user) {
      setError('No mind map to save or user not logged in');
      return;
    }

    try {
      const mindMapRef = collection(db, 'mindmaps');
      const mindMapToSave = {
        ...currentMindMap,
        createdAt: currentMindMap.createdAt instanceof Date 
          ? Timestamp.fromDate(currentMindMap.createdAt)
          : currentMindMap.createdAt,
        updatedAt: currentMindMap.updatedAt instanceof Date
          ? Timestamp.fromDate(currentMindMap.updatedAt)
          : currentMindMap.updatedAt
      };
      
      const savedMap = await addDoc(mindMapRef, mindMapToSave);
      console.log('Mind map saved with ID:', savedMap.id);
    } catch (error) {
      console.error('Error saving mind map:', error);
      setError('Failed to save mind map');
    }
  };

  const clearMindMap = () => {
    setCurrentMindMap(null);
    setError(null);
  };

  const loadSavedMap = (map: MindMapData) => {
    setCurrentMindMap(map);
  };

  return (
    <MindMapContext.Provider value={{
      currentMindMap,
      isLoading,
      error,
      generateMindMap,
      saveMindMap,
      clearMindMap,
      loadSavedMap
    }}>
      {children}
    </MindMapContext.Provider>
  );
}

export function useMindMap() {
  const context = useContext(MindMapContext);
  if (context === undefined) {
    throw new Error('useMindMap must be used within a MindMapProvider');
  }
  return context;
}
