import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TodayPage from './pages/TodayPage'
import DogListPage from './pages/DogListPage'
import DogProfilePage from './pages/DogProfilePage'
import AddEditDogPage from './pages/AddEditDogPage'
import StartStayPage from './pages/StartStayPage'
import TaskPreviewPage from './pages/TaskPreviewPage'
import CalendarPage from './pages/CalendarPage'
import SyncSettingsPage from './pages/SyncSettingsPage'

export default function App() {
  return (
    <BrowserRouter>
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
