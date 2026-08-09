import axios from 'axios'
import type { Booking, Room, User } from '../lib/types'
import type { ApiClient, CursorPaginatedResponse } from './types'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
  withCredentials: true,
})

function unwrap<T>(data: T): T {
  return data
}

export const realApi: ApiClient = {
  async register(name, email, password) {
    const { data } = await http.post<User>('/auth/register', { name, email, password })
    return unwrap(data)
  },

  async login(email, password) {
    const { data } = await http.post<User>('/auth/login', { email, password })
    return unwrap(data)
  },

  async logout() {
    await http.post('/auth/logout')
  },

  async me() {
    const { data } = await http.get<User>('/auth/me')
    return unwrap(data)
  },

  async listRooms() {
    const { data } = await http.get<Room[]>('/rooms')
    return unwrap(data)
  },

  async listBookings(params) {
    const { data } = await http.get<Booking[]>('/bookings', { params })
    return unwrap(data)
  },

  async myBookings(params) {
    const { data } = await http.get<CursorPaginatedResponse<Booking>>('/bookings/my', {
      params,
    })
    return unwrap(data)
  },

  async createBooking(input) {
    const { data } = await http.post<Booking>('/bookings', input)
    return unwrap(data)
  },

  async cancelBooking(id) {
    await http.delete(`/bookings/${id}`)
  },
}
