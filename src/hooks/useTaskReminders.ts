import { useEffect, useCallback, useRef } from 'react'
import { Task, Reminder, NotificationSettings } from '../types'
import { notificationService } from '../services/notificationService'

/**
 * Hook for managing reminders
 * Handles scheduling reminders based on task priority and custom intervals
 */

export function useTaskReminders(
  task: Task,
  notificationSettings: NotificationSettings,
  onReminder?: (reminder: Reminder) => void,
) {
  const remindersRef = useRef<Reminder[]>([])
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])

  /**
   * Get reminder minutes based on task priority and settings
   */
  const getReminderMinutes = useCallback((): number[] => {
    if (!notificationSettings.smartRemindersEnabled) {
      return notificationSettings.defaultReminderMinutes
    }

    const rules = notificationSettings.smartReminderRules
    const priorityRules = rules[task.priority as keyof typeof rules]
    return priorityRules || notificationSettings.defaultReminderMinutes
  }, [task.priority, notificationSettings])

  /**
   * Schedule a single reminder
   */
  const scheduleReminder = useCallback(
    (minutesBefore: number) => {
      if (!task.dueDate) return

      const dueDate = new Date(task.dueDate)
      const reminderTime = new Date(dueDate.getTime() - minutesBefore * 60 * 1000)
      const now = new Date()

      // Only schedule if reminder time is in the future
      if (reminderTime > now) {
        const delayMs = reminderTime.getTime() - now.getTime()

        const timeout = setTimeout(() => {
          const reminder: Reminder = {
            id: `${task.id}-${minutesBefore}`,
            taskId: task.id,
            reminderTime: reminderTime.toISOString(),
            notificationType: notificationSettings.soundEnabled ? 'sound' : 'browser',
            sent: true,
            sentAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          }

          remindersRef.current.push(reminder)

          // Show notification
          const message =
            minutesBefore === 0
              ? 'Task due now!'
              : minutesBefore < 60
                ? `Task due in ${minutesBefore} minutes`
                : `Task due in ${Math.floor(minutesBefore / 60)} hours`

          notificationService.addNotification({
            taskId: task.id,
            title: `Reminder: ${task.title}`,
            message,
            type: 'reminder',
            read: false,
            priority: task.priority,
            actionUrl: `/tasks/${task.id}`,
          })

          // Play sound if enabled
          if (notificationSettings.soundEnabled) {
            notificationService.playSound('reminder')
          }

          // Show browser notification if enabled
          if (notificationSettings.browserNotificationsEnabled) {
            notificationService.showBrowserNotification({
              id: reminder.id,
              taskId: task.id,
              title: `Reminder: ${task.title}`,
              message,
              type: 'reminder',
              read: false,
              priority: task.priority,
              createdAt: new Date().toISOString(),
            })
          }

          if (onReminder) {
            onReminder(reminder)
          }
        }, delayMs)

        timeoutsRef.current.push(timeout)
      }
    },
    [task, notificationSettings, onReminder],
  )

  /**
   * Schedule all reminders based on settings
   */
  const scheduleReminders = useCallback(() => {
    const reminderMinutes = getReminderMinutes()
    reminderMinutes.forEach((minutes) => {
      scheduleReminder(minutes)
    })
  }, [getReminderMinutes, scheduleReminder])

  /**
   * Clear all scheduled reminders for this task
   */
  const clearReminders = useCallback(() => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
    timeoutsRef.current = []
    remindersRef.current = []
  }, [])

  /**
   * Get all scheduled reminders for this task
   */
  const getScheduledReminders = useCallback((): Reminder[] => {
    return [...remindersRef.current]
  }, [])

  /**
   * Setup and cleanup reminders
   */
  useEffect(() => {
    // Clear previous reminders when task changes
    clearReminders()

    // Schedule new reminders if task has due date
    if (task.dueDate && notificationSettings.enabled) {
      scheduleReminders()
    }

    // Cleanup on unmount
    return () => {
      clearReminders()
    }
  }, [task.id, task.dueDate, task.priority, notificationSettings, scheduleReminders, clearReminders])

  return {
    reminders: getScheduledReminders(),
    clearReminders,
    scheduleReminders,
  }
}

