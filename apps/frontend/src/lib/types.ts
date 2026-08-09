export interface User {
  id: string
  name: string
  email: string
}

export interface Room {
  id: string
  name: string
  capacity: number
  floor: number
}

export interface Booking {
  id: string
  title: string
  roomId: string
  userId: string
  userName: string
  /** ISO datetime, UTC */
  startTime: string
  /** ISO datetime, UTC */
  endTime: string
}

export type ApiError = { error: string; status: number }
