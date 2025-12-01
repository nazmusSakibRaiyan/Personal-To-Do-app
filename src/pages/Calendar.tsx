import { useState } from 'react'
import AdvancedCalendar from '../components/AdvancedCalendar'
import GoogleCalendarIntegration from '../components/GoogleCalendarIntegration'

export default function CalendarPage() {
  const [showGoogleIntegration, setShowGoogleIntegration] = useState(false)

  return (
    <div className="p-6 max-w-full mx-auto space-y-8">
      {/* Advanced Calendar */}
      <AdvancedCalendar />

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Google Calendar Integration */}
      {showGoogleIntegration && (
        <div className="max-w-3xl mx-auto">
          <GoogleCalendarIntegration />
        </div>
      )}

      {/* Toggle Integration */}
      {!showGoogleIntegration && (
        <div className="max-w-3xl mx-auto text-center py-8">
          <button
            onClick={() => setShowGoogleIntegration(true)}
            className="btn btn-primary"
          >
            Show Google Calendar Integration
          </button>
        </div>
      )}
    </div>
  )
}
