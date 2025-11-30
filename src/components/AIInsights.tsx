import { useState, useEffect } from 'react'
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Target, X } from 'lucide-react'
import { taskAPI } from '../services/api'
import { useTodoStore } from '../store/useTodoStore'

export default function AIInsights() {
  const { tasks } = useTodoStore()
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState<string[]>([])

  useEffect(() => {
    // Only load if there are tasks
    if (tasks.length > 0) {
      loadInsights()
    } else {
      setLoading(false)
    }
  }, [tasks.length])

  const loadInsights = async () => {
    try {
      const data = await taskAPI.getProductivityPatterns()
      setInsights(data)
    } catch (error) {
      console.error('Failed to load insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const dismissInsight = (index: number) => {
    setDismissed([...dismissed, `${index}`])
  }

  // Don't show anything if there are no tasks
  if (tasks.length === 0) {
    return null
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-primary-600 animate-pulse" size={20} />
          <h3 className="font-semibold">Loading AI Insights...</h3>
        </div>
      </div>
    )
  }

  if (!insights) return null

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <TrendingUp className="text-green-600" size={20} />
      case 'warning':
        return <AlertTriangle className="text-yellow-600" size={20} />
      case 'tip':
        return <Lightbulb className="text-blue-600" size={20} />
      case 'habit':
        return <Target className="text-purple-600" size={20} />
      default:
        return <Sparkles className="text-primary-600" size={20} />
    }
  }

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'tip':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      case 'habit':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
      default:
        return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-primary-600" size={20} />
        <h3 className="font-semibold text-lg">AI Insights & Recommendations</h3>
      </div>

      {/* Productivity Trend */}
      {insights.completion_trends && (
        <div className="mb-4 p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg border border-primary-200 dark:border-primary-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Productivity Trend</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {insights.completion_trends.this_week}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">vs Last Week</p>
              <p className={`text-lg font-semibold ${
                insights.completion_trends.trend === 'improving' 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {insights.completion_trends.change_percent > 0 ? '+' : ''}
                {insights.completion_trends.change_percent}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Insights List */}
      <div className="space-y-3">
        {insights.insights
          ?.filter((_: any, idx: number) => !dismissed.includes(`${idx}`))
          .map((insight: any, index: number) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getBackgroundColor(insight.type)} transition-all`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon(insight.type)}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">{insight.message}</p>
                  {insight.actionable && insight.action && (
                    <button className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium mt-1">
                      {insight.action} →
                    </button>
                  )}
                </div>
                <button
                  onClick={() => dismissInsight(index)}
                  className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
                  aria-label="Dismiss insight"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Best Performance Days */}
      {insights.best_days && insights.best_days.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">🏆 Your Best Days</h4>
          <div className="flex gap-2 flex-wrap">
            {insights.best_days.slice(0, 3).map((day: any, idx: number) => (
              <span
                key={idx}
                className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium"
              >
                {day.day} ({day.completion_rate}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Time Patterns */}
      {insights.time_patterns && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">⏰ Time Patterns</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Peak Hour</p>
              <p className="font-semibold">{insights.time_patterns.most_productive_hour}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Avg Duration</p>
              <p className="font-semibold">{insights.time_patterns.average_task_duration} min</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
