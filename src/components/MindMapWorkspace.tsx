'use client'

import { FC, useState, useEffect, useCallback } from 'react'
import ReactFlow, { 
  Background, 
  Controls,
  MiniMap,
  Node,
  Edge,
  ConnectionMode,
  Panel,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  MarkerType
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useMindMap } from '@/contexts/MindMapContext';
import { GenerationSettings } from '@/types/mindmap';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '@/contexts/AuthContext';
import CustomNode from './nodes/CustomNode'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'

const nodeTypes = {
  root: CustomNode,
  topic: CustomNode,
  subtopic: CustomNode,
  point: CustomNode,
  subpoint: CustomNode,
};

const edgeOptions = {
  style: { strokeWidth: 1.5 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: '#94A3B8',
  },
};

const connectionLineStyle = {
  strokeWidth: 1.5,
  stroke: '#94A3B8',
};

const MindMapWorkspace = () => {
  const { currentMindMap, isLoading, error, generateMindMap, saveMindMap } = useMindMap();
  const { user, loading: authLoading } = useAuth()
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [mapTitle, setMapTitle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [advancedSettings, setAdvancedSettings] = useState<GenerationSettings>({
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
  })
  
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    if (currentMindMap) {
      setNodes(currentMindMap.nodes)
      setEdges(currentMindMap.edges)
    }
  }, [currentMindMap, setNodes, setEdges])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check if file is PDF
    if (file.type !== 'application/pdf') {
      return;
    }
    
    // Store the file for later use
    setSelectedFile(file);
  };

  const handleGenerateClick = async () => {
    if (!prompt) return;
    await generateMindMap(prompt, selectedFile || undefined, advancedSettings);
  };

  const handleSave = async () => {
    if (!mapTitle.trim()) {
      setShowSaveModal(true);
      return;
    }
    await saveMindMap();
  };

  const handleSettingsChange = (field: keyof GenerationSettings, value: any) => {
    setAdvancedSettings(prev => {
      let validatedValue = value;
      
      // Validate and coerce values based on field type
      switch (field) {
        case 'detailLevel':
          validatedValue = (['normal', 'detailed', 'extreme'] as const).includes(value as any) 
            ? value 
            : 'normal';
          break;
        case 'topicDepth':
          validatedValue = (['balanced', 'deep', 'broad'] as const).includes(value as any)
            ? value
            : 'balanced';
          break;
        case 'style':
          validatedValue = (['academic', 'professional', 'creative'] as const).includes(value as any)
            ? value
            : 'professional';
          break;
        case 'maxTokens':
        case 'maxTopics':
        case 'maxSubtopics':
        case 'maxPoints':
        case 'maxSubpoints':
          validatedValue = Math.max(1, Math.min(Number(value), 100));
          break;
        case 'temperature':
          validatedValue = Math.max(0, Math.min(Number(value), 1));
          break;
      }

      return {
        ...prev,
        [field]: validatedValue
      };
    });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col relative bg-gray-50">
      {/* Floating Prompt Section */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-[500px]">
        <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-blue-100 p-3 
                      animate-float transition-all duration-300 hover:shadow-blue-200/50
                      hover:border-blue-200 group">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt..."
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-300 
                         focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-300"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                  title="Advanced Settings"
                >
                  <Cog6ToothIcon className="w-5 h-5 text-gray-500" />
                </button>
                <label 
                  htmlFor="pdfUpload"
                  className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                  title="Upload PDF Document"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </label>
              </div>
              <input
                id="pdfUpload"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <button
              onClick={handleGenerateClick}
              disabled={isLoading || (!prompt.trim() && !selectedFile)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300
                ${isLoading 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'}`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating...</span>
                </div>
              ) : (
                'Generate'
              )}
            </button>
          </div>
          {selectedFile && (
            <div className="mt-2 px-4 py-2 bg-blue-50 rounded-lg text-sm text-blue-600 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l4.122 4.12A1.5 1.5 0 0117 7.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 16.5v-13z" />
              </svg>
              <span>Document uploaded: {selectedFile.name}</span>
              <button 
                onClick={() => {
                  setSelectedFile(null);
                  const fileInput = document.getElementById('pdfUpload') as HTMLInputElement;
                  if (fileInput) fileInput.value = '';
                }}
                className="ml-auto hover:text-blue-700"
                title="Remove document"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          )}
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 
                        animate-slideDown">
            {error}
            <button
              onClick={() => { }}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Mind Map Area */}
      <div className="flex-1 relative">
        {currentMindMap ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={edgeOptions}
            connectionLineStyle={connectionLineStyle}
            connectionMode={ConnectionMode.Loose}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={1.5}
            className="bg-gray-50"
          >
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={12} 
              size={1} 
              color="#E2E8F0"
            />
            <Controls 
              className="bg-white shadow-lg border border-gray-200 rounded-lg" 
              showInteractive={false}
            />
            <MiniMap 
              className="bg-white shadow-lg border border-gray-200 rounded-lg !w-48 !h-48"
              maskColor="rgba(241, 245, 249, 0.7)"
              nodeColor={(node) => {
                switch (node.type) {
                  case 'root': return '#3B82F6'
                  case 'topic': return '#A855F7'
                  case 'subtopic': return '#22C55E'
                  case 'point': return '#EAB308'
                  case 'subpoint': return '#F97316'
                  default: return '#94A3B8'
                }
              }}
            />
            
            {/* Save Button */}
            {user && currentMindMap && (
              <Panel position="top-right" className="mr-12 mt-4">
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg 
                           shadow-lg border border-blue-100 hover:bg-blue-50 transition-colors
                           font-medium text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                       strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" 
                          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                  Save Mind Map
                </button>
              </Panel>
            )}
          </ReactFlow>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p>Generating your mind map...</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-lg font-medium text-gray-600">Welcome to Mind Map AI</p>
                <p className="mt-2 text-gray-500">Enter a prompt and generate a mind map to get started</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Save Mind Map</h2>
            <input
              type="text"
              placeholder="Enter a title for your mind map"
              className="w-full p-2 border border-gray-300 rounded mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={mapTitle}
              onChange={(e) => setMapTitle(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                onClick={() => {
                  setShowSaveModal(false)
                  setMapTitle('')
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                onClick={handleSave}
                disabled={!mapTitle.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Settings Modal */}
      <Transition appear show={showSettingsModal} as={Fragment}>
        <Dialog 
          as="div" 
          className="relative z-10" 
          onClose={() => setShowSettingsModal(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Advanced Mind Map Settings
                  </Dialog.Title>
                  
                  <div className="mt-4 space-y-4">
                    {/* Detail Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Detail Level
                      </label>
                      <select
                        value={advancedSettings.detailLevel}
                        onChange={(e) => handleSettingsChange('detailLevel', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="normal">Normal</option>
                        <option value="detailed">Detailed</option>
                        <option value="extreme">Extreme</option>
                      </select>
                    </div>

                    {/* Topic Depth */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Topic Organization
                      </label>
                      <select
                        value={advancedSettings.topicDepth}
                        onChange={(e) => handleSettingsChange('topicDepth', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="balanced">Balanced</option>
                        <option value="deep">Deep</option>
                        <option value="broad">Broad</option>
                      </select>
                    </div>

                    {/* ... other settings inputs ... */}
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                      onClick={() => setShowSettingsModal(false)}
                    >
                      Done
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}

export default MindMapWorkspace;
