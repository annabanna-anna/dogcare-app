import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import {
  captureGoogleConnectionIfRequested,
  syncGoogleConnectionState,
} from './lib/googleCalendar'
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
import AboutPage from './pages/AboutPage'
import PrivacyPage from './pages/PrivacyPage'
import SplashScreen from './components/SplashScreen'
import BottomNav from './components/BottomNav'

/** Routes that render for signed-out visitors: the marketing page and the
 *  privacy policy. Both must be reachable without an account — Google's
 *  OAuth verification review reads them, and a reviewer who lands on a login
 *  wall has nothing to review. */
const PUBLIC_PATHS = ['/about', '/privacy']

export default function App() {
  // The router has to sit above the auth gate now, so the public routes can
  // be matched before any session check happens.
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

function AppRoutes() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isPublicRoute = PUBLIC_PATHS.includes(pathname)

  const [splash, setSplash] = useState<'visible' | 'fading' | 'gone'>('visible')
  const [session, setSession] = useState<Session | null | 'loading'>('loading')
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  useEffect(() => {
    // The splash is the app's "fetching your day" moment; a visitor reading
    // the marketing page shouldn't sit through it.
    if (isPublicRoute) {
      setSplash('gone')
      return
    }
    const fade = setTimeout(() => setSplash('fading'), 1600)
    const gone = setTimeout(() => setSplash('gone'), 2200)
    return () => {
      clearTimeout(fade)
      clearTimeout(gone)
    }
  }, [isPublicRoute])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      // Reconcile the Google connection flag with what's stored server-side,
      // so a user who connected on another device (or cleared site data
      // here) isn't asked to redo OAuth.
      if (data.session) void syncGoogleConnectionState()
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
      setSession(newSession)
      // Deferred out of the callback: Supabase serializes auth events, and
      // awaiting a Supabase call (this one invokes an Edge Function) from
      // inside the handler can deadlock the client.
      setTimeout(() => {
        void captureGoogleConnectionIfRequested(
          newSession?.provider_token,
          newSession?.provider_refresh_token,
        ).catch(() => {})
      }, 0)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Public pages render regardless of auth state, and without waiting on the
  // session check — signed in or out, /about and /privacy look the same.
  if (isPublicRoute) {
    return (
      <Routes>
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Routes>
    )
  }

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
        <UpdatePasswordPage
          onDone={() => {
            setPasswordRecovery(false)
            navigate('/', { replace: true })
          }}
        />
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
    <>
      {splashOverlay}
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<TodayPage />} />
          <Route path="/dogs" element={<DogListPage />} />
          <Route path="/dogs/:id" element={<DogProfilePage />} />
          <Route path="/stays/new" element={<StartStayPage />} />
          <Route path="/stays/:stayId/edit" element={<StartStayPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/settings" element={<SyncSettingsPage />} />
        </Route>
        <Route path="/dogs/new" element={<AddEditDogPage />} />
        <Route path="/dogs/:id/edit" element={<AddEditDogPage />} />
        <Route path="/stays/preview" element={<TaskPreviewPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

/** Wraps the routes that share the bottom tab bar, keeping BottomNav
 *  mounted across navigations within this set so its active-tab pill
 *  can animate between positions instead of remounting each time. */
function AppLayout() {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  )
}
