import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
} from 'lucide-react';
import LogoLoader from './LogoLoader';
import VerifiedBadge from './VerifiedBadge';
import { adminApi } from '../api';
import {
  calendarWeek,
  calendarDaySlots,
  calendarMinutes,
  calendarRows,
  shiftCalendarDate,
} from '../../../shared/availabilityCalendar';
import './availability-calendar.css';

const dateLabel = (date, options) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...options }).format(
    new Date(`${date}T00:00:00Z`),
  );
const timeLabel = (minutes) =>
  `${Math.floor(minutes / 60) % 12 || 12}${minutes % 60 ? ':' + String(minutes % 60).padStart(2, '0') : ''} ${minutes >= 720 ? 'PM' : 'AM'}`;
export default function SlotsInspectorView() {
  const [influencers, setInfluencers] = useState([]);
  const [creatorId, setCreatorId] = useState('');
  const [date, setDate] = useState(() =>
    new Date(Date.now() + 19800000).toISOString().slice(0, 10),
  );
  const [mode, setMode] = useState('week');
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [reload, setReload] = useState(0);
  const [selection, setSelection] = useState(null);
  useEffect(() => {
    let active = true;
    setListLoading(true);
    setListError('');
    adminApi.influencers
      .getAll()
      .then((result) => {
        if (!active) return;
        const records = result.influencers || [];
        setInfluencers(records);
        setCreatorId((current) =>
          records.some((item) => item.id === current)
            ? current
            : records[0]?.id || '',
        );
      })
      .catch(() => {
        if (active)
          setListError('Unable to load influencers. Please try again.');
      })
      .finally(() => {
        if (active) setListLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reload]);
  useEffect(() => {
    if (!creatorId) return;
    let active = true;
    setLoading(true);
    setError('');
    setOverview(null);
    setSelection(null);
    adminApi.influencers
      .getSlotsOverview(creatorId, date)
      .then((result) => {
        if (active) setOverview(result);
      })
      .catch(() => {
        if (active) setError('Unable to load the schedule. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [creatorId, date, reload]);
  const creator = influencers.find((item) => item.id === creatorId);
  const week = calendarWeek(date);
  const columns = (
    mode === 'week' ? week : week.filter((day) => day.date === date)
  ).map((day) => ({ ...day, slots: calendarDaySlots(overview, day.date) }));
  const allSlots = columns.flatMap((day) => day.slots);
  const rows = calendarRows(allSlots);
  const selected = selection
    ? allSlots.find(
        (slot) =>
          slot.date === selection.date && slot.slotId === selection.slotId,
      )
    : calendarDaySlots(overview, date).find((slot) => slot.booking) ||
      calendarDaySlots(overview, date)[0];
  const detailDate = selected?.date || date;
  const daySlots = calendarDaySlots(overview, detailDate);
  const bookedCount = daySlots.filter((slot) => slot.booking).length;
  const recurring =
    overview?.weeklySlotPlan?.[
      selected?.day || week.find((day) => day.date === date).day
    ]?.ranges || [];
  const changeDate = (value) => {
    if (value) {
      setDate(value);
      setSelection(null);
    }
  };
  return (
    <div className="availability-calendar">
      <header className="availability-page-heading">
        <div>
          <h2>Availability</h2>
          <p>View creator schedules and inspect individual sessions.</p>
        </div>
        <div className="availability-filters">
          <label>
            Influencer
            <select
              value={creatorId}
              disabled={listLoading || !influencers.length}
              onChange={(event) => {
                setCreatorId(event.target.value);
                setSelection(null);
              }}
            >
              {influencers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input
              type="date"
              value={date}
              onChange={(event) => changeDate(event.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={() => setReload((value) => value + 1)}
            aria-label="Refresh availability"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </header>
      {creator && (
        <section className="availability-creator">
          <div className="availability-identity">
            <span className="availability-avatar">
              {creator.name
                ?.split(' ')
                .map((word) => word[0])
                .slice(0, 2)
                .join('')}
            </span>
            <div>
              <h3>
                {creator.name}
                {creator.isVerified && <VerifiedBadge size="sm" />}
              </h3>
              <p>{creator.specialization}</p>
            </div>
          </div>
          <div className="availability-rate">
            <strong>${creator.hourlyRate ?? 0} / hour</strong>
            <p>{creator.category} · 60-minute sessions</p>
          </div>
        </section>
      )}
      {listError || error ? (
        <div className="dashboard-error" role="alert">
          {listError || error}
          <button type="button" onClick={() => setReload((value) => value + 1)}>
            Retry
          </button>
        </div>
      ) : listLoading || (creatorId && loading) ? (
        <LogoLoader variant="inline" label="Loading availability…" />
      ) : !creator ? (
        <div className="dashboard-empty">No influencers registered yet.</div>
      ) : (
        <div className="availability-layout">
          <section
            className="availability-schedule"
            aria-label="Session calendar"
          >
            <header className="availability-calendar-heading">
              <div>
                <h3>
                  {mode === 'week'
                    ? `${dateLabel(week[0].date, { month: 'long', day: 'numeric' })} – ${dateLabel(week[6].date, { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : dateLabel(date, {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                </h3>
                <p>India Standard Time · UTC+05:30</p>
              </div>
              <div
                className="availability-view-switch"
                aria-label="Calendar view"
              >
                {['week', 'day'].map((view) => (
                  <button
                    type="button"
                    key={view}
                    aria-pressed={mode === view}
                    onClick={() => {
                      setMode(view);
                      setSelection(null);
                    }}
                  >
                    {view === 'week' ? 'Week' : 'Day'}
                  </button>
                ))}
              </div>
            </header>
            <div className="availability-date-nav">
              <button
                type="button"
                aria-label={`Previous ${mode}`}
                onClick={() =>
                  changeDate(shiftCalendarDate(date, mode === 'week' ? -7 : -1))
                }
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() =>
                  changeDate(
                    new Date(Date.now() + 19800000).toISOString().slice(0, 10),
                  )
                }
              >
                Today
              </button>
              <button
                type="button"
                aria-label={`Next ${mode}`}
                onClick={() =>
                  changeDate(shiftCalendarDate(date, mode === 'week' ? 7 : 1))
                }
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <h4>
              {dateLabel(detailDate, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h4>
            <div className="availability-summary">
              <span>{daySlots.length} total slots</span>
              <span>{daySlots.length - bookedCount} available</span>
              <span>{bookedCount} booked</span>
            </div>
            <div className="availability-grid-scroll">
              <table
                className={`availability-grid ${mode === 'day' ? 'is-day' : ''}`}
              >
                <caption className="sr-only">
                  {mode} schedule in India Standard Time. Select a slot to
                  inspect its details.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="sr-only">Time</span>
                    </th>
                    {columns.map((day) => (
                      <th scope="col" key={day.date}>
                        <button
                          type="button"
                          aria-pressed={day.date === detailDate}
                          onClick={() => changeDate(day.date)}
                        >
                          <span>
                            {dateLabel(day.date, { weekday: 'short' })}
                          </span>
                          <strong>
                            {dateLabel(day.date, { day: 'numeric' })}
                          </strong>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((minutes) => (
                    <tr key={minutes}>
                      <th scope="row">{timeLabel(minutes)}</th>
                      {columns.map((day) => (
                        <td key={day.date}>
                          {day.slots
                            .filter(
                              (slot) =>
                                calendarMinutes(slot.slotId) === minutes,
                            )
                            .map((slot) => (
                              <button
                                type="button"
                                key={slot.slotId}
                                className={`availability-slot ${slot.booking ? 'is-booked' : 'is-available'}`}
                                aria-pressed={
                                  selected?.date === slot.date &&
                                  selected?.slotId === slot.slotId
                                }
                                aria-label={`${slot.booking ? 'Booked by ' + slot.booking.userName : 'Available'}: ${slot.label || slot.slotId}, ${slot.date} IST`}
                                onClick={() =>
                                  setSelection({
                                    date: slot.date,
                                    slotId: slot.slotId,
                                  })
                                }
                              >
                                {slot.booking
                                  ? slot.booking.userName?.split(' ')[0] ||
                                    'Booked'
                                  : slot.slotId.split(' - ')[0]}
                              </button>
                            ))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!rows.length && (
                <div className="availability-empty">
                  <CalendarDays size={26} />
                  <p>No slots scheduled for this {mode}.</p>
                </div>
              )}
            </div>
            <footer className="availability-legend">
              <span>
                <i className="available-dot" />
                Available
              </span>
              <span>
                <i className="booked-dot" />
                Booked
              </span>
            </footer>
          </section>
          <aside
            className="availability-details"
            aria-label="Session details"
            aria-live="polite"
          >
            <h3>Session details</h3>
            {selected ? (
              <>
                <span
                  className={`availability-state ${selected.booking ? 'is-booked' : 'is-available'}`}
                >
                  {selected.booking ? 'Booked' : 'Available'}
                </span>
                <h4>{selected.label || selected.slotId}</h4>
                <p>
                  {dateLabel(selected.date, {
                    weekday: 'short',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  · IST
                </p>
                {selected.booking ? (
                  <>
                    <dl>
                      <dt>Client</dt>
                      <dd>{selected.booking.userName}</dd>
                      <dt>Topic</dt>
                      <dd>
                        {selected.booking.topic || 'General consultation'}
                      </dd>
                      <dt>Fee</dt>
                      <dd>${selected.booking.price ?? 0}</dd>
                      <dt>Meeting</dt>
                      <dd>
                        {selected.booking.meetingType === 'video'
                          ? 'Video session'
                          : 'In person'}
                      </dd>
                    </dl>
                  </>
                ) : (
                  <p className="availability-open-note">
                    This slot is available in the creator’s schedule.
                  </p>
                )}
                <div className="availability-recurring">
                  <span>
                    <Clock size={14} />
                    Recurring availability
                  </span>
                  <strong>{selected.day}</strong>
                  {recurring.length ? (
                    recurring.map((range, index) => (
                      <p key={index}>
                        {range.start} – {range.end} IST
                      </p>
                    ))
                  ) : (
                    <p>No recurring availability.</p>
                  )}
                </div>
              </>
            ) : (
              <p>Select a slot in the calendar to view its details.</p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
