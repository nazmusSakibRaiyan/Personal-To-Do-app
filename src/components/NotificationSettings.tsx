import { useState } from 'react'
import { NotificationSettings } from '../types'

interface NotificationSettingsProps {
  initialSettings: NotificationSettings
  onSave: (settings: NotificationSettings) => void
}

export function NotificationSettingsComponent({
  initialSettings,
  onSave,
}: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettings>(initialSettings)
  const [hasChanged, setHasChanged] = useState(false)

  const handleChange = (key: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }))
    setHasChanged(true)
  }

  const handleSmartReminderRuleChange = (
    priority: 'urgent' | 'high' | 'medium' | 'low',
    index: number,
    value: number,
  ) => {
    setSettings(prev => ({
      ...prev,
      smartReminderRules: {
        ...prev.smartReminderRules,
        [priority]: prev.smartReminderRules[priority].map((v, i) =>
          i === index ? value : v,
        ),
      },
    }))
    setHasChanged(true)
  }

  const handleAddReminderRule = (priority: 'urgent' | 'high' | 'medium' | 'low') => {
    setSettings(prev => ({
      ...prev,
      smartReminderRules: {
        ...prev.smartReminderRules,
        [priority]: [...prev.smartReminderRules[priority], 15],
      },
    }))
    setHasChanged(true)
  }

  const handleRemoveReminderRule = (
    priority: 'urgent' | 'high' | 'medium' | 'low',
    index: number,
  ) => {
    setSettings(prev => ({
      ...prev,
      smartReminderRules: {
        ...prev.smartReminderRules,
        [priority]: prev.smartReminderRules[priority].filter((_, i) => i !== index),
      },
    }))
    setHasChanged(true)
  }

  const handleDefaultReminderChange = (index: number, value: number) => {
    setSettings(prev => ({
      ...prev,
      defaultReminderMinutes: prev.defaultReminderMinutes.map((v, i) =>
        i === index ? value : v,
      ),
    }))
    setHasChanged(true)
  }

  const handleAddDefaultReminder = () => {
    setSettings(prev => ({
      ...prev,
      defaultReminderMinutes: [...prev.defaultReminderMinutes, 15],
    }))
    setHasChanged(true)
  }

  const handleRemoveDefaultReminder = (index: number) => {
    setSettings(prev => ({
      ...prev,
      defaultReminderMinutes: prev.defaultReminderMinutes.filter((_, i) => i !== index),
    }))
    setHasChanged(true)
  }

  const handleSave = () => {
    onSave(settings)
    setHasChanged(false)
  }

  const handleReset = () => {
    setSettings(initialSettings)
    setHasChanged(false)
  }



  // Helper function to format minutes (currently unused)
  // const formatMinutes = (minutes: number): string => {
  //   if (minutes < 60) return `${minutes}m`
  //   if (minutes < 1440) return `${Math.floor(minutes / 60)}h`
  //   return `${Math.floor(minutes / 1440)}d`
  // }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          📢 Notification Settings
        </h2>

        {/* Main Toggle */}
        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
              className="w-5 h-5 rounded"
            />
            <span className="font-semibold text-gray-900 dark:text-white">
              Enable All Notifications
            </span>
          </label>
        </div>

        {settings.enabled && (
          <>
            {/* Browser Notifications */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>🌐</span>
                  Browser Notifications
                </h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.browserNotificationsEnabled}
                    onChange={(e) =>
                      handleChange('browserNotificationsEnabled', e.target.checked)
                    }
                    className="w-5 h-5 rounded"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Receive notifications in your browser
              </p>
              {settings.browserNotificationsEnabled && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  ✓ Browser notifications are available
                </p>
              )}
            </div>

            {/* Sound Alerts */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>🔊</span>
                  Sound Alerts
                </h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => handleChange('soundEnabled', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Play sound alerts for notifications and reminders
              </p>
            </div>

            {/* Email Reminders */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>📧</span>
                  Email Reminders
                </h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailRemindersEnabled}
                    onChange={(e) => handleChange('emailRemindersEnabled', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Receive email reminders for your tasks
              </p>
              {settings.emailRemindersEnabled && (
                <input
                  type="email"
                  value={settings.emailAddress || ''}
                  onChange={(e) => handleChange('emailAddress', e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              )}
            </div>

            {/* Smart Reminders */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>✨</span>
                  Smart Reminders
                </h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.smartRemindersEnabled}
                    onChange={(e) => handleChange('smartRemindersEnabled', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Adjust reminder times based on task priority
              </p>

              {settings.smartRemindersEnabled && (
                <div className="space-y-4">
                  {(['urgent', 'high', 'medium', 'low'] as const).map((priority) => (
                    <div key={priority} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-semibold text-gray-900 dark:text-white capitalize">
                          {priority === 'urgent' && '🔴'}
                          {priority === 'high' && '🟠'}
                          {priority === 'medium' && '🟡'}
                          {priority === 'low' && '🟢'}
                          {' '}{priority} Priority
                        </span>
                      </div>
                      <div className="space-y-2">
                        {settings.smartReminderRules[priority].map((minutes, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              value={minutes}
                              onChange={(e) =>
                                handleSmartReminderRuleChange(
                                  priority,
                                  index,
                                  parseInt(e.target.value) || 15,
                                )
                              }
                              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              minutes before deadline
                            </span>
                            {settings.smartReminderRules[priority].length > 1 && (
                              <button
                                onClick={() => handleRemoveReminderRule(priority, index)}
                                className="ml-auto text-red-500 hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => handleAddReminderRule(priority)}
                          className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                        >
                          + Add reminder time
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Default Reminder Intervals */}
            {!settings.smartRemindersEnabled && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span>⏱️</span>
                  Default Reminder Intervals
                </h3>
                <div className="space-y-2">
                  {settings.defaultReminderMinutes.map((minutes, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
                      <input
                        type="number"
                        min="1"
                        value={minutes}
                        onChange={(e) =>
                          handleDefaultReminderChange(index, parseInt(e.target.value) || 15)
                        }
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        minutes before deadline
                      </span>
                      <button
                        onClick={() => handleRemoveDefaultReminder(index)}
                        className="ml-auto text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={handleAddDefaultReminder}
                    className="w-full mt-2 py-2 text-blue-500 hover:text-blue-700 font-medium text-sm border border-blue-500 rounded-lg"
                  >
                    + Add reminder interval
                  </button>
                </div>
              </div>
            )}


          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={!hasChanged}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Save Settings
          </button>
          {hasChanged && (
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
