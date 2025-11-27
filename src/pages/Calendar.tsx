import { useState } from 'react'
import { useTodoStore } from '../store/useTodoStore'
import Calendar from 'react-calendar'
// @ts-ignore
import 'react-calendar/dist/Calendar.css'
import { format, isSameDay, parseISO } from 'date-fns'
import TaskCard from '../components/TaskCard'

export default function CalendarPage() {
  const { tasks } = useTodoStore()
  const [selectedDate, setSelectedDate] = useState(new Date())

  const tasksForSelectedDate = tasks.filter(
    (task) => task.dueDate && isSameDay(parseISO(task.dueDate), selectedDate)
  )

  const tasksWithDates = tasks.filter((t) => t.dueDate)

  const tileContent = ({ date }: { date: Date }) => {
    const tasksOnDate = tasksWithDates.filter(
      (task) => task.dueDate && isSameDay(parseISO(task.dueDate), date)
    )
    
    if (tasksOnDate.length === 0) return null

    return (
      <div className="flex gap-1 justify-center mt-1">
        {tasksOnDate.slice(0, 3).map((task) => (
          /* eslint-disable-next-line react/forbid-dom-props */
          <div
            key={task.id}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor:
                task.priority === 'urgent'
                  ? '#ef4444'
                  : task.priority === 'high'
                  ? '#f59e0b'
                  : '#10b981',
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Calendar</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <div className="card">
          <Calendar
            onChange={(value) => setSelectedDate(value as Date)}
            value={selectedDate}
            tileContent={tileContent}
            className="w-full border-none"
          />
        </div>

        {/* Tasks for selected date */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">
            {format(selectedDate, 'MMMM d, yyyy')}
          </h2>
          {tasksForSelectedDate.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No tasks scheduled for this date
            </div>
          ) : (
            <div className="space-y-3">
              {tasksForSelectedDate.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Tasks Timeline */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Upcoming Tasks</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasksWithDates
            .filter((t) => new Date(t.dueDate!) >= new Date() && t.status !== 'completed')
            .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
            .slice(0, 6)
            .map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
        </div>
      </div>
    </div>
  )
}
