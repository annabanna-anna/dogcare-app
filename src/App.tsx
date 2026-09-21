import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { isAppHost, isMarketingHost } from './lib/host'
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

/** Routes that render for signed-out visitors: the marketing home and the
 *  privacy policy. Both must be reachable without an account — Google's
 *  OAuth verification review reads them, and a reviewer who lands on a login
 *  wall has nothing to review. `/about` is a legacy alias for `/` (heypup.app
 *  now hosts the marketing page at the root, with the product on web.heypup.app). */
const PUBLIC_PATHS = isAppHost ? ['/privacy'] : ['/', '/about', '/privacy']

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
  const location = useLocation()
  const { pathname } = location
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

  // The marketing host has no app: send any /app deep link (old bookmarks,
  // home-screen shortcuts) to the app host.
  if (isMarketingHost && pathname.startsWith('/app')) {
    window.location.replace(`https://web.heypup.app${pathname.replace(/^\/app/, '') || '/'}${window.location.search}${window.location.hash}`)
    return null
  }

  // Legacy: the app used to live under /app (old bookmarks, home-screen icons).
  if (pathname === '/app' || pathname.startsWith('/app/')) {
    return <Navigate to={pathname.replace(/^\/app/, '') || '/'} replace />
  }

  if (pathname === '/about') {
    return <Navigate to="/" replace />
  }

  // Public pages render without waiting on the session check — a signed-out
  // visitor sees the marketing home or privacy policy immediately. A signed-in
  // visitor who lands on "/" (e.g. a bookmark from before heypup.app existed)
  // is bounced into the app once we know they have a session. A password-reset
  // link also lands at "/" (Supabase redirects to the site origin), so that
  // still has to route to UpdatePasswordPage rather than the marketing page.
  if (isPublicRoute) {
    const isAuthed = session !== 'loading' && session !== null
    let homeElement
    if (passwordRecovery) {
      homeElement = (
        <UpdatePasswordPage
          onDone={() => {
            setPasswordRecovery(false)
            navigate('/today', { replace: true })
          }}
        />
      )
    } else if (session === 'loading') {
      homeElement = null
    } else if (isAuthed) {
      homeElement = <Navigate to="/today" replace />
    } else {
      homeElement = <AboutPage />
    }
    return (
      <Routes>
        <Route path="/" element={homeElement} />
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
            navigate('/today', { replace: true })
          }}
        />
      </>
    )
  }

  // Signed-out visitors get their own /login route; the page they were
  // trying to reach rides along in router state so we can return them to it.
  if (!session) {
    return (
      <>
        {splashOverlay}
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route
            path="*"
            element={
              <Navigate
                to="/login"
                replace
                state={{ from: pathname + window.location.search }}
              />
            }
          />
        </Routes>
      </>
    )
  }

  const loginState = location.state as { from?: string } | null
  const afterLogin = loginState?.from && loginState.from !== '/login' ? loginState.from : '/today'

  return (
    <>
      {splashOverlay}
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="today" element={<TodayPage />} />
          <Route path="dogs" element={<DogListPage />} />
          <Route path="dogs/:id" element={<DogProfilePage />} />
          <Route path="stays/new" element={<StartStayPage />} />
          <Route path="stays/:stayId/edit" element={<StartStayPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="settings" element={<SyncSettingsPage />} />
        </Route>
        <Route path="/login" element={<Navigate to={afterLogin} replace />} />
        <Route path="/dogs/new" element={<AddEditDogPage />} />
        <Route path="/dogs/:id/edit" element={<AddEditDogPage />} />
        <Route path="/stays/preview" element={<TaskPreviewPage />} />
        <Route path="*" element={<Navigate to="/today" replace />} />
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
