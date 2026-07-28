import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import AuthPage from './pages/AuthPage'
import UpdatePasswordPage from './pages/UpdatePasswordPage'
import TodayPage from './pages/TodayPage'
import DogListPage from './pages/DogListPage'
import DogProfilePage from './pages/DogProfilePage'
import AddEditDogPage from './pages/AddEditDogPage'
import StartStayPage from './pages/StartStayPage'
import TaskPreviewPage from './pages/TaskPreviewPage'
import CalendarPage from './pages/CalendarPage'
import SyncSettingsPage from './pages/SyncSettingsPage'
import SplashScreen from './components/SplashScreen'

export default function App() {
  const [splash, setSplash] = useState<'visible' | 'fading' | 'gone'>('visible')
  const [session, setSession] = useState<Session | null | 'loading'>('loading')
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  useEffect(() => {
    const fade = setTimeout(() => setSplash('fading'), 1600)
    const gone = setTimeout(() => setSplash('gone'), 2200)
    return () => {
      clearTimeout(fade)
      clearTimeout(gone)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
      setSession(newSession)
    })
    return () => subscription.unsubscribe()
  }, [])

  const splashOverlay = splash !== 'gone' && <SplashScreen fading={splash === 'fading'} />

  // While the initial session check is in flight, show only the splash —
  // avoids a flash of the auth screen for users who are already logged in.
  if (session === 'loading') {
    return splashOverlay
  }

  // A clicked password-reset link lands here with a recovery session — make
  // the user set a new password before letting them into the app.
  if (passwordRecovery) {
    return (
      <>
        {splashOverlay}
        <UpdatePasswordPage onDone={() => setPasswordRecovery(false)} />
      </>
    )
  }

  if (!session) {
    return (
      <>
        {splashOverlay}
        <AuthPage />
      </>
    )
  }

  return (
    <BrowserRouter>
      {splashOverlay}
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/dogs" element={<DogListPage />} />
        <Route path="/dogs/new" element={<AddEditDogPage />} />
        <Route path="/dogs/:id" element={<DogProfilePage />} />
        <Route path="/dogs/:id/edit" element={<AddEditDogPage />} />
        <Route path="/stays/new" element={<StartStayPage />} />
        <Route path="/stays/preview" element={<TaskPreviewPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/settings" element={<SyncSettingsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
