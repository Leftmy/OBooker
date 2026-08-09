import { useState } from 'react'
import { Modal } from './ui'

export type SortField = 'name' | 'floor' | 'capacity'
export type SortOrder = 'asc' | 'desc'

export interface RoomFilterState {
  floor: string
  minCapacity: number
  search: string
  sortBy: SortField
  sortOrder: SortOrder
}

interface FilterModalProps {
  open: boolean
  floors: number[]
  filters: RoomFilterState
  onClose: () => void
  onApply: (filters: RoomFilterState) => void
  onReset: () => void
}

export function FilterModal({
  open,
  floors,
  filters,
  onClose,
  onApply,
  onReset,
}: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<RoomFilterState>(filters)

  if (!open) return null

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault()
    onApply(localFilters)
    onClose()
  }

  const handleReset = () => {
    const initial: RoomFilterState = {
      floor: 'all',
      minCapacity: 0,
      search: '',
      sortBy: 'name',
      sortOrder: 'asc',
    }
    setLocalFilters(initial)
    onReset()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Filter Rooms">
      <form onSubmit={handleApply} className="space-y-6 px-2 py-3">
        {/* Search by Name */}
        <div>
          <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase">
            Search by Name
          </label>
          <input
            type="text"
            placeholder="e.g. Boardroom"
            value={localFilters.search}
            onChange={(e) =>
              setLocalFilters({ ...localFilters, search: e.target.value })
            }
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Floor */}
        <div>
          <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase">
            Floor
          </label>
          <select
            value={localFilters.floor}
            onChange={(e) =>
              setLocalFilters({ ...localFilters, floor: e.target.value })
            }
            className="mt-2 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Floors</option>
            {floors.map((f) => (
              <option key={f} value={f.toString()}>
                Floor {f}
              </option>
            ))}
          </select>
        </div>

        {/* Min Capacity */}
        <div>
          <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase">
            Min Capacity:{' '}
            {localFilters.minCapacity > 0
              ? `${localFilters.minCapacity} people`
              : 'ANY'}
          </label>
          <input
            type="range"
            min="0"
            max="20"
            step="1"
            value={localFilters.minCapacity}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                minCapacity: Number(e.target.value),
              })
            }
            className="mt-3 w-full accent-indigo-600"
          />
        </div>

        {/* Sorting Options */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase">
              Sort By
            </label>
            <select
              value={localFilters.sortBy}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  sortBy: e.target.value as SortField,
                })
              }
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition focus:border-indigo-500 focus:outline-none"
            >
              <option value="name">Name</option>
              <option value="floor">Floor</option>
              <option value="capacity">Capacity</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase">
              Order
            </label>
            <select
              value={localFilters.sortOrder}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  sortOrder: e.target.value as SortOrder,
                })
              }
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition focus:border-indigo-500 focus:outline-none"
            >
              <option value="asc">Ascending (A-Z, 1-9)</option>
              <option value="desc">Descending (Z-A, 9-1)</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between pt-6">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Reset
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-500"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}