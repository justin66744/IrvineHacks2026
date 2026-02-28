import { Routes, Route, NavLink } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Listings from './pages/Listings'
import Alerts from './pages/Alerts'
import Assistance from './pages/Assistance'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/assistance" element={<Assistance />} />
      </Routes>
    </Layout>
  )
}
