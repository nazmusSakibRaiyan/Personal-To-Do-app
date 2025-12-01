import { useEffect, useRef } from 'react'
import { useTodoStore } from '../store/useTodoStore'
import { parseISO, formatISO } from 'date-fns'
import toast from 'react-hot-toast'

const REMINDER_CHECK_INTERVAL = 60000 // Check every minute
const SENT_REMINDERS_KEY = 'task_reminders_sent'

interface SentReminder {
  taskId: string
  timestamp: string
}

export function useTaskReminders() {
  const { tasks } = useTodoStore()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const sentRemindersRef = useRef<SentReminder[]>([])

  // Load previously sent reminders from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SENT_REMINDERS_KEY)
    if (stored) {
      try {
        sentRemindersRef.current = JSON.parse(stored)
      } catch (error) {
        console.error('Failed to parse sent reminders:', error)
      }
    }
  }, [])

  // Save sent reminders to localStorage
  const saveSentReminders = (reminders: SentReminder[]) => {
    sentRemindersRef.current = reminders
    localStorage.setItem(SENT_REMINDERS_KEY, JSON.stringify(reminders))
  }

  // Check if a reminder was already sent for this task
  const hasReminderBeenSent = (taskId: string) => {
    return sentRemindersRef.current.some((r) => r.taskId === taskId)
  }

  // Send email reminder via backend
  const sendEmailReminder = async (taskId: string, taskTitle: string, taskDescription?: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/email/send-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          taskTitle,
          taskDescription,
        }),
      })

      if (response.ok) {
        toast.success(`Reminder sent for "${taskTitle}"`)
        
        // Record that we sent this reminder
        const newReminder: SentReminder = {
          taskId,
          timestamp: formatISO(new Date()),
        }
        saveSentReminders([...sentRemindersRef.current, newReminder])
        
        return true
      } else {
        const error = await response.json()
        console.error('Failed to send reminder:', error)
        toast.error(`Failed to send reminder for "${taskTitle}"`)
        return false
      }
    } catch (error) {
      console.error('Error sending reminder:', error)
      toast.error('Error sending email reminder')
      return false
    }
  }

  // Check tasks and send reminders
  const checkAndSendReminders = async () => {
    const now = new Date()

    for (const task of tasks) {
      // Skip if task is already completed
      if (task.status === 'completed') {
        continue
      }

      // Skip if no due date
      if (!task.dueDate) {
        continue
      }

      // Skip if reminder already sent
      if (hasReminderBeenSent(task.id)) {
        continue
      }

      try {
        const dueDate = parseISO(task.dueDate)

        // Check if we've reached the reminder time (within 1 minute window to avoid duplicates)
        const minutesBefore = (dueDate.getTime() - now.getTime()) / 60000
        
        // Send reminder if:
        // 1. The due time is within the next minute
        // 2. OR we're past the reminder time but before the due time
        if (minutesBefore <= 1 && minutesBefore > -1) {
          await sendEmailReminder(task.id, task.title, task.description)
        }
      } catch (error) {
        console.error(`Error processing task ${task.id}:`, error)
      }
    }
  }

  // Set up interval for checking reminders
  useEffect(() => {
    // Initial check immediately
    checkAndSendReminders()

    // Set up recurring checks
    intervalRef.current = setInterval(() => {
      checkAndSendReminders()
    }, REMINDER_CHECK_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [tasks])
}
