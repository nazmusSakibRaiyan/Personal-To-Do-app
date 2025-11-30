import { useState, useEffect } from 'react'
import { Calendar, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { taskAPI } from '../services/api'
import { useTodoStore } from '../store/useTodoStore'

export default function WorkloadBalance() {
  const { tasks } = useTodoStore()
  const [workload, setWorkload] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only load if there are tasks
    if (tasks.length > 0) {
      loadWorkload()
    } else {
      setLoading(false)
    }
  }, [tasks.length])

  const loadWorkload = async () => {
    try {
      const data = await taskAPI.getWorkloadAnalysis()
      setWorkload(data)
    } catch (error) {
      console.error('Failed to load workload:', error)
    } finally {
      setLoading(false)
    }
  }

  // Don't show anything if there are no tasks
  if (tasks.length === 0) {
    return null
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-primary-600 animate-pulse" size={20} />
          <h3 className="font-semibold">Loading Workload Analysis...</h3>
        </div>
      </div>
    )
  }

  if (!workload) return null

  const getLoadColor = (load: string) => {
    switch (load) {
      case 'high':
        return 'bg-red-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-green-500'
      default:
        return 'bg-gray-300'
    }
  }

  const getLoadBadge = (load: string) => {
    switch (load) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="text-primary-600" size={20} />
        <h3 className="font-semibold text-lg">Weekly Workload Balance</h3>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {workload.current_week.total_tasks}
          </p>
        </div>
        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Hours</p>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {workload.current_week.total_hours}h
          </p>
        </div>
      </div>

      {/* Daily Distribution */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-3">Daily Distribution</h4>
        <div className="space-y-3">
          {workload.current_week.distribution.map((day: any, index: number) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{day.day}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    {day.tasks} tasks · {day.hours}h
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getLoadBadge(
                      day.load
                    )}`}
                  >
                    {day.load}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <div
                  className={`h-full ${getLoadColor(day.load)} transition-all`}
                  style={{
                    width: `${(day.hours / workload.current_week.total_hours) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Peak Productivity Hours */}
      {workload.peak_productivity_hours && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-green-600" size={16} />
            <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">
              Peak Productivity Hours
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-green-700 dark:text-green-300 font-medium">Morning</p>
              <p className="text-green-800 dark:text-green-200">
                {workload.peak_productivity_hours.morning.start} -{' '}
                {workload.peak_productivity_hours.morning.end}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Score: {workload.peak_productivity_hours.morning.score}%
              </p>
            </div>
            <div>
              <p className="text-green-700 dark:text-green-300 font-medium">Afternoon</p>
              <p className="text-green-800 dark:text-green-200">
                {workload.peak_productivity_hours.afternoon.start} -{' '}
                {workload.peak_productivity_hours.afternoon.end}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Score: {workload.peak_productivity_hours.afternoon.score}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {workload.suggestions && workload.suggestions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp size={16} className="text-primary-600" />
            AI Recommendations
          </h4>
          {workload.suggestions.map((suggestion: any, index: number) => {
            const Icon =
              suggestion.priority === 'high'
                ? AlertCircle
                : suggestion.priority === 'medium'
                ? TrendingUp
                : CheckCircle

            const colorClass =
              suggestion.priority === 'high'
                ? 'text-red-600'
                : suggestion.priority === 'medium'
                ? 'text-yellow-600'
                : 'text-blue-600'

            const bgClass =
              suggestion.priority === 'high'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : suggestion.priority === 'medium'
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'

            return (
              <div key={index} className={`p-3 rounded-lg border ${bgClass}`}>
                <div className="flex items-start gap-3">
                  <Icon className={`${colorClass} flex-shrink-0 mt-0.5`} size={18} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{suggestion.message}</p>
                    {suggestion.action && (
                      <button className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium mt-1">
                        Apply suggestion →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
