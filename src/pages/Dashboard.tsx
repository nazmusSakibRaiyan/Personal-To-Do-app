import { useState } from 'react'
import { Plus, Search, Sparkles, TrendingUp, AlertCircle, Clock } from 'lucide-react'
import { useTodoStore } from '../store/useTodoStore'
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns'
import TaskCard from '../components/TaskCard'
import QuickAdd from '../components/QuickAdd'
import StatsOverview from '../components/StatsOverview'
import AIInsights from '../components/AIInsights'
import WorkloadBalance from '../components/WorkloadBalance'

export default function Dashboard() {
  const { tasks, getOverdueTasks } = useTodoStore()
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const todayTasks = tasks.filter(
    (t) => t.dueDate && isToday(new Date(t.dueDate)) && t.status !== 'completed'
  )
  const tomorrowTasks = tasks.filter(
    (t) => t.dueDate && isTomorrow(new Date(t.dueDate)) && t.status !== 'completed'
  )
  const thisWeekTasks = tasks.filter(
    (t) => t.dueDate && isThisWeek(new Date(t.dueDate)) && t.status !== 'completed'
  )
  const overdueTasks = getOverdueTasks()
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress')

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's what you have planned for {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats Overview */}
      <StatsOverview />

      {/* AI Insights and Workload Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <AIInsights />
        <WorkloadBalance />
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex gap-4">
        <button
          onClick={() => setShowQuickAdd(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Quick Add Task
        </button>
        <button className="btn btn-secondary flex items-center gap-2">
          <Sparkles size={20} />
          AI Suggestions
        </button>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search tasks, tags, or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Overdue Alert */}
      {overdueTasks.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100">
              {overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300">
              You have tasks that need immediate attention
            </p>
          </div>
        </div>
      )}

      {/* Task Sections */}
      <div className="space-y-8">
        {/* In Progress */}
        {inProgressTasks.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="text-primary-600" size={24} />
              In Progress ({inProgressTasks.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inProgressTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </section>
        )}

        {/* Today */}
        {todayTasks.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="text-green-600" size={24} />
              Today ({todayTasks.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {todayTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </section>
        )}

        {/* Tomorrow */}
        {tomorrowTasks.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">
              Tomorrow ({tomorrowTasks.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tomorrowTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </section>
        )}

        {/* This Week */}
        {thisWeekTasks.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">
              This Week ({thisWeekTasks.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {thisWeekTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAdd onClose={() => setShowQuickAdd(false)} />
      )}
    </div>
  )
}
