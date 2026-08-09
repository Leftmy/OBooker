import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

// Minimal hash-based router. Deep-link state (focused room / week) is passed
// through as a query string on the hash so "My Bookings" rows can jump the
// calendar to a specific room and week.
export interface Route {
  path: string
  params: URLSearchParams
}

interface RouterApi {
  route: Route
  navigate: (path: string, params?: Record<string, string>) => void
}

const RouterContext = createContext<RouterApi | null>(null)

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/rooms'
  const [path, query = ''] = raw.split('?')
  return { path: path || '/rooms', params: new URLSearchParams(query) }
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(parseHash)

  useEffect(() => {
    const onChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback((path: string, params?: Record<string, string>) => {
    const qs = params ? new URLSearchParams(params).toString() : ''
    window.location.hash = qs ? `${path}?${qs}` : path
    window.scrollTo(0, 0)
  }, [])

  const value = useMemo(() => ({ route, navigate }), [route, navigate])
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export function useRouter(): RouterApi {
  const ctx = useContext(RouterContext)
  if (!ctx) throw new Error('useRouter must be used within RouterProvider')
  return ctx
}
