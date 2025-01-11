import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBUaatdGt-ydS2dkOR3Pqr06vvDH-5jF-Q",
  authDomain: "mindmap-3a07a.firebaseapp.com",
  databaseURL: "https://mindmap-3a07a-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mindmap-3a07a",
  storageBucket: "mindmap-3a07a.firebasestorage.app",
  messagingSenderId: "805614763554",
  appId: "1:805614763554:web:7cb9a2fe631c2dda32947b"
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)
const db = getFirestore(app)
const googleProvider = new GoogleAuthProvider()

export { app, auth, db, googleProvider }
