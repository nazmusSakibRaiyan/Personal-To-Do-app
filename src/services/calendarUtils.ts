import { Task } from '../types'
import { format, isSameDay, parseISO } from 'date-fns'

/**
 * Generate iCalendar format string for tasks
 */
export const generateICalendar = (tasks: Task[]): string => {
  const lines: string[] = []

  // Calendar header
  lines.push('BEGIN:VCALENDAR')
  lines.push('VERSION:2.0')
  lines.push('PRODID:-//Smart To-Do App//EN')
  lines.push('CALSCALE:GREGORIAN')
  lines.push(`X-WR-CALNAME:Tasks - ${format(new Date(), 'MMM d, yyyy')}`)
  lines.push('X-WR-CALDESC:Tasks exported from Smart To-Do App')
  lines.push('X-WR-TIMEZONE:UTC')
  lines.push('CALMETHOD:PUBLISH')

  // Add tasks as events
  tasks.forEach((task) => {
    if (task.dueDate) {
      lines.push('BEGIN:VEVENT')
      lines.push(`UID:${task.id}@smarttodo.app`)
      lines.push(`DTSTAMP:${formatISO8601(new Date())}`)
      lines.push(`DTSTART:${formatISO8601(parseISO(task.dueDate))}`)

      // Set end time based on estimated time
      const duration = task.estimatedTime || 60 // Default to 1 hour
      const endDate = new Date(parseISO(task.dueDate).getTime() + duration * 60000)
      lines.push(`DTEND:${formatISO8601(endDate)}`)

      // Task title and description
      lines.push(`SUMMARY:${escapeICalValue(task.title)}`)
      if (task.description) {
        lines.push(`DESCRIPTION:${escapeICalValue(task.description)}`)
      }

      // Priority mapping: urgent=1, high=3, medium=5, low=9
      const priorityMap: Record<string, number> = {
        urgent: 1,
        high: 3,
        medium: 5,
        low: 9,
      }
      lines.push(`PRIORITY:${priorityMap[task.priority] || 5}`)

      // Status mapping
      const statusMap: Record<string, string> = {
        pending: 'TODO',
        'in-progress': 'IN-PROCESS',
        completed: 'COMPLETED',
      }
      lines.push(`STATUS:${statusMap[task.status] || 'TODO'}`)

      // Categories (tags)
      if (task.tags.length > 0) {
        lines.push(`CATEGORIES:${task.tags.join(',')}`)
      }

      // Task location (category as location)
      if (task.category) {
        lines.push(`LOCATION:${escapeICalValue(task.category)}`)
      }

      lines.push('END:VEVENT')
    }
  })

  lines.push('END:VCALENDAR')

  return lines.join('\r\n')
}

/**
 * Format date for iCalendar (ISO 8601)
 */
const formatISO8601 = (date: Date): string => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

/**
 * Escape special characters in iCalendar values
 */
const escapeICalValue = (value: string): string => {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n')
}

/**
 * Get tasks for a specific date
 */
export const getTasksForDate = (tasks: Task[], date: Date): Task[] => {
  return tasks.filter((task) => 
    task.dueDate && isSameDay(parseISO(task.dueDate), date)
  )
}

/**
 * Group tasks by date
 */
export const groupTasksByDate = (tasks: Task[]): Record<string, Task[]> => {
  const grouped: Record<string, Task[]> = {}

  tasks.forEach((task) => {
    if (task.dueDate) {
      const dateKey = format(parseISO(task.dueDate), 'yyyy-MM-dd')
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(task)
    }
  })

  return grouped
}

/**
 * Calculate workload for a date
 */
export const calculateWorkload = (tasks: Task[], date: Date): number => {
  const dayTasks = getTasksForDate(tasks, date)
  return dayTasks.reduce((total, task) => total + (task.estimatedTime || 30), 0)
}

/**
 * Get time blocks for a date
 */
export interface TimeBlock {
  startTime: string // HH:MM format
  duration: number // in minutes
  title: string
  taskId?: string
  priority: Task['priority']
}

export const generateTimeBlocks = (tasks: Task[], date: Date): TimeBlock[] => {
  const dayTasks = getTasksForDate(tasks, date)
  const blocks: TimeBlock[] = []
  let currentTime = 9 * 60 // Start at 9 AM in minutes

  // Sort tasks by priority
  const sorted = [...dayTasks].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  sorted.forEach((task) => {
    const duration = task.estimatedTime || 30
    const hours = Math.floor(currentTime / 60)
    const minutes = currentTime % 60

    blocks.push({
      startTime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
      duration,
      title: task.title,
      taskId: task.id,
      priority: task.priority,
    })

    currentTime += duration + 5 // Add 5 min buffer between tasks
  })

  return blocks
}

/**
 * Calculate productivity score for a date
 */
export const calculateProductivityScore = (
  completedTasks: Task[],
  totalTasks: Task[],
  date: Date
): number => {
  const dayCompleted = completedTasks.filter((t) => 
    t.completedAt && isSameDay(parseISO(t.completedAt), date)
  ).length

  const dayTotal = totalTasks.filter((t) => 
    t.dueDate && isSameDay(parseISO(t.dueDate), date)
  ).length

  if (dayTotal === 0) return 0

  return Math.round((dayCompleted / dayTotal) * 100)
}

/**
 * Find time conflicts between tasks
 */
export const findTimeConflicts = (tasks: Task[]): Array<{ task1: Task; task2: Task }> => {
  const conflicts: Array<{ task1: Task; task2: Task }> = []

  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const task1 = tasks[i]
      const task2 = tasks[j]

      if (task1.dueDate && task2.dueDate) {
        const date1 = parseISO(task1.dueDate)
        const date2 = parseISO(task2.dueDate)

        // Check if on same day
        if (isSameDay(date1, date2)) {
          // Check time overlap
          const start1 = date1.getTime()
          const end1 = start1 + (task1.estimatedTime || 30) * 60000
          const start2 = date2.getTime()
          const end2 = start2 + (task2.estimatedTime || 30) * 60000

          if (start1 < end2 && start2 < end1) {
            conflicts.push({ task1, task2 })
          }
        }
      }
    }
  }

  return conflicts
}

/**
 * Suggest optimal time for a task
 */
export const suggestOptimalTime = (
  task: Task,
  tasks: Task[],
  date: Date
): { time: string; score: number } => {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  let bestTime = '09:00'
  let bestScore = 0

  for (const hour of hours) {
    // Skip off-hours
    if (hour < 8 || hour > 20) continue

    const timeStr = `${String(hour).padStart(2, '0')}:00`
    
    // Create temporary task for this time
    const tempDate = new Date(date)
    tempDate.setHours(hour, 0)
    const tempTask = { ...task, dueDate: tempDate.toISOString() }

    // Check conflicts
    const conflicts = findTimeConflicts([tempTask, ...tasks])
    const score = 100 - conflicts.length * 20

    if (score > bestScore) {
      bestScore = score
      bestTime = timeStr
    }
  }

  return { time: bestTime, score: bestScore }
}
