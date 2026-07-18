import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
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
  const [authed, setAuthed] = useState(
    () => localStorage.getItem('dogcare-authed') === '1',
  )

  useEffect(() => {
    const fade = setTimeout(() => setSplash('fading'), 1600)
    const gone = setTimeout(() => setSplash('gone'), 2200)
    return () => {
      clearTimeout(fade)
      clearTimeout(gone)
    }
  }, [])

  if (!authed) {
    return (
      <>
        {splash !== 'gone' && <SplashScreen fading={splash === 'fading'} />}
        <AuthPage onAuth={() => setAuthed(true)} />
      </>
    )
  }

  return (
    <BrowserRouter>
      {splash !== 'gone' && <SplashScreen fading={splash === 'fading'} />}
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
