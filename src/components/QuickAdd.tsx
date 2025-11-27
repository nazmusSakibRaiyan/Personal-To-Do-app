import { useState } from 'react'
import { X, Sparkles, AlertCircle } from 'lucide-react'
import { useTodoStore } from '../store/useTodoStore'
import { Task } from '../types'
import toast from 'react-hot-toast'

interface QuickAddProps {
  onClose: () => void
}

export default function QuickAdd({ onClose }: QuickAddProps) {
  const { addTask } = useTodoStore()
  const [input, setInput] = useState('')
  const [useAI, setUseAI] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsProcessing(true)

    try {
      if (useAI) {
        // Simulate AI parsing (in production, this would call the backend)
        await new Promise((resolve) => setTimeout(resolve, 800))

        // Simple parsing logic (placeholder for actual AI)
        const taskData = parseNaturalLanguage(input)
        addTask(taskData)
        toast.success('Task created with AI assistance! 🎉')
      } else {
        // Simple task creation
        addTask({
          title: input,
          status: 'pending',
          priority: 'medium',
          tags: [],
          subtasks: [],
        })
        toast.success('Task created!')
      }

      onClose()
    } catch (error) {
      toast.error('Failed to create task')
    } finally {
      setIsProcessing(false)
    }
  }

  // Simple natural language parser (placeholder)
  const parseNaturalLanguage = (text: string): Omit<Task, 'id' | 'createdAt' | 'updatedAt'> => {
    const lowerText = text.toLowerCase()
    
    // Detect priority
    let priority: Task['priority'] = 'medium'
    if (lowerText.includes('urgent') || lowerText.includes('asap')) priority = 'urgent'
    else if (lowerText.includes('high priority') || lowerText.includes('important')) priority = 'high'
    else if (lowerText.includes('low priority')) priority = 'low'

    // Detect tags
    const tags: string[] = []
    if (lowerText.includes('study') || lowerText.includes('exam') || lowerText.includes('homework'))
      tags.push('study')
    if (lowerText.includes('work') || lowerText.includes('meeting') || lowerText.includes('project'))
      tags.push('work')
    if (lowerText.includes('personal') || lowerText.includes('home')) tags.push('personal')

    // Detect due date (simplified)
    let dueDate: string | undefined
    const today = new Date()
    if (lowerText.includes('today')) {
      dueDate = today.toISOString()
    } else if (lowerText.includes('tomorrow')) {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      dueDate = tomorrow.toISOString()
    } else if (lowerText.includes('next week')) {
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)
      dueDate = nextWeek.toISOString()
    }

    // Clean up title
    const title = text
      .replace(/\b(urgent|asap|high priority|low priority|today|tomorrow|next week)\b/gi, '')
      .trim()

    return {
      title: title || text,
      status: 'pending',
      priority,
      tags,
      subtasks: [],
      dueDate,
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Quick Add Task</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="flex items-center gap-2 mb-2 text-sm font-medium">
              <Sparkles size={16} className="text-primary-600" />
              AI-Powered Input
              <input
                type="checkbox"
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
                className="ml-auto"
              />
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                useAI
                  ? "Try: 'Study for math exam tomorrow - high priority' or 'Complete project proposal by next week'"
                  : 'Enter task title...'
              }
              className="input min-h-32"
              autoFocus
            />
          </div>

          {useAI && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-2 text-sm">
              <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-blue-800 dark:text-blue-300">
                <strong>AI will automatically detect:</strong> priority, due dates, tags, and categories
                from your natural language input
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="btn btn-primary flex-1"
            >
              {isProcessing ? 'Processing...' : 'Create Task'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>

        {/* Quick Suggestions */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium mb-3">Quick Templates</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              'Study for exam',
              'Complete assignment',
              'Team meeting',
              'Workout session',
            ].map((template) => (
              <button
                key={template}
                onClick={() => setInput(template)}
                className="text-left px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
              >
                {template}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
