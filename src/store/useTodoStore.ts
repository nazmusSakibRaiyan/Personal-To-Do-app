import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Task, Category, UserPreferences, TaskTemplate } from '../types'
import { addDays, parseISO } from 'date-fns'

interface TodoStore {
  tasks: Task[]
  categories: Category[]
  templates: TaskTemplate[]
  preferences: UserPreferences
  
  // Task operations
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTaskStatus: (id: string) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  
  // Category operations
  addCategory: (category: Omit<Category, 'id'>) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string) => void
  
  // Template operations
  addTemplate: (template: Omit<TaskTemplate, 'id'>) => void
  deleteTemplate: (id: string) => void
  applyTemplate: (templateId: string) => void
  
  // Preferences
  updatePreferences: (updates: Partial<UserPreferences>) => void
  
  // Utility
  getTaskById: (id: string) => Task | undefined
  getTasksByCategory: (categoryId: string) => Task[]
  getTasksByTag: (tag: string) => Task[]
  getOverdueTasks: () => Task[]
  getUpcomingTasks: (days: number) => Task[]
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'en',
  notifications: {
    enabled: true,
    reminderMinutes: [15, 60, 1440],
    soundEnabled: true,
  },
  workingHours: {
    start: '09:00',
    end: '17:00',
  },
  defaultPriority: 'medium',
  weekStartsOn: 1,
  dateFormat: 'MM/dd/yyyy',
  timeFormat: '12h',
}

const defaultCategories: Category[] = [
  { id: '1', name: 'Work', color: '#3b82f6', icon: '💼' },
  { id: '2', name: 'Study', color: '#8b5cf6', icon: '📚' },
  { id: '3', name: 'Personal', color: '#10b981', icon: '🏠' },
  { id: '4', name: 'Projects', color: '#f59e0b', icon: '🚀' },
  { id: '5', name: 'Health', color: '#ef4444', icon: '❤️' },
]

export const useTodoStore = create<TodoStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      categories: defaultCategories,
      templates: [],
      preferences: defaultPreferences,

      addTask: (task) => {
        const newTask: Task = {
          ...task,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          subtasks: task.subtasks || [],
          tags: task.tags || [],
        }
        set((state) => ({ tasks: [...state.tasks, newTask] }))
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: new Date().toISOString() }
              : task
          ),
        }))
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }))
      },

      toggleTaskStatus: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === id) {
              const newStatus =
                task.status === 'completed' ? 'pending' : 'completed'
              return {
                ...task,
                status: newStatus,
                completedAt:
                  newStatus === 'completed' ? new Date().toISOString() : undefined,
                updatedAt: new Date().toISOString(),
              }
            }
            return task
          }),
        }))
      },

      toggleSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === taskId) {
              return {
                ...task,
                subtasks: task.subtasks.map((subtask) =>
                  subtask.id === subtaskId
                    ? { ...subtask, completed: !subtask.completed }
                    : subtask
                ),
                updatedAt: new Date().toISOString(),
              }
            }
            return task
          }),
        }))
      },

      addCategory: (category) => {
        const newCategory: Category = {
          ...category,
          id: crypto.randomUUID(),
        }
        set((state) => ({ categories: [...state.categories, newCategory] }))
      },

      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id ? { ...cat, ...updates } : cat
          ),
        }))
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((cat) => cat.id !== id),
        }))
      },

      addTemplate: (template) => {
        const newTemplate: TaskTemplate = {
          ...template,
          id: crypto.randomUUID(),
        }
        set((state) => ({ templates: [...state.templates, newTemplate] }))
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((tpl) => tpl.id !== id),
        }))
      },

      applyTemplate: (templateId) => {
        const template = get().templates.find((t) => t.id === templateId)
        if (template) {
          template.tasks.forEach((task) => {
            get().addTask(task)
          })
        }
      },

      updatePreferences: (updates) => {
        set((state) => ({
          preferences: { ...state.preferences, ...updates },
        }))
      },

      getTaskById: (id) => {
        return get().tasks.find((task) => task.id === id)
      },

      getTasksByCategory: (categoryId) => {
        return get().tasks.filter((task) => task.category === categoryId)
      },

      getTasksByTag: (tag) => {
        return get().tasks.filter((task) => task.tags.includes(tag))
      },

      getOverdueTasks: () => {
        const now = new Date()
        return get().tasks.filter((task) => {
          if (!task.dueDate || task.status === 'completed') return false
          return parseISO(task.dueDate) < now
        })
      },

      getUpcomingTasks: (days) => {
        const now = new Date()
        const future = addDays(now, days)
        return get().tasks.filter((task) => {
          if (!task.dueDate || task.status === 'completed') return false
          const dueDate = parseISO(task.dueDate)
          return dueDate >= now && dueDate <= future
        })
      },
    }),
    {
      name: 'todo-storage',
    }
  )
)
