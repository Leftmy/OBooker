import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useRouter } from '../lib/router'
import { Avatar } from './ui'

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
        <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
          <path d="M3.5 9.5h17M8 3v4M16 3v4" strokeLinecap="round" />
          <circle cx="12" cy="14.5" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-slate-900">
        OBooker
      </span>
    </div>
  )
}

export function NavBar() {
  const { user, logout } = useAuth()
  const { route, navigate } = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const link = (path: string, label: string) => {
    const active = route.path === path
    return (
      <button
        onClick={() => navigate(path)}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
          active
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-4 sm:px-6">
        <button onClick={() => navigate('/rooms')} className="outline-none">
          <Logo />
        </button>

        <nav className="ml-2 hidden items-center gap-1 sm:flex">
          {link('/rooms', 'Calendar')}
          {link('/my-bookings', 'My Bookings')}
        </nav>

        <div className="relative ml-auto">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2.5 transition hover:bg-slate-100"
          >
            <Avatar name={user?.name ?? '?'} className="size-8" />
            <span className="hidden text-sm font-semibold text-slate-700 sm:block">
              {user?.name}
            </span>
            <svg viewBox="0 0 20 20" className="size-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                </div>
                <div className="my-1 h-px bg-slate-100" />
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('/my-bookings')
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:hidden"
                >
                  My Bookings
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    logout()
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-rose-50 hover:text-rose-700"
                >
                  <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.7}>
                    <path d="M13 4h3a1 1 0 011 1v10a1 1 0 01-1 1h-3M9 14l-4-4 4-4M5 10h9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
