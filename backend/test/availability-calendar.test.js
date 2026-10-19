import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calendarWeek,
  shiftCalendarDate,
  calendarDaySlots,
  calendarRows,
} from '../../shared/availabilityCalendar.js';
test('calendar weeks use Monday through Sunday and cross month/year boundaries', () => {
  assert.equal(calendarWeek('2026-10-25')[0].date, '2026-10-19');
  assert.equal(calendarWeek('2026-10-19')[6].date, '2026-10-25');
  assert.equal(calendarWeek('2027-01-01')[0].date, '2026-12-28');
  assert.equal(shiftCalendarDate('2026-12-31', 1), '2027-01-01');
});
test('calendar distinguishes scheduled slots, active bookings, and cancelled bookings', () => {
  const overview = {
    weeklySlotPlan: {
      monday: {
        generatedSlots: [
          { slotId: '09:00 - 10:00' },
          { slotId: '10:00 - 11:00' },
        ],
      },
    },
    allBookings: [
      {
        id: '1',
        date: '2026-10-19',
        slot: '09:00 - 10:00',
        status: 'confirmed',
        userName: 'Alex',
      },
      {
        id: '2',
        date: '2026-10-19',
        slot: '10:00 - 11:00',
        status: 'cancelled',
      },
      {
        id: '3',
        date: '2026-10-19',
        slot: '16:07 - 17:00',
        status: 'confirmed',
        userName: 'Demo',
      },
      {
        id: '4',
        date: '2026-10-20',
        slot: '09:00 - 10:00',
        status: 'confirmed',
      },
    ],
  };
  const slots = calendarDaySlots(overview, '2026-10-19');
  assert.equal(slots.length, 3);
  assert.equal(slots[0].booking.userName, 'Alex');
  assert.equal(slots[1].booking, undefined);
  assert.equal(slots[2].booking.userName, 'Demo');
  const rows = calendarRows(slots);
  assert.ok(rows.includes(967));
  assert.ok(rows.includes(720));
  assert.deepEqual(calendarRows([]), []);
  assert.equal(calendarDaySlots(overview, '2026-10-20').length, 1);
});
