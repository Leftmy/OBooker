import type { Booking, Room, User } from '../lib/types'

export interface CursorPaginatedResponse<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export interface DateRangeBookingsRequest {
  roomId?: string
  startDate: string
  endDate: string
}

export interface ApiClient {
  register(name: string, email: string, password: string): Promise<User>
  login(email: string, password: string): Promise<User>
  logout(): Promise<void>
  me(): Promise<User>
  listRooms(): Promise<Room[]>
  listBookings(params: DateRangeBookingsRequest): Promise<Booking[]>
  myBookings(params: { type?: 'upcoming' | 'past'; cursor?: string; limit?: number }): Promise<CursorPaginatedResponse<Booking>>
  createBooking(input: {
    title: string
    roomId: string
    startTime: string
    endTime: string
  }): Promise<Booking>
  cancelBooking(id: string): Promise<void>
}
