import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bookingWindow, callAvailability } from '../../shared/bookingTime.js';
test('slot windows use IST and include only the start boundary', () => {
 const booking={date:'2026-10-22',slot:'10:00 - 11:00'};
 const {start,end}=bookingWindow(booking);
 assert.equal(new Date(start).toISOString(),'2026-10-22T04:30:00.000Z');
 assert.equal(callAvailability(booking,start-1).allowed,false);
 assert.equal(callAvailability(booking,start).allowed,true);
 assert.equal(callAvailability(booking,end-1).allowed,true);
 assert.equal(callAvailability(booking,end).allowed,false);
 assert.equal(bookingWindow({date:'2026-02-30',slot:booking.slot}),null);
 assert.equal(bookingWindow({...booking,slot:'11:00 - 10:00'}),null);
 assert.equal(bookingWindow({...booking,slot:'invalid'}),null);
 assert.equal(bookingWindow({...booking,slot:'23:00 - 24:00'}).end,Date.parse('2026-10-23T00:00:00+05:30'));
});
