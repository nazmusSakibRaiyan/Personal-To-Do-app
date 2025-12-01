import { useState, useEffect } from 'react'
import { Mail, LogOut, RefreshCw, Loader } from 'lucide-react'
import { taskAPI, emailAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function GoogleCalendarIntegration() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  // Load email configuration on mount
  useEffect(() => {
    const loadEmailConfig = async () => {
      try {
        const status = await emailAPI.getEmailStatus()
        if (status.configured) {
          setUserEmail(status.email)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Error loading email config:', error)
      }
    }
    loadEmailConfig()
  }, [])

  const handleAuthClick = async () => {
    try {
      // Check if email is configured
      const status = await emailAPI.getEmailStatus()
      if (status.configured) {
        setIsAuthenticated(true)
        setUserEmail(status.email)
        toast.success(`Connected as ${status.email}!`)
      } else {
        toast.error('Please configure email in Settings first')
      }
    } catch (error) {
      console.error('Auth failed:', error)
      toast.error('Failed to connect - please configure email in Settings')
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await taskAPI.syncGoogleCalendar()
      setLastSync(new Date().toLocaleString())
      toast.success('Calendar synced successfully!')
    } catch (error) {
      console.error('Sync failed:', error)
      toast.error('Failed to sync calendar')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUserEmail('')
    toast.success('Disconnected from Google Calendar')
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Mail className="text-primary-600" size={24} />
          Google Calendar Integration
        </h2>
      </div>

      {!isAuthenticated ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Sync your tasks with Google Calendar to keep everything in sync
          </p>
          <button
            type="button"
            onClick={handleAuthClick}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <Mail size={18} />
            Connect Google Account
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connected status */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Connected as</p>
                <p className="font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  {userEmail}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary text-sm flex items-center gap-2"
              >
                <LogOut size={16} />
                Disconnect
              </button>
            </div>
          </div>

          {/* Sync controls */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold mb-1">Sync Status</p>
                {lastSync ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Last synced: {lastSync}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Never synced
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleSync}
                disabled={isSyncing}
                className="btn btn-primary flex items-center gap-2"
              >
                {isSyncing ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} />
                    Sync Now
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sync settings */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-3">Sync Settings</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">Automatically sync completed tasks</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">Create Google Calendar events for new tasks</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">Show Google Calendar events in todo app</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
