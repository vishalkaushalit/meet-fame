import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

export default function IntroVideo({ influencer, card = false }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [playbackVisible, setPlaybackVisible] = useState(false);
  useEffect(() => {
    if (!playing || !playbackVisible) return;
    const timer = setTimeout(() => setPlaybackVisible(false), 2500);
    return () => clearTimeout(timer);
  }, [playing, playbackVisible]);
  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) { video.pause(); return; }
    setFailed(false);
    try { await video.play(); setStarted(true); setPlaybackVisible(false); }
    catch { setFailed(true); }
  };
  const [failed, setFailed] = useState(false);
  if (!influencer.introVideoUrl) return null;
  const apiBase = import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD ? '/api' : 'http://localhost:5001/api');
  const src = influencer.introVideoUrl.startsWith('/uploads/')
    ? `${apiBase.replace(/\/api\/?$/, '')}${influencer.introVideoUrl}`
    : influencer.introVideoUrl;
  const firstName = influencer.name?.trim().split(/\s+/)[0] || 'your creator';
  return (
    <div className="my-3">
      {!card && <p className="mb-2 text-xs font-semibold text-slate-300">Meet {influencer.name}</p>}
      <div className={`relative overflow-hidden rounded-2xl bg-slate-950 ${card ? 'aspect-square' : 'aspect-video'}`}>
        <video key={src} ref={videoRef} playsInline preload="none" src={src} poster={influencer.avatar}
          onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); setStarted(false); }} onError={() => setFailed(true)}
          onVolumeChange={(e) => { setVolume(e.currentTarget.volume); setMuted(e.currentTarget.muted); }}
          aria-label={`Introduction from ${influencer.name}`}
          className="h-full w-full object-contain">
          Your browser does not support video playback.
        </video>
        {card && !started && (

          <button type="button" onClick={togglePlayback}
            aria-label={`Play introduction from ${influencer.name}`}
            className="absolute inset-0 block h-full w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-purple">
            {influencer.avatar && <img src={influencer.avatar} alt="" className="h-full w-full object-cover" />}
            <span className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-black/10 to-transparent" aria-hidden="true" />
            <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/60 bg-white/15 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-white/25">
                <Play className="ml-0.5 h-5 w-5" strokeWidth={1.5} />
              </span>
            </span>
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-4 text-xs text-white">
              <span className="font-semibold">Meet {firstName}</span>
              <span className="rounded-lg bg-slate-950/70 px-2 py-1 text-[10px]">Intro video</span>
            </span>
          </button>
        )}
        {(!card || started) && (
          <>
            <button type="button" aria-label="Show playback control"
              onClick={() => setPlaybackVisible((visible) => !visible)}
              className="absolute inset-0 h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-purple" />
            <button type="button" onClick={togglePlayback} aria-label={playing ? 'Pause video' : 'Play video'}
              onFocus={() => setPlaybackVisible(true)}
              className={`absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/15 text-white shadow-lg backdrop-blur-md transition-opacity focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${!playing || playbackVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
              {playing ? <Pause className="h-5 w-5" strokeWidth={1.5} /> : <Play className="ml-0.5 h-5 w-5" strokeWidth={1.5} />}
            </button>
          </>
        )}
        {(!card || started) && (
          <div role="group" aria-label="Video controls" className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/90 to-transparent px-3 pb-3 pt-6 text-white">
            <div className="relative ml-auto flex items-center gap-2"
              onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setVolumeOpen(false); }}
              onKeyDown={(e) => { if (e.key === 'Escape') { setVolumeOpen(false); e.currentTarget.querySelector('button')?.focus(); } }}>
              <button type="button" aria-label="Adjust video volume" aria-expanded={volumeOpen}
                onClick={() => setVolumeOpen((open) => !open)}
                className="rounded-full p-2 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
                {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              {volumeOpen && <div className="absolute bottom-full right-0 mb-2 flex h-32 w-10 items-center justify-center rounded-xl border border-white/15 bg-slate-950/95 py-3 shadow-lg backdrop-blur-md">
              <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
                aria-label="Video volume" aria-orientation="vertical" aria-valuetext={`${Math.round((muted ? 0 : volume) * 100)} percent`}
                onChange={(e) => {
                  const video = videoRef.current;
                  if (!video) return;
                  video.volume = Number(e.target.value);
                  video.muted = false;
                }} style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                className="h-full w-4 cursor-pointer accent-white" />
              </div>}
            </div>
          </div>
        )}
      </div>
      {failed && <p role="alert" className="mt-2 text-xs text-rose-400">This video could not be loaded. Please try again later.</p>}
    </div>
  );
}
