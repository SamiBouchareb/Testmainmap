'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
      setInitialized(true)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true)
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error('Error signing in with email:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true)
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error('Error signing up with email:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Don't render anything until the initial auth state is loaded
  if (!initialized) {
    return null
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
