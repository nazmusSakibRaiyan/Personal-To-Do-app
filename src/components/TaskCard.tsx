import { Task } from '../types'
import { useTodoStore } from '../store/useTodoStore'
import { format, isPast } from 'date-fns'
import {
  Calendar,
  Clock,
  Tag,
  CheckCircle,
  Circle,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import TaskBreakdown from './TaskBreakdown'

interface TaskCardProps {
  task: Task
}

export default function TaskCard({ task }: TaskCardProps) {
  const { updateTask, deleteTask, toggleTaskStatus } = useTodoStore()
  const [showMenu, setShowMenu] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)

  const priorityColors = {
    low: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    medium: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    urgent: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  }

  const statusIcons = {
    pending: Circle,
    'in-progress': Play,
    completed: CheckCircle,
  }

  const StatusIcon = statusIcons[task.status]
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed'

  const handleStatusToggle = () => {
    if (task.status === 'completed') {
      updateTask(task.id, { status: 'pending' })
    } else {
      toggleTaskStatus(task.id)
    }
  }

  return (
    /* eslint-disable-next-line react/forbid-dom-props */
    <div
      className={`task-item relative ${task.color ? `border-l-4` : ''}`}
      style={{ borderLeftColor: task.color }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <button
            onClick={handleStatusToggle}
            className={`mt-1 flex-shrink-0 transition-colors ${
              task.status === 'completed'
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-400 hover:text-primary-600'
            }`}
            aria-label={`Mark task as ${task.status === 'completed' ? 'pending' : 'completed'}`}
          >
            <StatusIcon size={20} />
          </button>
          <div className="flex-1">
            <h3
              className={`font-semibold mb-1 ${
                task.status === 'completed' ? 'line-through text-gray-500' : ''
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Task options"
          >
            <MoreVertical size={16} />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              <button
                onClick={() => {
                  setShowMenu(false)
                  // Open edit modal
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={() => {
                  setShowBreakdown(true)
                  setShowMenu(false)
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-primary-600 dark:text-primary-400"
              >
                <Sparkles size={16} />
                AI Breakdown
              </button>
              <button
                onClick={() => {
                  deleteTask(task.id)
                  setShowMenu(false)
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 rounded-b-lg"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="space-y-2">
        {/* Due Date */}
        {task.dueDate && (
          <div
            className={`flex items-center gap-2 text-sm ${
              isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Calendar size={14} />
            <span>
              {format(new Date(task.dueDate), 'MMM d, yyyy')}
              {isOverdue && ' (Overdue)'}
            </span>
          </div>
        )}

        {/* Priority */}
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
            {task.priority.toUpperCase()}
          </span>
          {task.estimatedTime && (
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
              <Clock size={12} />
              <span>{task.estimatedTime}m</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag size={14} className="text-gray-400" />
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Subtasks */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {task.subtasks.filter((st) => st.completed).length} / {task.subtasks.length} subtasks
            completed
          </div>
        )}
      </div>

      {/* Task Breakdown Modal */}
      {showBreakdown && (
        <TaskBreakdown
          taskId={task.id}
          taskTitle={task.title}
          taskDescription={task.description}
          onClose={() => setShowBreakdown(false)}
        />
      )}
    </div>
  )
}
