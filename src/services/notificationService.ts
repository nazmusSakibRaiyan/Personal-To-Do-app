import type { Notification, Task } from '../types'

/**
 * Notification Service
 * Handles browser notifications, sound alerts, and reminder scheduling
 */

class NotificationService {
  private notifications: Notification[] = []
  private soundEnabled: boolean = true
  private browserNotificationsEnabled: boolean = false
  private audioContext: AudioContext | null = null

  constructor() {
    this.initializeBrowserNotifications()
  }

  /**
   * Request browser notification permission
   */
  private async initializeBrowserNotifications() {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission()
        this.browserNotificationsEnabled = permission === 'granted'
      } catch (error) {
        console.error('Failed to request notification permission:', error)
      }
    } else if ('Notification' in window) {
      this.browserNotificationsEnabled = Notification.permission === 'granted'
    }
  }

  /**
   * Show browser notification
   */
  showBrowserNotification(notification: Notification): void {
    if (!this.browserNotificationsEnabled || !('Notification' in window)) {
      return
    }

    const n = new Notification(notification.title, {
      body: notification.message,
      icon: this.getIconForPriority(notification.priority),
      tag: notification.id,
      requireInteraction: notification.priority === 'urgent' || notification.priority === 'high',
    })

    n.onclick = () => {
      window.focus()
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl
      }
    }
  }

  /**
   * Play sound alert
   */
  playSound(soundType: 'reminder' | 'overdue' | 'completion' = 'reminder'): void {
    if (!this.soundEnabled) return

    try {
      // Create audio context if not exists
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      const ctx = this.audioContext
      const now = ctx.currentTime

      // Generate different beep patterns based on sound type
      const frequencies = this.getSoundFrequencies(soundType)

      frequencies.forEach((freq, index) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.frequency.value = freq
        osc.type = 'sine'

        const startTime = now + index * 0.15
        const duration = 0.1

        gain.gain.setValueAtTime(0.3, startTime)
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)

        osc.start(startTime)
        osc.stop(startTime + duration)
      })
    } catch (error) {
      console.error('Failed to play sound:', error)
    }
  }

  /**
   * Get sound frequencies based on notification type
   */
  private getSoundFrequencies(type: 'reminder' | 'overdue' | 'completion'): number[] {
    switch (type) {
      case 'overdue':
        // High-pitched urgent beeps
        return [800, 1000, 800]
      case 'completion':
        // Pleasant ascending tones
        return [523.25, 659.25, 783.99]
      case 'reminder':
      default:
        // Gentle double beep
        return [440, 528]
    }
  }

  /**
   * Get icon URL based on task priority
   */
  private getIconForPriority(priority: Task['priority']): string {
    const icons: Record<Task['priority'], string> = {
      urgent: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
    }
    return icons[priority]
  }

  /**
   * Add notification to store
   */
  addNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Notification {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    }
    this.notifications.push(newNotification)
    return newNotification
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find((n) => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): Notification[] {
    return this.notifications.filter((n) => !n.read)
  }

  /**
   * Get all notifications
   */
  getAllNotifications(): Notification[] {
    return [...this.notifications]
  }

  /**
   * Get notifications for a specific task
   */
  getTaskNotifications(taskId: string): Notification[] {
    return this.notifications.filter((n) => n.taskId === taskId)
  }

  /**
   * Clear a notification
   */
  clearNotification(notificationId: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== notificationId)
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): void {
    this.notifications = []
  }

  /**
   * Clear notifications for a specific task
   */
  clearTaskNotifications(taskId: string): void {
    this.notifications = this.notifications.filter((n) => n.taskId !== taskId)
  }

  /**
   * Set sound enabled/disabled
   */
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled
  }

  /**
   * Get sound enabled status
   */
  isSoundEnabled(): boolean {
    return this.soundEnabled
  }

  /**
   * Check if browser notifications are available
   */
  areBrowserNotificationsAvailable(): boolean {
    return 'Notification' in window
  }

  /**
   * Get browser notifications status
   */
  areBrowserNotificationsEnabled(): boolean {
    return this.browserNotificationsEnabled
  }

  /**
   * Request browser notification permission
   */
  async requestBrowserNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      this.browserNotificationsEnabled = permission === 'granted'
      return this.browserNotificationsEnabled
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  }
}

export const notificationService = new NotificationService()
