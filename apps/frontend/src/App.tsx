import { AuthProvider, useAuth } from './lib/auth'
import { RouterProvider, useRouter } from './lib/router'
import { ToastProvider } from './lib/toast'
import { AuthScreen } from './components/AuthScreen'
import { CalendarView } from './components/CalendarView'
import { MyBookings } from './components/MyBookings'
import { NavBar } from './components/NavBar'

function AppShell() {
  const { user, loading } = useAuth()
  const { route } = useRouter()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <span className="obk-spin size-9 rounded-full border-[3px] border-slate-200 border-t-indigo-500" />
      </div>
    )
  }

  if (!user) return <AuthScreen />

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main>{route.path === '/my-bookings' ? <MyBookings /> : <CalendarView />}</main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <ToastProvider>
          <AppShell />
        </ToastProvider>
      </RouterProvider>
    </AuthProvider>
  )
}
