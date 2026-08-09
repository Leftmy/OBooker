import axios from 'axios'
import { realApi } from './realApi'
import type { ApiClient } from './types'

export const api: ApiClient = realApi

export function isAxiosError(err: unknown): err is axios.AxiosError {
  return axios.isAxiosError(err)
}

export function axiosErrorMessage(err: axios.AxiosError): string {
  const payload = err.response?.data

  if (typeof payload === 'object' && payload !== null) {
    const message = (payload as { error?: string; message?: string }).error
      ?? (payload as { error?: string; message?: string }).message

    if (message) return message
  }

  return err.message
}

export function errorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    return axiosErrorMessage(err)
  }

  if (err instanceof Error) return err.message

  return 'Something went wrong. Please try again.'
}

export type { ApiClient }
export const DEMO_CREDENTIALS = { email: 'yuri@obooker.io', password: 'password123' }
