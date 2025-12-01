// Email API Usage Examples
// Location: src/services/emailExamples.ts

import { emailAPI } from './api'
import toast from 'react-hot-toast'

// ============================================
// EMAIL CONFIGURATION
// ============================================

/**
 * Example: Configure email service (usually done in Settings page)
 */
export async function setupEmailService(
  email: string,
  password: string
): Promise<boolean> {
  try {
    const result = await emailAPI.configureEmail(
      email,
      password,
      'smtp.gmail.com', // Optional: override SMTP server
      587 // Optional: override port
    )
    
    console.log('Email configured:', result)
    toast.success('Email service configured!')
    return true
  } catch (error) {
    console.error('Email configuration failed:', error)
    toast.error('Failed to configure email')
    return false
  }
}

/**
 * Example: Check if email is already configured
 */
export async function checkEmailSetup(): Promise<boolean> {
  try {
    const status = await emailAPI.getEmailStatus()
    
    if (status.configured) {
      console.log(`Email configured for: ${status.email}`)
      console.log(`SMTP: ${status.smtp_server}:${status.smtp_port}`)
      return true
    } else {
      console.log('Email not configured yet')
      return false
    }
  } catch (error) {
    console.error('Error checking email status:', error)
    return false
  }
}

// ============================================
// TASK REMINDERS
// ============================================

/**
 * Example: Send a task reminder email
 * 
 * Use case: Send reminder before task deadline
 */
export async function sendTaskReminderEmail(
  userEmail: string,
  taskTitle: string,
  dueDate: string, // Format: "2025-12-20"
  priority: 'low' | 'medium' | 'high' | 'urgent'
): Promise<boolean> {
  try {
    const result = await emailAPI.sendTaskReminder(
      userEmail,
      taskTitle,
      dueDate,
      priority
    )
    
    console.log('Task reminder sent:', result)
    toast.success(`Reminder sent for "${taskTitle}"`)
    return true
  } catch (error) {
    console.error('Failed to send reminder:', error)
    toast.error('Failed to send reminder')
    return false
  }
}

/**
 * Example: Auto-send reminders for tasks due tomorrow
 */
export async function sendRemindersForUpcomingTasks(
  tasks: Array<{ id: string; title: string; dueDate?: string; priority: string }>,
  userEmail: string
): Promise<void> {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const upcomingTasks = tasks.filter((task) => {
    if (!task.dueDate) return false
    const taskDate = new Date(task.dueDate)
    return (
      taskDate.getDate() === tomorrow.getDate() &&
      taskDate.getMonth() === tomorrow.getMonth() &&
      taskDate.getFullYear() === tomorrow.getFullYear()
    )
  })
  
  for (const task of upcomingTasks) {
    await sendTaskReminderEmail(
      userEmail,
      task.title,
      task.dueDate!,
      task.priority as 'low' | 'medium' | 'high' | 'urgent'
    )
  }
}

// ============================================
// TASK COMPLETION NOTIFICATIONS
// ============================================

/**
 * Example: Send task completion notification
 * 
 * Use case: Celebrate task completion
 */
export async function sendTaskCompletionEmail(
  userEmail: string,
  taskTitle: string
): Promise<boolean> {
  try {
    const result = await emailAPI.sendTaskCompleted(userEmail, taskTitle)
    
    console.log('Completion notification sent:', result)
    toast.success(`Celebration email sent for "${taskTitle}"`)
    return true
  } catch (error) {
    console.error('Failed to send completion email:', error)
    toast.error('Failed to send completion notification')
    return false
  }
}

// ============================================
// DAILY SUMMARIES
// ============================================

/**
 * Example: Send daily productivity summary
 * 
 * Use case: Send end-of-day summary at 5 PM
 */
export async function sendDailyProductivitySummary(
  userEmail: string,
  todaysTasks: Array<{ status: string }>,
  completedTasksCount: number
): Promise<boolean> {
  try {
    const totalTasks = todaysTasks.length
    
    const result = await emailAPI.sendDailySummary(
      userEmail,
      totalTasks,
      completedTasksCount
    )
    
    console.log('Daily summary sent:', result)
    toast.success('Daily summary sent!')
    return true
  } catch (error) {
    console.error('Failed to send daily summary:', error)
    toast.error('Failed to send summary')
    return false
  }
}

// ============================================
// CUSTOM EMAILS
// ============================================

/**
 * Example: Send custom HTML email
 * 
 * Use case: Send formatted messages
 */
export async function sendCustomEmail(
  userEmail: string,
  subject: string,
  htmlContent: string
): Promise<boolean> {
  try {
    const result = await emailAPI.sendEmail(
      userEmail,
      subject,
      htmlContent
    )
    
    console.log('Custom email sent:', result)
    toast.success('Email sent successfully!')
    return true
  } catch (error) {
    console.error('Failed to send custom email:', error)
    toast.error('Failed to send email')
    return false
  }
}

/**
 * Example: Send weekly digest email
 */
