export interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in-progress' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  tags: string[]
  category?: string
  subtasks: SubTask[]
  recurring?: RecurringPattern
  estimatedTime?: number // in minutes
  actualTime?: number
  reminderTime?: string
  color?: string
  aiSuggested?: boolean
  dependencies?: string[] // task IDs
}

export interface SubTask {
  id: string
  title: string
  completed: boolean
  createdAt: string
}

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'custom'
  interval: number
  daysOfWeek?: number[] // 0-6, Sunday to Saturday
  endDate?: string
}

export interface Category {
  id: string
  name: string
  color: string
  icon?: string
}

export interface TaskTemplate {
  id: string
  name: string
  description: string
  tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: 'en'
  notifications: {
    enabled: boolean
    reminderMinutes: number[]
    soundEnabled: boolean
  }
  workingHours: {
    start: string
    end: string
  }
  defaultPriority: Task['priority']
  weekStartsOn: number
  dateFormat: string
  timeFormat: '12h' | '24h'
}

export interface AIInsight {
  type: 'suggestion' | 'warning' | 'tip'
  message: string
  relatedTaskId?: string
  action?: {
    label: string
    callback: () => void
  }
}

export interface TaskStats {
  total: number
  completed: number
  pending: number
  inProgress: number
  overdue: number
  completionRate: number
  averageCompletionTime: number
  productivityScore: number
}

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  taskId?: string
  type: 'task' | 'event'
  color?: string
}

export interface FilterOptions {
  status?: Task['status'][]
  priority?: Task['priority'][]
  tags?: string[]
  categories?: string[]
  dateRange?: {
    start: string
    end: string
  }
  searchQuery?: string
}
