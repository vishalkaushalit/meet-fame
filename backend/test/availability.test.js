import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAvailability } from '../../shared/availability.js';
import { generateDaySlots } from '../src/slotUtils.js';
import { Influencer } from '../src/models/Influencer.js';
test('daily availability is one object and preserves multiple time ranges and breaks',async ()=>{
 const ranges=[{start:'09:00',end:'12:00'},{start:'17:00',end:'20:00'}];
 const schedule=normalizeAvailability({monday:ranges});
 assert.deepEqual(schedule.monday,{ranges});
 assert.deepEqual(schedule.sunday,{ranges:[]});
 assert.deepEqual(normalizeAvailability(schedule),schedule);
 const slots=generateDaySlots(schedule.monday);
 assert.equal(slots.length,6);
 assert.ok(!slots.some(slot=>slot.startTime==='12:00'));
 assert.deepEqual(slots,generateDaySlots(ranges));
 const creator=new Influencer({name:'Creator',email:'creator@example.com',phone:'123',password:'test',specialization:'Coaching',category:'Business',availability:schedule});
 await creator.validate();
 assert.equal(creator.availability.monday.ranges.length,2);
});
