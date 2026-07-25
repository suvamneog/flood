import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import EmergencySOS from '../EmergencySOS'
import BackToTop from '../ui/BackToTop'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <EmergencySOS />
      <BackToTop />
    </div>
  )
}