/**
 * Hook for managing overdue task alerts
 */
export function useOverdueTaskAlerts(
  tasks: Task[],
  notificationSettings: NotificationSettings,
  onOverdueDetected?: (overdueTasks: Task[]) => void,
) {
  const checkedTasksRef = useRef<Set<string>>(new Set())
  const checkIntervalRef = useRef<NodeJS.Timeout>()

  const checkForOverdueTasks = useCallback(() => {
    const now = new Date()
    const overdueTasks = tasks.filter((task) => {
      if (task.status === 'completed' || !task.dueDate) return false

      const dueDate = new Date(task.dueDate)
      return dueDate < now && !checkedTasksRef.current.has(task.id)
    })

    overdueTasks.forEach((task) => {
      checkedTasksRef.current.add(task.id)

      const notification = notificationService.addNotification({
        taskId: task.id,
        title: `Overdue: ${task.title}`,
        message: `This task was due on ${new Date(task.dueDate!).toLocaleDateString()}`,
        type: 'overdue',
        read: false,
        priority: task.priority,
        actionUrl: `/tasks/${task.id}`,
      })

      // Play urgent sound for overdue tasks
      if (notificationSettings.soundEnabled) {
        notificationService.playSound('overdue')
      }

      // Show browser notification
      if (notificationSettings.browserNotificationsEnabled) {
        notificationService.showBrowserNotification(notification)
      }
    })

    if (overdueTasks.length > 0 && onOverdueDetected) {
      onOverdueDetected(overdueTasks)
    }
  }, [tasks, notificationSettings, onOverdueDetected])

  useEffect(() => {
    if (!notificationSettings.enabled) return

    // Check immediately
    checkForOverdueTasks()

    // Then check every minute
    checkIntervalRef.current = setInterval(checkForOverdueTasks, 60 * 1000)

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [checkForOverdueTasks, notificationSettings.enabled])

  return {
    checkForOverdueTasks,
  }
}

/**
 * Hook for managing upcoming task alerts
 */
export function useUpcomingTaskAlerts(
  tasks: Task[],
  notificationSettings: NotificationSettings,
  hoursAhead: number = 24,
  onUpcomingDetected?: (upcomingTasks: Task[]) => void,
) {
  const checkedTasksRef = useRef<Set<string>>(new Set())

  const checkForUpcomingTasks = useCallback(() => {
    const now = new Date()
    const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000)

    const upcomingTasks = tasks.filter((task) => {
      if (task.status === 'completed' || !task.dueDate) return false

      const dueDate = new Date(task.dueDate)
      return dueDate > now && dueDate <= futureTime && !checkedTasksRef.current.has(task.id)
    })

    upcomingTasks.forEach((task) => {
      checkedTasksRef.current.add(task.id)

      const dueDate = new Date(task.dueDate!)
      const hoursUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (60 * 60 * 1000))

      const notification = notificationService.addNotification({
        taskId: task.id,
        title: `Upcoming: ${task.title}`,
        message:
          hoursUntilDue === 1
            ? 'Due in 1 hour'
            : hoursUntilDue <= 24
              ? `Due in ${hoursUntilDue} hours`
              : `Due on ${dueDate.toLocaleDateString()}`,
        type: 'upcoming',
        read: false,
        priority: task.priority,
        actionUrl: `/tasks/${task.id}`,
      })

      if (notificationSettings.soundEnabled) {
        notificationService.playSound('reminder')
      }

      if (notificationSettings.browserNotificationsEnabled) {
        notificationService.showBrowserNotification(notification)
      }
    })

    if (upcomingTasks.length > 0 && onUpcomingDetected) {
      onUpcomingDetected(upcomingTasks)
    }
  }, [tasks, hoursAhead, notificationSettings])

  useEffect(() => {
    if (!notificationSettings.enabled) return

    // Check immediately
    checkForUpcomingTasks()

    // Check every 30 minutes
    const interval = setInterval(checkForUpcomingTasks, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [checkForUpcomingTasks, notificationSettings.enabled])

  return {
    checkForUpcomingTasks,
  }
}

