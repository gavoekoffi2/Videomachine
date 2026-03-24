import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './lib/store'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardLayout from './components/layout/DashboardLayout'
import DashboardHome from './pages/DashboardHome'
import YouTubePage from './pages/YouTubePage'
import TwitterPage from './pages/TwitterPage'
import AffiliatePage from './pages/AffiliatePage'
import TikTokPage from './pages/TikTokPage'
import SocialPage from './pages/SocialPage'
import SettingsPage from './pages/SettingsPage'
import PricingPage from './pages/PricingPage'
import ProfilePage from './pages/ProfilePage'

const Private = ({ c }: { c: React.ReactNode }) => {
  const isAuth = useAuthStore(s => s.isAuth)
  return isAuth ? <>{c}</> : <Navigate to="/login" replace />
}
const Public = ({ c }: { c: React.ReactNode }) => {
  const isAuth = useAuthStore(s => s.isAuth)
  return !isAuth ? <>{c}</> : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Public c={<LoginPage />} />} />
      <Route path="/register" element={<Public c={<RegisterPage />} />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/dashboard" element={<Private c={<DashboardLayout />} />}>
        <Route index element={<DashboardHome />} />
        <Route path="youtube" element={<YouTubePage />} />
        <Route path="twitter" element={<TwitterPage />} />
        <Route path="affiliate" element={<AffiliatePage />} />
        <Route path="tiktok" element={<TikTokPage />} />
        <Route path="social" element={<SocialPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="pricing" element={<PricingPage isDashboard />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
