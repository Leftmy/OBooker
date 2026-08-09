import { useState, type FormEvent } from 'react'
import { useAuth } from '../lib/auth'
import { DEMO_CREDENTIALS, errorMessage } from '../lib/api'
import { AlertBanner, Button, Field, TextInput } from './ui'

type Mode = 'login' | 'register'

interface Errors {
  name?: string
  email?: string
  password?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AuthScreen() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const switchMode = (next: Mode) => {
    setMode(next)
    setErrors({})
    setServerError('')
  }

  const validate = (): boolean => {
    const next: Errors = {}
    if (mode === 'register' && name.trim().length < 2) {
      next.name = 'Please enter your full name.'
    }
    if (!EMAIL_RE.test(email)) next.email = 'Enter a valid email address.'
    if (password.length < 8 || password.length > 72) {
      next.password = 'Password must be 8-72 characters.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError('')
    if (!validate()) return
    setSubmitting(true)
    try {
      if (mode === 'login') await login(email.trim(), password)
      else await register(name.trim(), email.trim(), password)
    } catch (err) {
      setServerError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
      {/* Swiss ground: a single hairline grid, one indigo wash in the corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(#e8e9ee 1px, transparent 1px), linear-gradient(90deg, #e8e9ee 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(circle at 50% 40%, #000, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 40%, #000, transparent 78%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 size-[32rem] rounded-full bg-indigo-200/40 blur-3xl"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
              <path d="M3.5 9.5h17M8 3v4M16 3v4" strokeLinecap="round" />
              <circle cx="12" cy="14.5" r="1.6" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {mode === 'login'
              ? 'Sign in to book meeting rooms at the office.'
              : 'Start booking rooms in seconds — no credit card needed.'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/[0.04] sm:p-8">
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`rounded-lg py-2 text-sm font-semibold transition ${
                  mode === m
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {serverError && (
            <div className="mb-5">
              <AlertBanner message={serverError} />
            </div>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            {mode === 'register' && (
              <Field label="Name" htmlFor="name" error={errors.name}>
                <TextInput
                  id="name"
                  autoComplete="name"
                  placeholder="Yuri Ivanenko"
                  value={name}
                  invalid={!!errors.name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
            )}

            <Field label="Email address" htmlFor="email" error={errors.email}>
              <TextInput
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                invalid={!!errors.email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field
              label="Password"
              htmlFor="password"
              error={errors.password}
              hint="8-72 characters"
            >
              <TextInput
                id="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                value={password}
                invalid={!!errors.password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            <Button type="submit" loading={submitting} className="mt-1 w-full">
              {submitting
                ? mode === 'login'
                  ? 'Signing in…'
                  : 'Creating account…'
                : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
            </Button>
          </form>

          
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            className="font-semibold text-indigo-600 transition hover:text-indigo-500"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