export async function sendWeeklyDigest(
  userEmail: string,
  weekStats: {
    tasksCompleted: number
    tasksCreated: number
    totalHoursLogged: number
    streakDays: number
  }
): Promise<boolean> {
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px;">
            📊 Your Weekly Digest
          </h1>
          
          <div style="margin: 20px 0;">
            <h2 style="color: #4CAF50; font-size: 18px;">This Week's Achievements</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="background: #e8f5e9; padding: 15px; border-radius: 5px;">
                <p style="color: #666; margin: 0;">Tasks Completed</p>
                <p style="font-size: 28px; color: #4CAF50; margin: 5px 0; font-weight: bold;">
                  ${weekStats.tasksCompleted}
                </p>
              </div>
              
              <div style="background: #e3f2fd; padding: 15px; border-radius: 5px;">
                <p style="color: #666; margin: 0;">Tasks Created</p>
                <p style="font-size: 28px; color: #2196F3; margin: 5px 0; font-weight: bold;">
                  ${weekStats.tasksCreated}
                </p>
              </div>
              
              <div style="background: #fff3e0; padding: 15px; border-radius: 5px;">
                <p style="color: #666; margin: 0;">Hours Logged</p>
                <p style="font-size: 28px; color: #FF9800; margin: 5px 0; font-weight: bold;">
                  ${weekStats.totalHoursLogged}h
                </p>
              </div>
              
              <div style="background: #f3e5f5; padding: 15px; border-radius: 5px;">
                <p style="color: #666; margin: 0;">Day Streak</p>
                <p style="font-size: 28px; color: #9C27B0; margin: 5px 0; font-weight: bold;">
                  🔥 ${weekStats.streakDays}
                </p>
              </div>
            </div>
          </div>
          
          <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #666;">
              Great job this week! Keep up the productivity and maintain your momentum into next week.
            </p>
          </div>
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            This is an automated email from your Smart To-Do App
          </p>
        </div>
      </body>
    </html>
  `
  
  return sendCustomEmail(userEmail, '📊 Your Weekly Digest', htmlContent)
}

/**
 * Example: Send team collaboration email
 */
export async function sendTaskAssignmentEmail(
  recipientEmail: string,
  taskTitle: string,
  assignedBy: string,
  dueDate: string,
  description: string
): Promise<boolean> {
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>📌 You've been assigned a new task</h2>
          
          <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2196F3;">${taskTitle}</h3>
            <p><strong>Assigned by:</strong> ${assignedBy}</p>
            <p><strong>Due date:</strong> ${dueDate}</p>
            <p><strong>Description:</strong></p>
            <p>${description}</p>
          </div>
          
          <p>
            <a href="http://localhost:3001" style="background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View in App →
            </a>
          </p>
        </div>
      </body>
    </html>
  `
  
  return sendCustomEmail(recipientEmail, `📌 Task Assigned: ${taskTitle}`, htmlContent)
}

// ============================================
// INTEGRATION WITH ZUSTAND STORE
// ============================================

/**
 * Example: Add email notifications to task completion handler
 * 
 * Usage in your Zustand store (useTodoStore.ts):
 */
export function createEmailNotificationMiddleware(userEmail: string) {
  return (config: any) => (set: any) => {
    const state = config(
      (fn: any) => {
        set(fn)
      }
    )
    
    return {
      ...state,
      updateTask: (taskId: string, updates: any) => {
        // Call original update
        state.updateTask(taskId, updates)
        
        // Send email if task was completed
        if (updates.status === 'completed') {
          const task = state.tasks.find((t: any) => t.id === taskId)
          if (task) {
            sendTaskCompletionEmail(userEmail, task.title)
          }
        }
      },
    }
  }
}

// ============================================
// REACT HOOK EXAMPLE
// ============================================

/**
 * Example: React hook for email operations
 */
export function useEmailNotifications(userEmail: string) {
  return {
    sendReminder: (taskTitle: string, dueDate: string, priority: string) =>
      sendTaskReminderEmail(userEmail, taskTitle, dueDate, priority as any),
    
    sendCompletion: (taskTitle: string) =>
      sendTaskCompletionEmail(userEmail, taskTitle),
    
    sendSummary: (total: number, completed: number) =>
      emailAPI.sendDailySummary(userEmail, total, completed),
    
    sendCustom: (subject: string, htmlContent: string) =>
      sendCustomEmail(userEmail, subject, htmlContent),
    
    checkSetup: checkEmailSetup,
  }
}

// ============================================
// AUTOMATION EXAMPLES
// ============================================

/**
 * Example: Setup automatic task reminders
 * Run this after email is configured
 */
export function setupTaskReminderSchedule(
  tasks: Array<{ id: string; title: string; dueDate?: string; priority: string }>,
  userEmail: string
): NodeJS.Timer {
  // Check every hour for upcoming tasks
  const intervalId = setInterval(async () => {
    await sendRemindersForUpcomingTasks(tasks, userEmail)
  }, 3600000) // 1 hour
  
  return intervalId
}

/**
 * Example: Setup daily summary email at specific time
 */
export function scheduleDailySummary(
  allTasks: Array<{ status: string }>,
  userEmail: string,
  hourToSend: number = 17 // 5 PM
): void {
  const checkTime = setInterval(() => {
    const now = new Date()
    
    if (now.getHours() === hourToSend && now.getMinutes() === 0) {
      const todayCompleted = allTasks.filter(
        (t: any) =>
          t.status === 'completed' &&
          new Date(t.createdAt || '').toDateString() === new Date().toDateString()
      ).length
      
      sendDailyProductivitySummary(userEmail, allTasks, todayCompleted)
      clearInterval(checkTime)
    }
  }, 60000) // Check every minute
}

export default {
  setupEmailService,
  checkEmailSetup,
  sendTaskReminderEmail,
  sendTaskCompletionEmail,
  sendDailyProductivitySummary,
  sendCustomEmail,
  sendWeeklyDigest,
  sendTaskAssignmentEmail,
  useEmailNotifications,
  setupTaskReminderSchedule,
  scheduleDailySummary,
}
