import { useState } from 'react'
import { X, Sparkles, Check, Plus, Clock } from 'lucide-react'
import { taskAPI } from '../services/api'
import { useTodoStore } from '../store/useTodoStore'
import toast from 'react-hot-toast'

interface TaskBreakdownProps {
  taskId: string
  taskTitle: string
  taskDescription?: string
  onClose: () => void
}

export default function TaskBreakdown({ 
  taskId, 
  taskTitle, 
  taskDescription, 
  onClose 
}: TaskBreakdownProps) {
  const { updateTask, getTaskById } = useTodoStore()
  const [loading, setLoading] = useState(false)
  const [breakdown, setBreakdown] = useState<any>(null)
  const [selectedSubtasks, setSelectedSubtasks] = useState<number[]>([])

  const generateBreakdown = async () => {
    setLoading(true)
    try {
      const data = await taskAPI.getTaskBreakdown(taskTitle, taskDescription)
      setBreakdown(data)
      // Select all by default
      setSelectedSubtasks(data.subtasks.map((_: any, idx: number) => idx))
    } catch (error) {
      console.error('Failed to generate breakdown:', error)
      toast.error('Failed to generate task breakdown')
    } finally {
      setLoading(false)
    }
  }

  const toggleSubtask = (index: number) => {
    if (selectedSubtasks.includes(index)) {
      setSelectedSubtasks(selectedSubtasks.filter(i => i !== index))
    } else {
      setSelectedSubtasks([...selectedSubtasks, index])
    }
  }

  const applyBreakdown = () => {
    const task = getTaskById(taskId)
    if (!task) return

    const newSubtasks = breakdown.subtasks
      .filter((_: any, idx: number) => selectedSubtasks.includes(idx))
      .map((subtask: any) => ({
        id: crypto.randomUUID(),
        title: subtask.title,
        completed: false,
        createdAt: new Date().toISOString(),
      }))

    updateTask(taskId, {
      subtasks: [...task.subtasks, ...newSubtasks],
      estimatedTime: breakdown.estimatedTime,
    })

    toast.success(`Added ${newSubtasks.length} subtasks!`)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary-600" size={24} />
              <h2 className="text-2xl font-bold">AI Task Breakdown</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Break down "{taskTitle}" into manageable steps
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!breakdown ? (
            <div className="text-center py-12">
              <Sparkles className="mx-auto mb-4 text-primary-600" size={48} />
              <h3 className="text-lg font-semibold mb-2">
                Let AI break down this task for you
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                AI will analyze your task and suggest manageable subtasks
              </p>
              <button
                onClick={generateBreakdown}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Generate Breakdown
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                <div className="flex items-start gap-3">
                  <Sparkles className="text-primary-600 mt-1" size={20} />
                  <div className="flex-1">
                    <p className="font-medium text-primary-900 dark:text-primary-100">
                      {breakdown.suggestion}
                    </p>
                    {breakdown.estimatedTime && (
                      <p className="text-sm text-primary-700 dark:text-primary-300 mt-1 flex items-center gap-1">
                        <Clock size={14} />
                        Estimated time: {Math.floor(breakdown.estimatedTime / 60)}h{' '}
                        {breakdown.estimatedTime % 60}m
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Subtasks */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                  Select subtasks to add:
                </h3>
                {breakdown.subtasks.map((subtask: any, index: number) => (
                  <label
                    key={index}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedSubtasks.includes(index)
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubtasks.includes(index)}
                      onChange={() => toggleSubtask(index)}
                      className="w-5 h-5 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{subtask.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        ~{breakdown.estimatedTime / breakdown.subtasks.length} min
                      </p>
                    </div>
                    {selectedSubtasks.includes(index) && (
                      <Check className="text-primary-600" size={20} />
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {breakdown && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
            <button onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={applyBreakdown}
              disabled={selectedSubtasks.length === 0}
              className="btn btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Add {selectedSubtasks.length} Subtask{selectedSubtasks.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
