import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Download, Settings, Grid3x3, List } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, parseISO } from 'date-fns'
import { useTodoStore } from '../store/useTodoStore'
import { Task } from '../types'
import { generateICalendar, getTasksForDate } from '../services/calendarUtils'
import toast from 'react-hot-toast'

type ViewType = 'month' | 'week'

// Time Blocking Component
function TimeBlockingPanel({ selectedDate, onClose }: { selectedDate: Date; onClose: () => void }) {
  const { tasks } = useTodoStore()
  const [blocks] = useState<Array<{ time: string; duration: number; task?: string }>>([
    { time: '09:00', duration: 2 },
    { time: '11:00', duration: 1 },
    { time: '14:00', duration: 3 },
  ])

  const tasksForDate = getTasksForDate(tasks, selectedDate)

  return (
    <div className="mt-8 card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">
          Time Blocking - {format(selectedDate, 'MMM d, yyyy')}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close time blocking panel"
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Time blocks */}
        <div className="space-y-3">
          <h3 className="font-semibold mb-4">Time Blocks</h3>
          {blocks.map((block, idx) => (
            <div key={idx} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <label htmlFor={`time-${idx}`} className="sr-only">
                Time
              </label>
              <input
                id={`time-${idx}`}
                type="time"
                defaultValue={block.time}
                className="input text-sm flex-1"
                title="Block start time"
              />
              <label htmlFor={`duration-${idx}`} className="sr-only">
                Duration in hours
              </label>
              <input
                id={`duration-${idx}`}
                type="number"
                defaultValue={block.duration}
                min="0.5"
                step="0.5"
                className="input text-sm w-20"
                placeholder="Hours"
                title="Duration in hours"
              />
              <button type="button" aria-label="Remove time block" className="btn btn-secondary p-2" title="Remove time block">✕</button>
            </div>
          ))}
          <button type="button" aria-label="Add new time block" className="btn btn-primary w-full">+ Add Block</button>
        </div>

        {/* Tasks for this date */}
        <div>
          <h3 className="font-semibold mb-4">Tasks to Schedule</h3>
          <div className="space-y-2">
            {tasksForDate.map((task) => (
              <div
                key={task.id}
                className="p-3 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg border border-primary-200 dark:border-primary-800"
              >
                <p className="font-medium text-sm">{task.title}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Est. {task.estimatedTime || 30} mins
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdvancedCalendar() {
  const { tasks, updateTask } = useTodoStore()
  const [viewType, setViewType] = useState<ViewType>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [showTimeBlocking, setShowTimeBlocking] = useState(false)
  const [selectedDate] = useState(new Date())

  // Get calendar days based on view type
  const getCalendarDays = () => {
    if (viewType === 'month') {
      // Start from Sunday of the week containing the first day of the month
      const monthStart = startOfMonth(currentDate)
      const start = startOfWeek(monthStart, { weekStartsOn: 0 })
      // End on Saturday of the week containing the last day of the month
      const monthEnd = endOfMonth(currentDate)
      const end = endOfWeek(monthEnd, { weekStartsOn: 0 })
      return eachDayOfInterval({ start, end })
    } else {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 })
      const end = endOfWeek(currentDate, { weekStartsOn: 0 })
      return eachDayOfInterval({ start, end })
    }
  }

  const calendarDays = getCalendarDays()

  // Handle navigation
  const handlePrevious = () => {
    setCurrentDate(viewType === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1))
  }

  const handleNext = () => {
    setCurrentDate(viewType === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // Drag and drop handlers
  const handleDragStart = (task: Task) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDropOnDate = (date: Date) => {
    if (!draggedTask) return

    const newDueDate = new Date(date)
    const dueDate = draggedTask.dueDate ? parseISO(draggedTask.dueDate) : new Date()
    newDueDate.setHours(dueDate.getHours(), dueDate.getMinutes())

    updateTask(draggedTask.id, {
      dueDate: newDueDate.toISOString(),
    })

    toast.success(`Task rescheduled to ${format(date, 'MMM d')}`)
    setDraggedTask(null)
  }

  // Export calendar
  const handleExportCalendar = async () => {
    try {
      const icalContent = generateICalendar(tasks)

      // Create blob and download
      const blob = new Blob([icalContent], { type: 'text/calendar' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `tasks-${format(new Date(), 'yyyy-MM-dd')}.ics`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Calendar exported successfully!')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export calendar')
    }
  }

  // Month view
  const renderMonthView = () => {
    const weeks = []
    let currentWeek: Date[] = []

    for (const day of calendarDays) {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek])
        currentWeek = []
      }
    }

    return (
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleToday}
                aria-label="Go to today's date in month view"
                className="btn btn-secondary text-sm"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handlePrevious}
                aria-label="Go to previous month"
                className="btn btn-secondary p-2"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Go to next month"
                className="btn btn-secondary p-2"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-sm py-2">
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar grid */}
        <div className="p-6">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-2 mb-2">
              {week.map((day) => {
                const dayTasks = getTasksForDate(tasks, day)
                const isCurrentMonth = isSameMonth(day, currentDate)
                const isToday = isSameDay(day, new Date())

                return (
                  <div
                    key={day.toISOString()}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDropOnDate(day)}
                    className={`min-h-24 p-2 rounded-lg border-2 transition-all cursor-grab active:cursor-grabbing ${
                      isToday
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : isCurrentMonth
                        ? 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/20'
                    }`}
                  >
                    <div className={`text-sm font-semibold mb-1 ${!isCurrentMonth ? 'text-gray-400' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 2).map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(task)}
                          className={`text-xs p-1 rounded cursor-grab active:cursor-grabbing truncate font-medium ${
                            task.priority === 'urgent'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : task.priority === 'high'
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          }`}
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      ))}
                      {dayTasks.length > 2 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
                          +{dayTasks.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Week view
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate)
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(currentDate),
    })

    // Get hourly time slots
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              Week of {format(weekStart, 'MMM d')} - {format(endOfWeek(currentDate), 'MMM d, yyyy')}
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleToday}
                aria-label="Go to today's date in week view"
                className="btn btn-secondary text-sm"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handlePrevious}
                aria-label="Go to previous week"
                className="btn btn-secondary p-2"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Go to next week"
                className="btn btn-secondary p-2"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Week grid */}
        <div className="overflow-x-auto">
          <div className="grid gap-0 min-w-full" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
            {/* Time column header */}
            <div className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" />

            {/* Day headers */}
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`p-3 text-center border-b-2 font-semibold text-sm ${
                  isSameDay(day, new Date())
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div>{format(day, 'EEE')}</div>
                <div className="text-lg">{format(day, 'd')}</div>
              </div>
            ))}

            {/* Time slots */}
            {hours.map((hour) => (
              <div key={hour}>
                {/* Time label */}
                <div className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 w-20 h-16 p-2 text-xs font-medium text-gray-600 dark:text-gray-400 border-b border-r border-gray-200 dark:border-gray-700">
                  {format(new Date().setHours(hour, 0), 'Ha')}
                </div>

                {/* Time slots for each day */}
                {weekDays.map((day) => {
                  const slotTasks = getTasksForDate(tasks, day).filter((task) => {
                    if (!task.dueDate) return false
                    const taskHour = parseISO(task.dueDate).getHours()
                    return taskHour === hour
                  })

                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDropOnDate(day)}
                      className="h-16 border-b border-r border-gray-200 dark:border-gray-700 p-1 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      {slotTasks.map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(task)}
                          className={`text-xs p-1 rounded truncate font-medium cursor-grab active:cursor-grabbing ${
                            task.priority === 'urgent'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : task.priority === 'high'
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          }`}
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CalendarIcon size={32} className="text-primary-600" />
          Advanced Calendar
        </h1>
        <div className="flex gap-3">
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setViewType('month')}
              aria-label="Switch to month view"
              aria-pressed={viewType === 'month'}
              className={`px-4 py-2 rounded font-medium transition-all ${
                viewType === 'month'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Grid3x3 size={18} className="inline mr-2" aria-hidden="true" />
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewType('week')}
              aria-label="Switch to week view"
              aria-pressed={viewType === 'week'}
              className={`px-4 py-2 rounded font-medium transition-all ${
                viewType === 'week'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <List size={18} className="inline mr-2" aria-hidden="true" />
              Week
            </button>
          </div>
          <button
            type="button"
            onClick={handleExportCalendar}
            aria-label="Export calendar as iCalendar file"
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download size={18} aria-hidden="true" />
            Export (iCal)
          </button>
          <button
            type="button"
            onClick={() => setShowTimeBlocking(!showTimeBlocking)}
            aria-label={showTimeBlocking ? 'Hide time blocking panel' : 'Show time blocking panel'}
            aria-pressed={showTimeBlocking}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Settings size={18} aria-hidden="true" />
            Time Blocking
          </button>
        </div>
      </div>

      {/* Calendar view */}
      {viewType === 'month' ? renderMonthView() : renderWeekView()}

      {/* Time blocking panel */}
      {showTimeBlocking && (
        <TimeBlockingPanel
          selectedDate={selectedDate}
          onClose={() => setShowTimeBlocking(false)}
        />
      )}
    </div>
  )
}
