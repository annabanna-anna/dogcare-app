import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ExternalLink, AlertCircle } from 'lucide-react'
import DogIcon from '../components/icons/DogIcon'
import PageHeader from '../components/PageHeader'
import BottomNav from '../components/BottomNav'
import { listStays } from '../lib/stays'
import { listDogs } from '../lib/dogs'
import { listTasksByStay } from '../lib/tasks'
import {
  connectGoogleCalendar,
  isGoogleCalendarConnected,
  isUsingRoverCalendar,
  isPushEnabled,
  listUpcomingGoogleEvents,
  pushTasksToGoogleCalendar,
  getLastPushError,
  type GoogleCalendarEvent,
} from '../lib/googleCalendar'
import { formatShortDate, formatTime } from '../utils/dateUtils'
import type { Dog, Stay } from '../types'

function formatEventRange(event: GoogleCalendarEvent): string {
  if (event.allDay) {
    return event.start === event.end
      ? formatShortDate(event.start)
      : `${formatShortDate(event.start)} → ${formatShortDate(event.end)}`
  }
  const sameDay = event.start.slice(0, 10) === event.end.slice(0, 10)
  return sameDay
    ? `${formatShortDate(event.start)} · ${formatTime(event.start)} – ${formatTime(event.end)}`
    : `${formatShortDate(event.start)} ${formatTime(event.start)} → ${formatShortDate(event.end)} ${formatTime(event.end)}`
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const now = new Date()
  const [stays, setStays] = useState<Stay[]>([])
  const [dogs, setDogs] = useState<Dog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [googleConnected] = useState(isGoogleCalendarConnected)
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([])
  const [googleError, setGoogleError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [isRover, setIsRover] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [lastPushError, setLastPushError] = useState<string | null>(getLastPushError)

  async function retryAllPushes() {
    setRetrying(true)
    try {
      for (const stay of upcomingStays) {
        const stayTasks = await listTasksByStay(stay.id)
        await pushTasksToGoogleCalendar(stayTasks)
      }
      setLastPushError(null)
    } catch {
      setLastPushError(getLastPushError())
    } finally {
      setRetrying(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([listStays(), listDogs()])
      .then(([stayRows, dogRows]) => {
        if (cancelled) return
        setStays(stayRows)
        setDogs(dogRows)
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Could not load.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!googleConnected) return
    let cancelled = false
    listUpcomingGoogleEvents()
      .then((events) => {
        if (cancelled) return
        setGoogleEvents(events)
        setIsRover(isUsingRoverCalendar())
      })
      .catch((e) => {
        if (cancelled) return
        setGoogleError(
          e instanceof Error && e.message === 'EXPIRED'
            ? 'Your Google Calendar connection expired.'
            : 'Could not load Google Calendar events.',
        )
      })
    return () => {
      cancelled = true
    }
  }, [googleConnected])

  async function handleConnect() {
    setConnecting(true)
    try {
      await connectGoogleCalendar('/calendar')
    } catch {
      setConnecting(false)
    }
  }

  const upcomingStays = stays
    .filter((s) => new Date(s.endDate) >= now)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))

  return (
    <div className="min-h-svh bg-cream pb-28">
      <PageHeader title="Calendar" />

      <div className="px-6 mt-4 flex flex-col gap-4">
        {!googleConnected && (
          <div className="bg-[#eef1fd] border border-[#d3daf8] rounded-[16px] p-4 flex gap-3 items-start">
            <div className="size-9 rounded-[10px] bg-white flex items-center justify-center shrink-0">
              <CalendarDays size={18} className="text-cobalt" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-dm font-bold text-[14px] text-text-primary leading-snug">
                Connect Google Calendar
              </p>
              <p className="font-dm text-[13px] text-text-secondary mt-0.5 leading-snug">
                See your upcoming Google Calendar events here too — handy for stays booked
                elsewhere, like through Rover.
              </p>
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="font-dm font-bold text-[13px] text-cobalt mt-2"
              >
                {connecting ? 'Connecting…' : 'Connect'}
              </button>
            </div>
          </div>
        )}

        <p className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-widest">
          Upcoming Stays
        </p>

        {error && (
          <div className="bg-[#fee2e2] rounded-[12px] px-4 py-3">
            <p className="font-dm text-[13px] text-[#b91c1c]">{error}</p>
          </div>
        )}

        {googleConnected && isPushEnabled() && lastPushError && (
          <div className="flex items-start gap-2 bg-[#fee2e2] rounded-[12px] px-4 py-3">
            <AlertCircle size={16} className="text-[#b91c1c] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-dm text-[13px] text-[#b91c1c] leading-snug">
                A push to Google didn't go through: {lastPushError}
              </p>
              <button
                onClick={() => void retryAllPushes()}
                disabled={retrying}
                className="font-dm font-bold text-[12px] text-[#b91c1c] underline mt-1 disabled:opacity-60"
              >
                {retrying ? 'Retrying…' : 'Retry now'}
              </button>
            </div>
          </div>
        )}

        {loading && <p className="font-dm text-[14px] text-text-secondary">Loading…</p>}

        {!loading && upcomingStays.length === 0 && (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <CalendarDays size={40} className="text-[#d1d5db]" />
            <p className="font-outfit font-bold text-[17px] text-text-primary">
              No upcoming stays
            </p>
            <p className="font-dm text-[14px] text-text-secondary">
              Start a stay from a dog's profile.
            </p>
          </div>
        )}

        {upcomingStays.map((stay) => {
          const dog = dogs.find((d) => d.id === stay.dogId)
          if (!dog) return null
          const isActive = new Date(stay.startDate) <= now && new Date(stay.endDate) >= now
          return (
            <div
              key={stay.id}
              className="bg-white border border-border-light rounded-[16px] p-4 flex gap-4 items-center"
            >
              <div className="size-12 rounded-[10px] overflow-hidden bg-[#f3f4f6] shrink-0 flex items-center justify-center">
                {dog.photoUrl ? (
                  <img src={dog.photoUrl} alt={dog.name} className="size-full object-cover" />
                ) : (
                  <DogIcon size={22} className="text-text-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-outfit font-semibold text-[17px] text-text-primary leading-none">
                    {dog.name}
                  </p>
                  {isActive && (
                    <span className="text-[11px] font-dm font-bold bg-[#dcfce7] text-[#15803d] rounded-full px-2 py-0.5">
                      Active
                    </span>
                  )}
                </div>
                <p className="font-dm text-[13px] text-text-secondary">
                  {formatShortDate(stay.startDate)} → {formatShortDate(stay.endDate)}
                </p>
                {stay.notes && (
                  <p className="font-dm text-[13px] text-text-muted mt-1 truncate">
                    {stay.notes}
                  </p>
                )}
              </div>
            </div>
          )
        })}

        {googleConnected && (
          <>
            <p className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-widest mt-2">
              {isRover ? 'From Rover' : 'From Google Calendar'}
            </p>

            {googleError && (
              <div className="flex items-start gap-2 bg-[#fee2e2] rounded-[12px] px-4 py-3">
                <AlertCircle size={16} className="text-[#b91c1c] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-dm text-[13px] text-[#b91c1c]">{googleError}</p>
                  <button
                    onClick={() => navigate('/settings')}
                    className="font-dm font-bold text-[12px] text-[#b91c1c] underline mt-1"
                  >
                    Reconnect in Settings
                  </button>
                </div>
              </div>
            )}

            {!googleError && googleEvents.length === 0 && (
              <p className="font-dm text-[13px] text-text-secondary">
                {isRover
                  ? 'No upcoming confirmed bookings.'
                  : 'No upcoming events on your Google Calendar.'}
              </p>
            )}

            {googleEvents.map((event) => (
              <a
                key={event.id}
                href={event.htmlLink}
                target="_blank"
                rel="noreferrer"
                className="bg-white border border-border-light rounded-[16px] p-4 flex gap-4 items-center active:scale-[0.98] transition-transform"
              >
                <div className="size-12 rounded-[10px] bg-[#eef1fd] shrink-0 flex items-center justify-center">
                  <CalendarDays size={20} className="text-cobalt" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-outfit font-semibold text-[16px] text-text-primary leading-tight truncate">
                    {event.title}
                  </p>
                  <p className="font-dm text-[13px] text-text-secondary mt-0.5">
                    {formatEventRange(event)}
                  </p>
                </div>
                <ExternalLink size={16} className="text-text-muted shrink-0" />
              </a>
            ))}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
