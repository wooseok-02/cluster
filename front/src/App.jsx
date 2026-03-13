// 라우팅 + 로그인 여부에 따른 자동 리다이렉트
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import PeoplePage from './pages/PeoplePage'
import PersonRegisterPage from './pages/PersonRegisterPage'
import PersonDetailPage from './pages/PersonDetailPage'
import MapPage from './pages/MapPage'
import PlaceRegisterPage from './pages/PlaceRegisterPage'
import PlaceDetailPage from './pages/PlaceDetailPage'
import CalendarPage from './pages/CalendarPage'
import ScheduleCreatePage from './pages/ScheduleCreatePage'
import ScheduleDetailPage from './pages/ScheduleDetailPage'
import PhotoUploadPage from './pages/PhotoUploadPage'

// 로그인 상태면 /people로, 아니면 그대로 페이지 보여줌 (로그인/회원가입 페이지용)
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/people" replace /> : children
}

// 비로그인 상태면 /로, 아니면 그대로 페이지 보여줌 (로그인 필요한 페이지용)
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/home" element={<PrivateRoute><Navigate to="/people" replace /></PrivateRoute>} />
      <Route path="/people" element={<PrivateRoute><PeoplePage /></PrivateRoute>} />
      <Route path="/people/register" element={<PrivateRoute><PersonRegisterPage /></PrivateRoute>} />
      <Route path="/people/:id" element={<PrivateRoute><PersonDetailPage /></PrivateRoute>} />
      <Route path="/map" element={<PrivateRoute><MapPage /></PrivateRoute>} />
      <Route path="/place/register" element={<PrivateRoute><PlaceRegisterPage /></PrivateRoute>} />
      <Route path="/place/:id" element={<PrivateRoute><PlaceDetailPage /></PrivateRoute>} />
      <Route path="/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
      <Route path="/schedule/create" element={<PrivateRoute><ScheduleCreatePage /></PrivateRoute>} />
      <Route path="/schedule/:id" element={<PrivateRoute><ScheduleDetailPage /></PrivateRoute>} />
      <Route path="/photo/upload" element={<PrivateRoute><PhotoUploadPage /></PrivateRoute>} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
