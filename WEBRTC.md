# Booked video sessions

Users open **My Bookings** and influencers open their **Bookings** tab, then select **Join call** on a confirmed video booking. The call dialog requests camera and microphone access only after pressing its Join call button. Both participants must join the same booking. Use two separate browser profiles or devices for testing.

The browser sends media through WebRTC. Authenticated HTTP polling exchanges offers, answers, and ICE candidates every two seconds. Only that booking's user and influencer can access its room; administrators cannot join. Cancelled/completed bookings and restricted accounts cannot join or continue signaling. Access is limited to the booked date and slot in India time (IST, UTC+05:30), including the start and excluding the end. The backend validates the window on every join, poll, and signal request. The client closes the peer connection and stops media when the server-provided remaining duration expires.

## Configuration

- Serve the website over HTTPS, or use localhost during development.
- For Vercel or multiple backend instances, configure a working `MONGODB_URI`. Call-room state uses MongoDB with optimistic concurrency and a two-hour TTL. Local development without MongoDB uses process-local rooms and requires a single backend process. Rooms disappear when that process restarts.
- Set `TURN_URL`, `TURN_USERNAME`, and `TURN_CREDENTIAL` on the backend for relay connectivity. `TURN_URL` accepts comma-separated TURN/TURNS URLs. Supply your own TURN service; credentials are sent only to authenticated booking participants. Rotate them as appropriate for the relay service. A public STUN server is included, but STUN alone cannot connect every pair of networks.
- Each participant may have one active tab per booking. Abandoned sessions expire after 45 seconds; closing normally sends a leave request immediately.

## Controls and verification

The dialog provides microphone mute, camera toggle, remote playback controls, and leave. Leaving stops captured media, closes the peer connection, and releases the session. A participant who leaves can rejoin; the remaining participant returns to waiting.

Run `node --test backend/test/*.test.js` and `npm --prefix frontend run build`. Automated tests cover signaling access, role isolation, session ownership, duplicate joins, message delivery, and leave. Actual camera/audio playback and TURN connectivity require a two-device browser test; those are not verified by the automated tests.
