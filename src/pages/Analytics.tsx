import { useTodoStore } from '../store/useTodoStore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { format, subDays, eachDayOfInterval } from 'date-fns'

export default function Analytics() {
  const { tasks } = useTodoStore()

  // Task completion by status
  const statusData = [
    { name: 'Pending', value: tasks.filter((t) => t.status === 'pending').length, color: '#6b7280' },
    { name: 'In Progress', value: tasks.filter((t) => t.status === 'in-progress').length, color: '#f59e0b' },
    { name: 'Completed', value: tasks.filter((t) => t.status === 'completed').length, color: '#10b981' },
  ]

  // Priority distribution
  const priorityData = [
    { name: 'Low', value: tasks.filter((t) => t.priority === 'low').length, color: '#6b7280' },
    { name: 'Medium', value: tasks.filter((t) => t.priority === 'medium').length, color: '#3b82f6' },
    { name: 'High', value: tasks.filter((t) => t.priority === 'high').length, color: '#f59e0b' },
    { name: 'Urgent', value: tasks.filter((t) => t.priority === 'urgent').length, color: '#ef4444' },
  ]

  // Tasks completed over last 7 days
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  })

  const completionTrend = last7Days.map((day) => ({
    date: format(day, 'MMM dd'),
    completed: tasks.filter(
      (t) =>
        t.completedAt &&
        format(new Date(t.completedAt), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    ).length,
  }))

  // Category distribution
  const categoryData = tasks.reduce((acc: Record<string, number>, task) => {
    const category = task.category || 'Uncategorized'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {})

  const categoryChartData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value,
  }))

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6b7280']

  const stats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t) => t.status === 'completed').length,
    completionRate:
      tasks.length > 0
        ? Math.round((tasks.filter((t) => t.status === 'completed').length / tasks.length) * 100)
        : 0,
    averageTimeToComplete: calculateAverageCompletionTime(),
    mostProductiveDay: getMostProductiveDay(),
  }

  function calculateAverageCompletionTime() {
    const completedTasks = tasks.filter((t) => t.completedAt)
    if (completedTasks.length === 0) return 'N/A'

    const totalHours = completedTasks.reduce((sum, task) => {
      const created = new Date(task.createdAt).getTime()
      const completed = new Date(task.completedAt!).getTime()
      return sum + (completed - created) / (1000 * 60 * 60)
    }, 0)

    const avgHours = totalHours / completedTasks.length
    if (avgHours < 24) return `${Math.round(avgHours)}h`
    return `${Math.round(avgHours / 24)}d`
  }

  function getMostProductiveDay() {
    const dayCount: Record<string, number> = {}
    tasks
      .filter((t) => t.completedAt)
      .forEach((task) => {
        const day = format(new Date(task.completedAt!), 'EEEE')
        dayCount[day] = (dayCount[day] || 0) + 1
      })

    const mostProductive = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]
    return mostProductive ? mostProductive[0] : 'N/A'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Analytics & Insights</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Tasks</p>
          <p className="text-3xl font-bold">{stats.totalTasks}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
          <p className="text-3xl font-bold text-green-600">{stats.completedTasks}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completion Rate</p>
          <p className="text-3xl font-bold text-primary-600">{stats.completionRate}%</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg. Time</p>
          <p className="text-3xl font-bold">{stats.averageTimeToComplete}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Best Day</p>
          <p className="text-2xl font-bold">{stats.mostProductiveDay}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Task Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Priority Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6">
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Completion Trend */}
        <div className="card lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Completion Trend (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={completionTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        {categoryChartData.length > 0 && (
          <div className="card lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Tasks by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {categoryChartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
