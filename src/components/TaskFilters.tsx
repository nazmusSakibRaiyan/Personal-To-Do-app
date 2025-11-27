import { FilterOptions } from '../types'
import { useTodoStore } from '../store/useTodoStore'
import { X } from 'lucide-react'

interface TaskFiltersProps {
  filters: FilterOptions
  onChange: (filters: FilterOptions) => void
}

export default function TaskFilters({ filters, onChange }: TaskFiltersProps) {
  // Get all unique tags from tasks
  const allTags = Array.from(
    new Set(useTodoStore.getState().tasks.flatMap((t) => t.tags))
  )

  const toggleStatus = (status: 'pending' | 'in-progress' | 'completed') => {
    const currentStatuses = filters.status || []
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status]
    onChange({ ...filters, status: newStatuses.length > 0 ? newStatuses : undefined })
  }

  const togglePriority = (priority: 'low' | 'medium' | 'high' | 'urgent') => {
    const currentPriorities = filters.priority || []
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter((p) => p !== priority)
      : [...currentPriorities, priority]
    onChange({ ...filters, priority: newPriorities.length > 0 ? newPriorities : undefined })
  }

  const toggleTag = (tag: string) => {
    const currentTags = filters.tags || []
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag]
    onChange({ ...filters, tags: newTags.length > 0 ? newTags : undefined })
  }

  const clearFilters = () => {
    onChange({})
  }

  const hasActiveFilters = !!(filters.status || filters.priority || filters.tags || filters.categories)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <X size={16} />
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Status Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Status</label>
          <div className="flex flex-wrap gap-2">
            {(['pending', 'in-progress', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  filters.status?.includes(status)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {status.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Priority</label>
          <div className="flex flex-wrap gap-2">
            {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => (
              <button
                key={priority}
                onClick={() => togglePriority(priority)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  filters.priority?.includes(priority)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <div>
            <label className="text-sm font-medium mb-2 block">Tags</label>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    filters.tags?.includes(tag)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
