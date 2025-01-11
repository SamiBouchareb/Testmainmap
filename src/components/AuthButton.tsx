'use client'

import { FC, useState } from 'react'
import { UserIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'

export const AuthButton: FC = () => {
  const { user, signInWithGoogle, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleAuth = async () => {
    try {
      setIsLoading(true)
      if (user) {
        await logout()
      } else {
        await signInWithGoogle()
      }
    } catch (error) {
      console.error('Authentication error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {user && (
        <div className="text-sm text-gray-600 text-center">
          {user.email}
        </div>
      )}
      <button
        className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white ${
          user ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'
        } rounded-lg transition-colors duration-200 shadow-sm disabled:opacity-50`}
        onClick={handleAuth}
        disabled={isLoading}
      >
        <UserIcon className="w-5 h-5" />
        {isLoading ? 'Loading...' : user ? 'Sign Out' : 'Sign In with Google'}
      </button>
    </div>
  )
}
