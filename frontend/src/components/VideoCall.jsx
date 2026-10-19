import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Video, VideoOff, Mic, MicOff, PhoneOff, X, Timer } from 'lucide-react';
import { api } from '../api';
import { callAvailability } from '../../../shared/bookingTime';

export default function VideoCall({ booking, role, onClose }) {
  const localVideo = useRef(null), remoteVideo = useRef(null);
  const runtime = useRef(null);
  const [status, setStatus] = useState('Ready to join');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [muted, setMuted] = useState(false), [cameraOff, setCameraOff] = useState(false);
  const closeButton = useRef(null);
  const counterpart = role === 'user' ? booking.influencerName : booking.userName;
  const cleanup = () => {
    const run = runtime.current;
    if (!run) return;
    run.alive = false;
    clearTimeout(run.timer);
    clearTimeout(run.endTimer);
    clearInterval(run.countdownTimer);
    run.pc?.close();
    run.stream?.getTracks().forEach(track => track.stop());
    if (localVideo.current) localVideo.current.srcObject = null;
    if (remoteVideo.current) remoteVideo.current.srcObject = null;
    if (run.sessionId) api.calls.request(booking.id, 'leave', { sessionId: run.sessionId }).catch(() => {});
    runtime.current = null;
  };
  useEffect(() => {
    const prior = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const unload = () => cleanup();
    window.addEventListener('pagehide', unload);
    return () => { cleanup(); window.removeEventListener('pagehide', unload); document.body.style.overflow = overflow; prior?.focus(); };
  }, []);

  const join = async () => {
    if (runtime.current) return;
    const availability = callAvailability(booking);
    if (!availability.allowed) { setError(`${availability.label}. Calls are available only during the booked slot (IST).`); return; }
    setSecondsLeft(null);
    setJoining(true); setError(''); setStatus('Requesting camera and microphone…');
    const run = { alive: true, pc: null, stream: null, peerId: null, sessionId: null, after: 0, pending: [], failures: 0 };
    runtime.current = run;
    const send = (type, payload) => api.calls.request(booking.id, 'signal', { sessionId: run.sessionId, to: run.peerId, type, payload });
    const resetPeer = () => {
      run.pc?.close(); run.pc = null; run.pending = [];
      if (remoteVideo.current) remoteVideo.current.srcObject = null;
    };
    const createPeer = () => {
      const pc = new RTCPeerConnection({ iceServers: run.iceServers });
      run.pc = pc;
      for (const track of run.stream.getTracks()) pc.addTrack(track, run.stream);
      pc.ontrack = event => {
        if (remoteVideo.current) {
          remoteVideo.current.srcObject = event.streams[0];
          remoteVideo.current.play().catch(() => setError('Click the remote video to enable playback.'));
        }
      };
      pc.onicecandidate = event => {
        if (event.candidate && run.alive) send('candidate', event.candidate.toJSON()).catch(error => { if (run.alive) setError(error.message); });
      };
      pc.onconnectionstatechange = () => {
        if (!run.alive || run.pc !== pc) return;
        if (pc.connectionState === 'connected') { setStatus('Connected'); setError(''); }
        else if (pc.connectionState === 'failed') setError('Unable to connect. Leave and rejoin the call. A TURN relay may be required on this network.');
        else if (pc.connectionState === 'disconnected') setStatus('Connection interrupted…');
      };
      return pc;
    };
    const poll = async () => {
      if (!run.alive) return;
      try {
        const result = await api.calls.request(booking.id, 'poll', { sessionId: run.sessionId, after: run.after });
        if (!run.alive) return;
        run.failures = 0;
        if (result.peerId !== run.peerId) {
          resetPeer(); run.peerId = result.peerId;
          setStatus(run.peerId ? 'Connecting…' : `Waiting for ${counterpart}…`);
          if (run.peerId) {
            const pc = createPeer();
            if (role === 'user') {
              await pc.setLocalDescription(await pc.createOffer());
              await send('offer', { type: pc.localDescription.type, sdp: pc.localDescription.sdp });
            }
          }
        }
        for (const signal of result.signals) {
          if (!run.alive || !run.pc || signal.from !== run.peerId) continue;
          const pc = run.pc;
          if (signal.type === 'offer') {
            await pc.setRemoteDescription(signal.payload);
            await pc.setLocalDescription(await pc.createAnswer());
            await send('answer', { type: pc.localDescription.type, sdp: pc.localDescription.sdp });
          } else if (signal.type === 'answer') await pc.setRemoteDescription(signal.payload);
          else if (signal.type === 'candidate') run.pending.push(signal.payload);
          if (pc.remoteDescription) while (run.pending.length) await pc.addIceCandidate(run.pending.shift());
        }
        run.after = result.sequence;
      } catch (error) {
        if (!run.alive) return;
        setError(error.message || 'Signaling connection interrupted. Retrying…');
        if ([401,403,404,409].includes(error.status) || ++run.failures >= 5) {
          cleanup(); setJoined(false); setJoining(false); setStatus('Call ended'); return;
        }
      }
      if (run.alive) run.timer = setTimeout(poll, 2000);
    };
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) throw new Error('Video calls require a supported browser on HTTPS or localhost.');
      run.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (!run.alive) { run.stream.getTracks().forEach(track => track.stop()); return; }
      if (localVideo.current) localVideo.current.srcObject = run.stream;
      const result = await api.calls.request(booking.id, 'join');
      run.sessionId = result.sessionId; run.iceServers = result.iceServers;
      if (!run.alive) { api.calls.request(booking.id, 'leave', { sessionId: run.sessionId }).catch(() => {}); return; }
      // Use the server's remaining duration instead of trusting the browser clock.
      const remaining = result.endsAt - result.serverNow;
      if (!Number.isFinite(remaining) || remaining <= 0) throw new Error('Your booked session has ended.');
      const deadline = performance.now() + remaining;
      const updateCountdown = () => {
        if (run.alive) setSecondsLeft(Math.max(0, Math.ceil((deadline - performance.now()) / 1000)));
      };
      updateCountdown();
      run.countdownTimer = setInterval(updateCountdown, 250);
      run.endTimer = setTimeout(() => {
        if (!run.alive) return;
        cleanup(); setJoined(false); setJoining(false); setStatus('Session ended'); setError('Your booked time slot has ended.');
      }, remaining);
      setJoined(true); setJoining(false); setMuted(false); setCameraOff(false);
      setStatus(`Waiting for ${counterpart}…`);
      poll();
    } catch (error) {
      if (!run.alive) return;
      cleanup(); setJoining(false); setJoined(false); setStatus('Unable to join');
      setError(error.name === 'NotAllowedError' ? 'Camera or microphone permission was denied. Allow access in your browser and try again.' : error.name === 'NotFoundError' ? 'A camera and microphone are required to join.' : error.message);
    }
  };
  const toggle = kind => {
    const tracks = runtime.current?.stream?.getTracks().filter(track => track.kind === kind) || [];
    for (const track of tracks) track.enabled = !track.enabled;
    if (kind === 'audio') setMuted(value => !value); else setCameraOff(value => !value);
  };
  return createPortal(<div className="video-call-overlay"><section role="dialog" aria-modal="true" aria-labelledby="video-call-title" className="video-call-dialog" onKeyDown={event => {
    if (event.key === 'Escape') { cleanup(); onClose(); }
    if (event.key === 'Tab') {
      const controls = [...event.currentTarget.querySelectorAll('button:not(:disabled), video[tabindex]')];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }}>
    <header><div><h2 id="video-call-title">Session with {counterpart}</h2><p>{booking.date} · {booking.slotLabel || booking.slot} IST</p></div><button ref={closeButton} aria-label="Leave and close call" onClick={() => { cleanup(); onClose(); }}><X size={21} /></button></header>
    <div className="video-call-stage">
      {joined && secondsLeft !== null && secondsLeft <= 60 && <div className="video-call-countdown" role="timer" aria-label={`${secondsLeft} seconds remaining in session`}><Timer size={16} aria-hidden="true" /><span>Session ends in <strong>{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</strong></span></div>}
      <video ref={remoteVideo} autoPlay playsInline controls tabIndex={0} aria-label={`${counterpart}'s video`} /><div className="video-call-local"><video ref={localVideo} autoPlay playsInline muted aria-label="Your video preview" /><span>You{cameraOff ? ' · Camera off' : ''}</span></div></div>
    <p role="status" className="video-call-status">{status}</p>{error && <p role="alert" className="video-call-error">{error}</p>}
    <footer>{!joined ? <button disabled={joining} className="video-call-join" onClick={join}><Video size={18} />{joining ? 'Joining…' : 'Join call'}</button> : <><button aria-label={muted ? 'Unmute microphone' : 'Mute microphone'} title={muted ? 'Unmute' : 'Mute'} aria-pressed={muted} onClick={() => toggle('audio')}>{muted ? <MicOff size={20} /> : <Mic size={20} />}</button><button aria-label={cameraOff ? 'Turn camera on' : 'Turn camera off'} title={cameraOff ? 'Camera on' : 'Camera off'} aria-pressed={cameraOff} onClick={() => toggle('video')}>{cameraOff ? <VideoOff size={20} /> : <Video size={20} />}</button><button className="video-call-leave" onClick={() => { cleanup(); onClose(); }}><PhoneOff size={20} />Leave</button></>}</footer>
  </section></div>, document.body);
}
