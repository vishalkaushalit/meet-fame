import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db.js';
import { ensureMeetingReminders, notificationFeed } from '../src/notifications.js';
import notificationRoutes from '../src/routes/notification.routes.js';
import bookingRoutes from '../src/routes/booking.routes.js';
const handler=(router,path,method)=>router.stack.find(layer=>layer.route?.path===path&&layer.route.methods[method]).route.stack.at(-1).handle;
const response=()=>({code:200,status(code){this.code=code;return this;},set(){return this;},json(body){this.body=body;return this;}});
const start=Date.parse('2026-10-19T12:00:00+05:30');
const makeData=()=>({users:[{id:'u1',name:'Client',email:'client@example.com'}],influencers:[{id:'i1',name:'Creator',hourlyRate:100,availability:{monday:{ranges:[{start:'12:00',end:'13:00'}]}}}],bookings:[],messages:[],notifications:[]});
test('booking alerts go to the influencer and reminders become visible exactly 15 minutes before for both roles',()=>{
 const read=db.read,write=db.write,now=Date.now;
 const data=makeData();db.read=()=>data;db.write=()=>true;Date.now=()=>start-3600000;
 try{
  const created=response();
  handler(bookingRoutes,'/','post')({session:{id:'u1',role:'user'},body:{userId:'u1',influencerId:'i1',date:'2026-10-19',slot:'12:00 - 13:00',slotLabel:'12–1 PM',meetingType:'video'}},created);
  assert.equal(created.code,201);
  assert.equal(data.notifications.length,3);
  assert.equal(notificationFeed(data,{id:'i1',role:'influencer'}).notifications[0].title,'New session booked');
  assert.equal(notificationFeed(data,{id:'u1',role:'user'}).notifications.length,0);
  assert.equal(ensureMeetingReminders(data),false);
  assert.equal(data.notifications.length,3);
  const user={id:'u1',role:'user'},creator={id:'i1',role:'influencer'};
  assert.equal(notificationFeed(data,user,start-900001).notifications.length,0);
  assert.equal(notificationFeed(data,user,start-900000).notifications[0].kind,'reminder');
  assert.equal(notificationFeed(data,creator,start-900000).notifications.filter(item=>item.kind==='reminder').length,1);
  assert.equal(notificationFeed(data,user,start-900001).nextDueAt,start-900000);
  assert.equal(notificationFeed(data,user,start+3600000).notifications.length,0);
  assert.equal(notificationFeed(data,{id:'stranger',role:'user'},start-900000).notifications.length,0);
  data.bookings[0].status='cancelled';
  assert.equal(notificationFeed(data,user,start-900000).notifications.length,0);
 }finally{db.read=read;db.write=write;Date.now=now;}
});
test('existing bookings get reminders once and read actions cannot alter another account',()=>{
 const read=db.read,write=db.write,now=Date.now;
 Date.now=()=>start-600000;
 const data=makeData();data.bookings.push({id:'old',date:'2026-10-19',slot:'12:00 - 13:00',status:'confirmed',userId:'u1',influencerId:'i1',userName:'Client',influencerName:'Creator'});
 db.read=()=>data;db.write=()=>true;
 try{
  const session={id:'u1',role:'user'};
  const feed=response();handler(notificationRoutes,'/','get')({session},feed);
  assert.equal(feed.body.notifications.length,1);
  assert.equal(feed.body.unreadCount,1);
  const own=feed.body.notifications[0];
  const wrong=response();handler(notificationRoutes,'/:id/read','put')({session:{id:'i1',role:'influencer'},params:{id:own.id}},wrong);assert.equal(wrong.code,404);
  handler(notificationRoutes,'/read-all','put')({session},response());
  assert.equal(notificationFeed(data,session).unreadCount,0);
  assert.equal(notificationFeed(data,{id:'i1',role:'influencer'}).unreadCount,1);
  assert.equal(ensureMeetingReminders(data),false);
  assert.equal(data.notifications.length,2);
  data.bookings[0].slot='13:00 - 14:00';
  assert.equal(notificationFeed(data,session).notifications.length,0);
 }finally{db.read=read;db.write=write;Date.now=now;}
});
