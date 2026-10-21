import { formatDate } from '../../../shared/dateFormat';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  X,
  Timer,
  MonitorUp,
  MonitorOff,
} from 'lucide-react';
import { api } from '../api';
import { callAvailability } from '../../../shared/bookingTime';

export default function VideoCall({ booking, role, onClose }) {
  const localVideo = useRef(null),
    remoteVideo = useRef(null);
  const runtime = useRef(null);
  const previewStream = useRef(null);
  const previewRequest = useRef(false);
  const mounted = useRef(true);
  const [previewing, setPreviewing] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('Ready to join');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [muted, setMuted] = useState(false),
    [cameraOff, setCameraOff] = useState(false);
  const closeButton = useRef(null);
  const counterpart =
    role === 'user' ? booking.influencerName : booking.userName;
  const cleanup = () => {
    const run = runtime.current;
    previewStream.current?.getTracks().forEach((track) => track.stop());
    previewStream.current = null;
    if (mounted.current) {
      setPreviewing(false);
      setConnected(false);
      setSharing(false);
    }
    if (!run) return;
    run.alive = false;
    clearTimeout(run.timer);
    clearTimeout(run.endTimer);
    clearInterval(run.countdownTimer);
    run.display?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    run.pc?.close();
    run.stream?.getTracks().forEach((track) => track.stop());
    if (localVideo.current) localVideo.current.srcObject = null;
    if (remoteVideo.current) remoteVideo.current.srcObject = null;
    if (run.sessionId)
      api.calls
        .request(booking.id, 'leave', { sessionId: run.sessionId }, run.token)
        .catch(() => {});
    runtime.current = null;
  };
  useEffect(() => {
    mounted.current = true;
    const prior = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const unload = () => cleanup();
    const endSession = () => {
      cleanup();
      onClose();
    };
    window.addEventListener('meetfame-session-ending', endSession);
    window.addEventListener('pagehide', unload);
    return () => {
      mounted.current = false;
      cleanup();
      window.removeEventListener('pagehide', unload);
      window.removeEventListener('meetfame-session-ending', endSession);
      document.body.style.overflow = overflow;
      prior?.focus();
    };
  }, []);

  const preview = async () => {
    if (previewRequest.current || previewStream.current) return;
    previewRequest.current = true;
    setPreviewBusy(true);
    setError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error('Camera preview requires HTTPS or localhost.');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (!mounted.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      previewStream.current = stream;
      if (localVideo.current) localVideo.current.srcObject = stream;
      setMuted(false);
      setCameraOff(false);
      setPreviewing(true);
      setStatus('Check your camera and microphone, then join.');
    } catch (error) {
      if (mounted.current)
        setError(
          error.name === 'NotAllowedError'
            ? 'Allow camera and microphone access in your browser, then try again.'
            : error.message,
        );
    } finally {
      previewRequest.current = false;
      if (mounted.current) setPreviewBusy(false);
    }
  };
  const stopSharing = async (run) => {
    if (!run?.display) return;
    const display = run.display;
    run.display = null;
    display.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    try {
      const sender = run.pc
        ?.getSenders()
        .find((item) => item.track?.kind === 'video');
      if (sender) await sender.replaceTrack(run.stream.getVideoTracks()[0]);
    } catch {
      if (run.alive)
        setError('Could not restore the camera. Leave and rejoin.');
    }
    if (run.alive) {
      if (localVideo.current) localVideo.current.srcObject = run.stream;
      setSharing(false);
    }
  };
  const shareScreen = async () => {
    const run = runtime.current;
    if (!run?.alive || shareBusy) return;
    setShareBusy(true);
    try {
      if (run.display) {
        await stopSharing(run);
        return;
      }
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      if (!run.alive) {
        display.getTracks().forEach((track) => track.stop());
        return;
      }
      const sender = run.pc
        ?.getSenders()
        .find((item) => item.track?.kind === 'video');
      if (!sender) {
        display.getTracks().forEach((track) => track.stop());
        throw new Error(
          'Wait for the other participant to connect before presenting.',
        );
      }
      try {
        await sender.replaceTrack(display.getVideoTracks()[0]);
      } catch (error) {
        display.getTracks().forEach((track) => track.stop());
        throw error;
      }
      if (!run.alive) {
        display.getTracks().forEach((track) => track.stop());
        return;
      }
      run.display = display;
      display.getVideoTracks()[0].onended = () => stopSharing(run);
      if (localVideo.current) localVideo.current.srcObject = display;
      setSharing(true);
      setError('');
    } catch (error) {
      if (run.alive && error.name !== 'NotAllowedError')
        setError(
          error.message || 'Screen sharing is unavailable in this browser.',
        );
    } finally {
      if (mounted.current) setShareBusy(false);
    }
  };

  const join = async () => {
    if (runtime.current) return;
    const availability = callAvailability(booking);
    if (!availability.allowed) {
      setError(
        `${availability.label}. Calls are available only during the booked slot (IST).`,
      );
      return;
    }
    setConnected(false);
    setSharing(false);
    setSecondsLeft(null);
    setJoining(true);
    setError('');
    setStatus('Requesting camera and microphone…');
    const run = {
      alive: true,
      token: localStorage.getItem('meetfame_token'),
      pc: null,
      stream: null,
      peerId: null,
      sessionId: null,
      after: 0,
      pending: [],
      failures: 0,
      restartAttempts: 0,
    };
    runtime.current = run;
    const send = (type, payload) =>
      api.calls.request(booking.id, 'signal', {
        sessionId: run.sessionId,
        to: run.peerId,
        type,
        payload,
      });
    const resetPeer = () => {
      run.pc?.close();
      run.pc = null;
      run.pending = [];
      setConnected(false);
      if (remoteVideo.current) remoteVideo.current.srcObject = null;
    };
    const createPeer = () => {
      const pc = new RTCPeerConnection({ iceServers: run.iceServers });
      run.pc = pc;
      for (const track of run.stream.getTracks())
        pc.addTrack(
          track.kind === 'video' && run.display
            ? run.display.getVideoTracks()[0]
            : track,
          run.stream,
        );
      pc.ontrack = (event) => {
        if (!run.alive || run.pc !== pc) return;
        if (remoteVideo.current) {
          remoteVideo.current.srcObject =
            event.streams[0] || new MediaStream([event.track]);
          remoteVideo.current
            .play()
            .catch(() =>
              setError('Click the remote video to enable playback.'),
            );
        }
      };
      pc.onicecandidate = (event) => {
        if (event.candidate && run.alive && run.pc === pc)
          send('candidate', event.candidate.toJSON()).catch((error) => {
            if (run.alive) setError(error.message);
          });
      };
      pc.onconnectionstatechange = () => {
        if (!run.alive || run.pc !== pc) return;
        if (pc.connectionState === 'connected') {
          setConnected(true);
          run.restartAttempts = 0;
          setStatus('Connected');
          setError('');
        } else if (pc.connectionState === 'failed') {
          setConnected(false);
          setStatus('Reconnecting…');
          if (
            role === 'user' &&
            run.restartAttempts++ < 2 &&
            pc.signalingState === 'stable'
          ) {
            (async () => {
              await pc.setLocalDescription(
                await pc.createOffer({ iceRestart: true }),
              );
              if (run.alive && run.pc === pc)
                await send('offer', {
                  type: pc.localDescription.type,
                  sdp: pc.localDescription.sdp,
                });
            })().catch((error) => {
              if (run.alive) setError(error.message);
            });
          } else
            setError(
              'Connection failed. Leave and rejoin, or try another network.',
            );
        } else if (pc.connectionState === 'disconnected') {
          setConnected(false);
          setStatus('Connection interrupted. Trying to reconnect…');
        }
      };
      return pc;
    };
    const poll = async () => {
      if (!run.alive) return;
      try {
        const result = await api.calls.request(booking.id, 'poll', {
          sessionId: run.sessionId,
          after: run.after,
        });
        if (!run.alive) return;
        run.failures = 0;
        if (result.peerId !== run.peerId) {
          resetPeer();
          run.peerId = result.peerId;
          setStatus(run.peerId ? 'Connecting…' : `Waiting for ${counterpart}…`);
          if (run.peerId) {
            const pc = createPeer();
            if (role === 'user') {
              await pc.setLocalDescription(await pc.createOffer());
              await send('offer', {
                type: pc.localDescription.type,
                sdp: pc.localDescription.sdp,
              });
            }
          }
        }
        for (const signal of result.signals) {
          if (!run.alive || !run.pc || signal.from !== run.peerId) continue;
          const pc = run.pc;
          if (signal.type === 'offer') {
            await pc.setRemoteDescription(signal.payload);
            await pc.setLocalDescription(await pc.createAnswer());
            await send('answer', {
              type: pc.localDescription.type,
              sdp: pc.localDescription.sdp,
            });
          } else if (signal.type === 'answer')
            await pc.setRemoteDescription(signal.payload);
          else if (signal.type === 'candidate')
            run.pending.push(signal.payload);
          if (pc.remoteDescription)
            while (run.pending.length)
              await pc.addIceCandidate(run.pending.shift());
        }
        run.after = result.sequence;
      } catch (error) {
        if (!run.alive) return;
        setError(
          error.message || 'Signaling connection interrupted. Retrying…',
        );
        if (
          [401, 403, 404, 409].includes(error.status) ||
          ++run.failures >= 5
        ) {
          cleanup();
          setJoined(false);
          setJoining(false);
          setStatus('Call ended');
          return;
        }
      }
      if (run.alive) run.timer = setTimeout(poll, 2000);
    };
    try {
      if (
        !window.isSecureContext ||
        !navigator.mediaDevices?.getUserMedia ||
        !window.RTCPeerConnection
      )
        throw new Error(
          'Video calls require a supported browser on HTTPS or localhost.',
        );
      run.stream =
        previewStream.current ||
        (await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        }));
      previewStream.current = null;
      if (!run.alive) {
        run.stream.getTracks().forEach((track) => track.stop());
        return;
      }
      if (localVideo.current) localVideo.current.srcObject = run.stream;
      const result = await api.calls.request(booking.id, 'join');
      run.sessionId = result.sessionId;
      run.iceServers = result.iceServers;
      if (!run.alive) {
        api.calls
          .request(booking.id, 'leave', { sessionId: run.sessionId }, run.token)
          .catch(() => {});
        return;
      }
      // Use the server's remaining duration instead of trusting the browser clock.
      const remaining = result.endsAt - result.serverNow;
      if (!Number.isFinite(remaining) || remaining <= 0)
        throw new Error('Your booked session has ended.');
      const deadline = performance.now() + remaining;
      const updateCountdown = () => {
        if (run.alive)
          setSecondsLeft(
            Math.max(0, Math.ceil((deadline - performance.now()) / 1000)),
          );
      };
      updateCountdown();
      run.countdownTimer = setInterval(updateCountdown, 250);
      run.endTimer = setTimeout(() => {
        if (!run.alive) return;
        cleanup();
        setJoined(false);
        setJoining(false);
        setStatus('Session ended');
        setError('Your booked time slot has ended.');
      }, remaining);
      setJoined(true);
      setJoining(false);
      setMuted(!run.stream.getAudioTracks().some((track) => track.enabled));
      setCameraOff(!run.stream.getVideoTracks().some((track) => track.enabled));
      setStatus(`Waiting for ${counterpart}…`);
      poll();
    } catch (error) {
      if (!run.alive) return;
      cleanup();
      setJoining(false);
      setJoined(false);
      setStatus('Unable to join');
      setError(
        error.name === 'NotAllowedError'
          ? 'Camera or microphone permission was denied. Allow access in your browser and try again.'
          : error.name === 'NotFoundError'
            ? 'A camera and microphone are required to join.'
            : error.message,
      );
    }
  };
  const toggle = (kind) => {
    const tracks =
      (runtime.current?.stream || previewStream.current)
        ?.getTracks()
        .filter((track) => track.kind === kind) || [];
    for (const track of tracks) track.enabled = !track.enabled;
    if (kind === 'audio') setMuted((value) => !value);
    else setCameraOff((value) => !value);
  };
  return createPortal(
    <div className="video-call-overlay">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-call-title"
        className="video-call-dialog"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            cleanup();
            onClose();
          }
          if (event.key === 'Tab') {
            const controls = [
              ...event.currentTarget.querySelectorAll(
                'button:not(:disabled), video[tabindex]',
              ),
            ];
            const first = controls[0],
              last = controls.at(-1);
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <header>
          <div>
            <h2 id="video-call-title">Session with {counterpart}</h2>
            <p>
              {formatDate(booking.date)} · <span className="time-slot-badge">{booking.slotLabel || booking.slot} IST</span>
            </p>
          </div>
          <button
            ref={closeButton}
            aria-label="Leave and close call"
            onClick={() => {
              cleanup();
              onClose();
            }}
          >
            <X size={21} />
          </button>
        </header>
        <div
          className={`video-call-stage ${!joined && previewing ? 'video-call-preview' : ''}`}
        >
          {!connected && (
            <div className="video-call-placeholder">
              <Video size={36} />
              <strong>
                {!joined
                  ? previewing
                    ? 'Ready when you are'
                    : 'Check your camera before joining'
                  : status}
              </strong>
              <span>
                {joined
                  ? counterpart
                  : 'Your camera and microphone stay under your control.'}
              </span>
            </div>
          )}
          {joined && (
            <span className="video-call-participant">
              {counterpart}
              {connected ? ' · Connected' : ' · Connecting'}
            </span>
          )}
          {joined && secondsLeft !== null && secondsLeft <= 60 && (
            <div
              className="video-call-countdown"
              role="timer"
              aria-label={`${secondsLeft} seconds remaining in session`}
            >
              <Timer size={16} aria-hidden="true" />
              <span>
                Session ends in{' '}
                <strong>
                  {Math.floor(secondsLeft / 60)}:
                  {String(secondsLeft % 60).padStart(2, '0')}
                </strong>
              </span>
            </div>
          )}
          <video
            ref={remoteVideo}
            autoPlay
            playsInline
            style={{ visibility: connected ? 'visible' : 'hidden' }}
            controls={false}
            onClick={() => remoteVideo.current?.play().catch(() => {})}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                remoteVideo.current?.play().catch(() => {});
              }
            }}
            tabIndex={0}
            aria-label={`${counterpart}'s video`}
          />
          <div className="video-call-local">
            <video
              ref={localVideo}
              autoPlay
              playsInline
              muted
              aria-label="Your video preview"
            />
            <span>
              You{sharing ? ' · Presenting' : cameraOff ? ' · Camera off' : ''}
              {muted ? ' · Muted' : ''}
            </span>
          </div>
        </div>
        <p role="status" className="video-call-status">
          {status}
        </p>
        {error && (
          <p role="alert" className="video-call-error">
            {error}
          </p>
        )}
        <footer>
          {!joined && (
            <button
              disabled={joining || previewBusy || previewing}
              onClick={preview}
            >
              <Video size={18} />
              {previewBusy
                ? 'Opening camera…'
                : previewing
                  ? 'Preview ready'
                  : 'Camera preview'}
            </button>
          )}
          {!joined && previewing && (
            <>
              <button
                aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
                aria-pressed={muted}
                onClick={() => toggle('audio')}
              >
                {muted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button
                aria-label={cameraOff ? 'Turn camera on' : 'Turn camera off'}
                aria-pressed={cameraOff}
                onClick={() => toggle('video')}
              >
                {cameraOff ? <VideoOff size={20} /> : <Video size={20} />}
              </button>
            </>
          )}
          {!joined ? (
            <button
              disabled={joining || previewBusy}
              className="video-call-join"
              onClick={join}
            >
              <Video size={18} />
              {joining ? 'Joining…' : 'Join call'}
            </button>
          ) : (
            <>
              <button
                aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
                title={muted ? 'Unmute' : 'Mute'}
                aria-pressed={muted}
                onClick={() => toggle('audio')}
              >
                {muted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button
                aria-label={cameraOff ? 'Turn camera on' : 'Turn camera off'}
                title={cameraOff ? 'Camera on' : 'Camera off'}
                aria-pressed={cameraOff}
                onClick={() => toggle('video')}
              >
                {cameraOff ? <VideoOff size={20} /> : <Video size={20} />}
              </button>
              {navigator.mediaDevices?.getDisplayMedia && (
                <button
                  disabled={shareBusy || (!connected && !sharing)}
                  aria-pressed={sharing}
                  onClick={shareScreen}
                >
                  {sharing ? <MonitorOff size={20} /> : <MonitorUp size={20} />}
                  {sharing ? 'Stop presenting' : 'Present screen'}
                </button>
              )}
              <button
                className="video-call-leave"
                onClick={() => {
                  cleanup();
                  onClose();
                }}
              >
                <PhoneOff size={20} />
                Leave
              </button>
            </>
          )}
        </footer>
      </section>
    </div>,
    document.body,
  );
}
