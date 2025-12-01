import { Task, SubTask } from '../types'
import { useTodoStore } from '../store/useTodoStore'
import { useState } from 'react'
import { X, Plus, Trash2, Calendar, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface TaskEditModalProps {
  task: Task
  onClose: () => void
}

export default function TaskEditModal({ task, onClose }: TaskEditModalProps) {
  const { updateTask } = useTodoStore()

  // Form state
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [dueDate, setDueDate] = useState(task.dueDate || '')
  const [reminderTime, setReminderTime] = useState(task.reminderTime || '')
  const [priority, setPriority] = useState<Task['priority']>(task.priority)
  const [status, setStatus] = useState<Task['status']>(task.status)
  const [tags, setTags] = useState<string[]>(task.tags)
  const [category, setCategory] = useState(task.category || '')
  const [estimatedTime, setEstimatedTime] = useState(task.estimatedTime?.toString() || '')
  const [subtasks, setSubtasks] = useState<SubTask[]>(task.subtasks)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) {
      toast.error('Subtask title cannot be empty')
      return
    }

    const newSubtask: SubTask = {
      id: `subtask-${Date.now()}`,
      title: newSubtaskTitle,
      completed: false,
      createdAt: new Date().toISOString(),
    }

    setSubtasks([...subtasks, newSubtask])
    setNewSubtaskTitle('')
    toast.success('Subtask added')
  }

  const handleDeleteSubtask = (subtaskId: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== subtaskId))
    toast.success('Subtask deleted')
  }

  const handleToggleSubtask = (subtaskId: string) => {
    setSubtasks(
      subtasks.map((st) =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      )
    )
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const newTag = (e.currentTarget.value || '').trim()
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag])
        e.currentTarget.value = ''
      }
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Task title cannot be empty')
      return
    }

    updateTask(task.id, {
      title,
      description,
      dueDate,
      reminderTime,
      priority,
      status,
      tags,
      category,
      estimatedTime: estimatedTime ? parseInt(estimatedTime) : undefined,
      subtasks,
    })

    toast.success('Task updated successfully')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold">Edit Task</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Task title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Task description"
              rows={4}
            />
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="due-date" className="block text-sm font-medium mb-2">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                Due Date
              </div>
            </label>
            <input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Reminder Time */}
          <div>
            <label htmlFor="reminder-time" className="block text-sm font-medium mb-2">
              <div className="flex items-center gap-2">
                <Clock size={16} />
                Email Reminder Before Due Date (HH:MM format)
              </div>
            </label>
            <input
              id="reminder-time"
              type="text"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., 00:15 for 15 minutes before, 01:00 for 1 hour before"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Leave empty to send reminder at due date/time
            </p>
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium mb-2">Priority</label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-2">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Task['status'])}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Estimated Time */}
          <div>
            <label htmlFor="estimated-time" className="block text-sm font-medium mb-2">
              <div className="flex items-center gap-2">
                <Clock size={16} />
                Estimated Time (minutes)
              </div>
            </label>
            <input
              id="estimated-time"
              type="number"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., 30"
              min="0"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Work, Personal"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <input
              type="text"
              onKeyDown={handleAddTag}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Press Enter to add tag"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-primary-900 dark:hover:text-primary-100"
                    aria-label={`Remove tag ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <label className="block text-sm font-medium mb-3">Subtasks</label>
            <div className="space-y-2 mb-4">
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => handleToggleSubtask(subtask.id)}
                    className="w-4 h-4 rounded cursor-pointer"
                    aria-label={`Toggle subtask ${subtask.title}`}
                  />
                  <span
                    className={`flex-1 ${
                      subtask.completed ? 'line-through text-gray-500' : ''
                    }`}
                  >
                    {subtask.title}
                  </span>
                  <button
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400"
                    aria-label={`Delete subtask ${subtask.title}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Subtask */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddSubtask()
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Add a subtask..."
              />
              <button
                onClick={handleAddSubtask}
                className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2"
                aria-label="Add subtask"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
