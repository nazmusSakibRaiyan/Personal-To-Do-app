import { useState } from 'react'
import { Plus, Filter, Download, Upload } from 'lucide-react'
import { useTodoStore } from '../store/useTodoStore'
import TaskCard from '../components/TaskCard'
import TaskFilters from '../components/TaskFilters'
import QuickAdd from '../components/QuickAdd'
import { FilterOptions } from '../types'

export default function Tasks() {
  const { tasks } = useTodoStore()
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({})
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt'>('dueDate')

  // Apply filters
  const filteredTasks = tasks.filter((task) => {
    if (filters.status && !filters.status.includes(task.status)) return false
    if (filters.priority && !filters.priority.includes(task.priority)) return false
    if (filters.tags && !filters.tags.some((tag) => task.tags.includes(tag))) return false
    if (filters.categories && !filters.categories.includes(task.category || '')) return false
    if (filters.searchQuery && !task.title.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false
    return true
  })

  // Apply sorting
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'dueDate') {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }
    if (sortBy === 'priority') {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const handleExport = () => {
    const dataStr = JSON.stringify(tasks, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tasks-${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">All Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="btn btn-secondary flex items-center gap-2">
            <Download size={20} />
            Export
          </button>
          <button className="btn btn-secondary flex items-center gap-2">
            <Upload size={20} />
            Import
          </button>
          <button
            onClick={() => setShowQuickAdd(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            New Task
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
        >
          <Filter size={20} />
          Filters
        </button>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="input max-w-xs"
          aria-label="Sort tasks by"
        >
          <option value="dueDate">Sort by Due Date</option>
          <option value="priority">Sort by Priority</option>
          <option value="createdAt">Sort by Created Date</option>
        </select>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6">
          <TaskFilters filters={filters} onChange={setFilters} />
        </div>
      )}

      {/* Tasks Grid */}
      {sortedTasks.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold mb-2">No tasks found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {filters.searchQuery || filters.status || filters.priority
              ? 'Try adjusting your filters'
              : 'Create your first task to get started'}
          </p>
          <button
            onClick={() => setShowQuickAdd(true)}
            className="btn btn-primary"
          >
            Create Task
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAdd onClose={() => setShowQuickAdd(false)} />
      )}
    </div>
  )
}
