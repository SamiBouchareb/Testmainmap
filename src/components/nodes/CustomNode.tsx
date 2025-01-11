'use client'

import { FC, memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

const getNodeStyle = (type: string) => {
  switch (type) {
    case 'root':
      return 'bg-gradient-to-br from-blue-500 to-blue-600 text-white min-w-[160px] max-w-[220px] shadow-lg border-2 border-blue-400'
    case 'topic':
      return 'bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 min-w-[140px] max-w-[200px] hover:border-purple-400'
    case 'subtopic':
      return 'bg-gradient-to-br from-green-50 to-green-100 border border-green-300 min-w-[120px] max-w-[180px] hover:border-green-400'
    case 'point':
      return 'bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-300 min-w-[100px] max-w-[160px] hover:border-yellow-400'
    case 'subpoint':
      return 'bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 min-w-[80px] max-w-[140px] hover:border-orange-300'
    default:
      return 'bg-gray-50 border border-gray-300'
  }
}

const getHandleStyle = (type: string) => {
  switch (type) {
    case 'root':
      return '!bg-blue-300 !w-3 !h-3'
    case 'topic':
      return '!bg-purple-300 !w-2.5 !h-2.5'
    case 'subtopic':
      return '!bg-green-300 !w-2 !h-2'
    case 'point':
      return '!bg-yellow-300 !w-1.5 !h-1.5'
    case 'subpoint':
      return '!bg-orange-200 !w-1 !h-1'
    default:
      return '!bg-gray-300'
  }
}

const getLabelStyle = (type: string) => {
  switch (type) {
    case 'root':
      return 'text-white text-lg font-semibold'
    case 'topic':
      return 'text-gray-800 text-base font-medium'
    case 'subtopic':
      return 'text-gray-700 text-sm font-medium'
    case 'point':
      return 'text-gray-600 text-sm'
    case 'subpoint':
      return 'text-gray-500 text-xs'
    default:
      return 'text-gray-600'
  }
}

const getDescriptionStyle = (type: string) => {
  switch (type) {
    case 'root':
      return 'text-blue-100 text-sm'
    case 'topic':
      return 'text-gray-600 text-sm'
    case 'subtopic':
      return 'text-gray-500 text-xs'
    case 'point':
      return 'text-gray-500 text-xs'
    default:
      return 'text-gray-400 text-xs'
  }
}

const CustomNode: FC<NodeProps> = ({ data, type }) => {
  const nodeStyle = getNodeStyle(type)
  const handleStyle = getHandleStyle(type)
  const labelStyle = getLabelStyle(type)
  const descriptionStyle = getDescriptionStyle(type)
  
  return (
    <div 
      className={`
        px-3 py-2 rounded-lg transition-all duration-200
        hover:shadow-lg hover:-translate-y-0.5
        ${nodeStyle}
      `}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className={`${handleStyle} !rounded-full`}
      />
      
      <div className={`text-center ${labelStyle}`}>
        {data.label}
      </div>
      
      {data.description && (
        <div className={`mt-1 text-center ${descriptionStyle}`}>
          {data.description}
        </div>
      )}
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className={`${handleStyle} !rounded-full`}
      />
    </div>
  )
}

export default memo(CustomNode)
