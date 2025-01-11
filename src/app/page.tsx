'use client'

import MindMapWorkspace from '@/components/MindMapWorkspace'
import { Sidebar } from '@/components/Sidebar'

export default function Home() {
  return (
    <main className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MindMapWorkspace />
      </div>
    </main>
  )
}
