import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AiForzaParticleCanvas, ForzaStatus } from './AiForzaParticleCanvas';

interface AiForzaCallExperienceProps {
  onClose?: () => void;
}

type TurnRole = 'user' | 'model';

interface ConversationTurn {
  role: TurnRole;
  text: string;
}

const GREETING_TEXT = 'من هوش مصنوعی فورزا، مشاور تخصصی صنعت پیش هستم. بفرمایید چطور می‌توانم کمکتان کنم؟';

const faDigits = (v: string | number) =>
  String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

const formatTime = (s: number) => {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const r = (s % 60).toString().padStart(2, '0');
  return faDigits(`${m}:${r}`);
};

export const AiForzaCallExperience: React.FC<AiForzaCallExperienceProps> = ({ onClose }) => {
  const [status, setStatusState] = useState<ForzaStatus>('idle');
  const [userTranscript, setUserTranscript] = useState('');
  const [liveUserSubtitle, setLiveUserSubtitle] = useState('');
  const [aiResponseText, setAiResponseText] = useState('');
  const [displayedAiSubtitle, setDisplayedAiSubtitle] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  const statusRef = useRef<ForzaStatus>('idle');
  const audioLevelRef = useRef<number>(0);
  const historyRef = useRef<ConversationTurn[]>([]);
  const isSpeakingRef = useRef(false);
  const isBusyRef = useRef(false);

  // Audio Context & Nodes
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const elementAnalyserRef = useRef<AnalyserNode | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Speech Recognition & Silence Detection
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const accumulatedSpeechRef = useRef<string>('');
  const recognitionActiveRef = useRef(false);
  const levelDataRef = useRef<Uint8Array | null>(null);
  const levelLoopIdRef = useRef<number | null>(null);

  const setStatus = useCallback((s: ForzaStatus) => {
    statusRef.current = s;
    setStatusState(s);
  }, []);

  /* ---------------- Typewriter Animation for AI Subtitle ---------------- */
  useEffect(() => {
    if (!aiResponseText) {
      setDisplayedAiSubtitle('');
      return;
    }
    let i = 0;
    setDisplayedAiSubtitle('');
    const id = window.setInterval(() => {
      i += 2;
      setDisplayedAiSubtitle(aiResponseText.slice(0, i));
      if (i >= aiResponseText.length) window.clearInterval(id);
    }, 24);
    return () => window.clearInterval(id);
  }, [aiResponseText]);

  /* ---------------- Call Timer ---------------- */
  useEffect(() => {
    if (!isStarted) return;
    const timer = window.setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isStarted]);

  /* ---------------- Audio Level Visualizer Loop ---------------- */
  useEffect(() => {
    const tick = () => {
      const st = statusRef.current;
      let target = 0;
      if (isSpeakingRef.current) {
        target = 0.35 + 0.3 * Math.abs(Math.sin(Date.now() / 150));
      } else {
        const analyser = st === 'speaking' ? elementAnalyserRef.current : st === 'listening' ? micAnalyserRef.current : null;
        if (analyser) {
          if (!levelDataRef.current || levelDataRef.current.length !== analyser.fftSize) {
            levelDataRef.current = new Uint8Array(analyser.fftSize);
          }
          const buf = levelDataRef.current;
          analyser.getByteTimeDomainData(buf as Uint8Array<ArrayBuffer>);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / buf.length);
          target = Math.min(1, rms * 3.5) * (st === 'listening' ? 0.8 : 1);
        }
      }
      const cur = audioLevelRef.current;
      audioLevelRef.current = cur * 0.55 + target * 0.45;
    };
    levelLoopIdRef.current = window.setInterval(tick, 50);
    return () => {
      if (levelLoopIdRef.current) window.clearInterval(levelLoopIdRef.current);
    };
  }, []);

  /* ---------------- Audio Context Setup ---------------- */
  const ensureAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AC();
    }
    if (audioCtxRef.current.state === 'suspended') {
      void audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const ensureElementAnalyser = useCallback(() => {
    const ctx = ensureAudioCtx();
    const audio = audioElRef.current;
    if (!audio || elementAnalyserRef.current) return;
    try {
      const src = ctx.createMediaElementSource(audio);
      const an = ctx.createAnalyser();
      an.fftSize = 512;
      src.connect(an);
      an.connect(ctx.destination);
      elementAnalyserRef.current = an;
    } catch {
      /* element already connected */
    }
  }, [ensureAudioCtx]);

  const stopAudio = useCallback(() => {
    isSpeakingRef.current = false;
    try {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    } catch { /* noop */ }
    const a = audioElRef.current;
    if (a) {
      a.pause();
      a.removeAttribute('src');
      a.load();
    }
  }, []);

  const playAudioDataUrl = useCallback(
    (url: string) =>
      new Promise<void>((resolve, reject) => {
        const a = audioElRef.current;
        if (!a) {
          reject(new Error('no-audio'));
          return;
        }
        ensureAudioCtx();
        ensureElementAnalyser();
        const onEnded = () => {
          a.removeEventListener('ended', onEnded);
          a.removeEventListener('error', onError);
          resolve();
        };
        const onError = () => {
          a.removeEventListener('ended', onEnded);
          a.removeEventListener('error', onError);
          reject(new Error('play-error'));
        };
        a.addEventListener('ended', onEnded);
        a.addEventListener('error', onError);
        a.src = url;
        void a.play().catch(reject);
      }),
    [ensureAudioCtx, ensureElementAnalyser],
  );

  const speakBrowserFallback = useCallback(
    (text: string) =>
      new Promise<void>(resolve => {
        try {
          if (!('speechSynthesis' in window)) return resolve();
          const u = new SpeechSynthesisUtterance(text);
          u.lang = 'fa-IR';
          u.rate = 0.95;
          isSpeakingRef.current = true;
          u.onend = () => {
            isSpeakingRef.current = false;
            resolve();
          };
          u.onerror = () => {
            isSpeakingRef.current = false;
            resolve();
          };
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
        } catch {
          isSpeakingRef.current = false;
          resolve();
        }
      }),
    [],
  );

  const playAiSpeech = useCallback(
    async (text: string, directAudioBase64?: string) => {
      setStatus('speaking');
      isSpeakingRef.current = true;

      if (directAudioBase64) {
        try {
          await playAudioDataUrl(directAudioBase64);
          isSpeakingRef.current = false;
          return;
        } catch {
          /* fallback to TTS generation */
        }
      }

      try {
        const res = await fetch('/api/ai/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        const data = await res.json().catch(() => null);
        if (data?.audioBase64) {
          await playAudioDataUrl(data.audioBase64);
          isSpeakingRef.current = false;
          return;
        }
        throw new Error('no-tts-audio');
      } catch {
        await speakBrowserFallback(text);
        isSpeakingRef.current = false;
      }
    },
    [playAudioDataUrl, setStatus, speakBrowserFallback],
  );

  /* ---------------- Handle Conversational Turns with Gemini Backend ---------------- */
  const processUserSpeechTurn = useCallback(
    async (spokenText: string) => {
      const cleanText = spokenText.trim();
      if (!cleanText || isBusyRef.current) return;

      isBusyRef.current = true;
      setErrorMsg(null);
      setStatus('thinking');
      setUserTranscript(cleanText);
      setLiveUserSubtitle(cleanText);

      // Stop mic recognition while thinking and speaking
      if (recognitionRef.current && recognitionActiveRef.current) {
        try {
          recognitionRef.current.stop();
        } catch { /* noop */ }
        recognitionActiveRef.current = false;
      }

      historyRef.current.push({ role: 'user', text: cleanText });

      try {
        const res = await fetch('/api/ai/forza-live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: cleanText,
            history: historyRef.current.slice(-8),
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || 'خطا در ارتباط با سرور هوش مصنوعی');
        }

        const reply = data.text || 'پوزش می‌خواهم، متوجه نشدم. ممکن است دوباره بفرمایید؟';
        historyRef.current.push({ role: 'model', text: reply });
        setAiResponseText(reply);

        // Speak AI answer and display subtitle
        await playAiSpeech(reply, data.audioBase64);
      } catch (err: any) {
        const fallbackReply = 'در حال حاضر ارتباط با شبکه با اختلال مواجه شد. لطفاً پرسش خود را دوباره بیان فرمایید.';
        setAiResponseText(fallbackReply);
        await playAiSpeech(fallbackReply);
      } finally {
        isBusyRef.current = false;
        // Turn returns to user!
        setStatus('listening');
        accumulatedSpeechRef.current = '';
        setLiveUserSubtitle('');
        startContinuousRecognition();
      }
    },
    [playAiSpeech, setStatus],
  );

  /* ---------------- Silence & Pause Detection Trigger ---------------- */
  const handleUserSpeechPause = useCallback(() => {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    const currentSpoken = accumulatedSpeechRef.current.trim();
    if (currentSpoken.length >= 2 && statusRef.current === 'listening' && !isBusyRef.current) {
      void processUserSpeechTurn(currentSpoken);
    }
  }, [processUserSpeechTurn]);

  /* ---------------- Continuous Web Speech API Recognition ---------------- */
  const startContinuousRecognition = useCallback(() => {
    if (isBusyRef.current || isSpeakingRef.current) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Browser doesn't support Web Speech API
      setErrorMsg('برای تشخیص پیوسته گفتار، لطفاً از مرورگر گوگل کروم یا اج استفاده فرمایید.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch { /* noop */ }
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'fa-IR';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        recognitionActiveRef.current = true;
        if (statusRef.current !== 'thinking' && statusRef.current !== 'speaking') {
          setStatus('listening');
        }
      };

      recognition.onresult = (event: any) => {
        if (isBusyRef.current || isSpeakingRef.current) return;

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript + ' ';
          } else {
            interim += transcript;
          }
        }

        const currentCombined = (accumulatedSpeechRef.current + ' ' + final + ' ' + interim)
          .replace(/\s+/g, ' ')
          .trim();

        if (final) {
          accumulatedSpeechRef.current = (accumulatedSpeechRef.current + ' ' + final)
            .replace(/\s+/g, ' ')
            .trim();
        }

        // Live user subtitle updating instantly word-by-word
        if (currentCombined) {
          setLiveUserSubtitle(currentCombined);
        }

        // Reset the silence/pause timer on speech activity
        if (silenceTimerRef.current) {
          window.clearTimeout(silenceTimerRef.current);
        }

        // Intelligent pause detection: If the user pauses for 1200ms after speaking, trigger turn
        if (currentCombined.length > 2) {
          silenceTimerRef.current = window.setTimeout(() => {
            handleUserSpeechPause();
          }, 1250);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Normal silence, keep listening
          return;
        }
        if (event.error === 'not-allowed') {
          setErrorMsg('دسترسی به میکروفون مسدود است. لطفاً اجازه دسترسی میکروفون را فعال فرمایید.');
        }
      };

      recognition.onend = () => {
        recognitionActiveRef.current = false;
        // Auto-restart if we are still in listening phase and not busy/speaking
        if (statusRef.current === 'listening' && !isBusyRef.current && !isSpeakingRef.current) {
          try {
            recognition.start();
            recognitionActiveRef.current = true;
          } catch { /* noop */ }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      recognitionActiveRef.current = true;
    } catch {
      /* recognition already running */
    }
  }, [handleUserSpeechPause, setStatus]);

  /* ---------------- Start Call Interaction Session ---------------- */
  const initializeCall = useCallback(async () => {
    setIsStarted(true);
    ensureAudioCtx();
    setErrorMsg(null);
    setUserTranscript('');
    setLiveUserSubtitle('');
    historyRef.current = [];

    // Capture microphone for level visualization
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const ctx = ensureAudioCtx();
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 512;
      src.connect(an);
      micAnalyserRef.current = an;
    } catch {
      /* mic level stream optional */
    }

    // Step 1: AI introduces itself with voice and live subtitle
    setAiResponseText(GREETING_TEXT);
    historyRef.current.push({ role: 'model', text: GREETING_TEXT });
    await playAiSpeech(GREETING_TEXT);

    // Step 2: Turn passes to user, continuous listening begins automatically
    setStatus('listening');
    accumulatedSpeechRef.current = '';
    startContinuousRecognition();
  }, [ensureAudioCtx, playAiSpeech, setStatus, startContinuousRecognition]);

  /* Auto-initialize on mount */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void initializeCall();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [initializeCall]);

  /* Cleanup on unmount */
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch { /* noop */ }
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
      }
      stopAudio();
    };
  }, [stopAudio]);

  /* Handle ESC key to exit */
  useEffect(() => {
    if (!onClose) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Turn status label in Persian
  const getTurnStatusInfo = () => {
    switch (status) {
      case 'listening':
        return {
          title: 'نوبت شماست',
          subtitle: 'بفرمایید، در حال شنیدن صدای شما…',
          badgeColor: 'border-cyan-400/30 bg-cyan-950/40 text-cyan-200',
          dotColor: 'bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse',
        };
      case 'thinking':
        return {
          title: 'در حال تحلیل',
          subtitle: 'در حال پردازش و استخراج پاسخ مناسب…',
          badgeColor: 'border-amber-400/30 bg-amber-950/40 text-amber-200',
          dotColor: 'bg-amber-400 shadow-[0_0_10px_#fbbf24] animate-pulse',
        };
      case 'speaking':
        return {
          title: 'نوبت AI FORZA',
          subtitle: 'در حال پاسخ‌گویی صوتی…',
          badgeColor: 'border-orange-500/40 bg-orange-950/40 text-orange-200',
          dotColor: 'bg-orange-500 shadow-[0_0_12px_#f97316]',
        };
      default:
        return {
          title: 'آماده مکالمه',
          subtitle: 'در انتظار شروع گفتگو',
          badgeColor: 'border-white/15 bg-black/40 text-white/80',
          dotColor: 'bg-white/40',
        };
    }
  };

  const turnInfo = getTurnStatusInfo();

  return (
    <div
      dir="rtl"
      className="relative w-full h-full min-h-[100dvh] bg-[#07090e] text-white overflow-hidden select-none font-sans"
    >
      {/* 3D Particle Entity Canvas */}
      <div className="absolute inset-0">
        <AiForzaParticleCanvas statusRef={statusRef} audioLevelRef={audioLevelRef} />
      </div>

      {/* Atmospheric Cinematic Gradients */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-10" />

      {/* Hidden Audio Element for AI Speech Playback */}
      <audio ref={audioElRef} className="hidden" playsInline />

      {/* ---------------- Top Bar (Completely Icon-Free & Minimalist) ---------------- */}
      <header className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-6 sm:px-10 pt-6">
        {/* Brand & Identity */}
        <div className="flex flex-col">
          <div className="text-base sm:text-lg font-black tracking-[0.2em] text-white" dir="ltr">
            AI FORZA
          </div>
          <div className="text-[11px] text-cyan-300/60 font-medium tracking-wider">
            مشاور هوشمند صنعت پیش
          </div>
        </div>

        {/* Turn Status Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full border backdrop-blur-xl transition-all duration-300 ${turnInfo.badgeColor}`}
          >
            <span className={`w-2 h-2 rounded-full ${turnInfo.dotColor}`} />
            <span className="text-xs sm:text-sm font-bold tracking-wide">
              {turnInfo.title}
            </span>
            <span className="hidden md:inline text-[11px] opacity-70 border-r border-white/20 pr-2.5 mr-0.5">
              {turnInfo.subtitle}
            </span>
          </div>

          {/* Call Duration Counter */}
          <div
            className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-xs tabular-nums text-white/70 font-mono tracking-widest"
            dir="ltr"
          >
            {formatTime(callDuration)}
          </div>

          {/* End Call Button (Minimalist Text-Only, No Icons) */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-full bg-red-950/30 hover:bg-red-900/60 border border-red-500/30 hover:border-red-500/70 text-red-200 hover:text-white text-xs font-semibold backdrop-blur-xl transition-all cursor-pointer active:scale-95"
            >
              پایان گفتگو
            </button>
          )}
        </div>
      </header>

      {/* ---------------- Error Notification ---------------- */}
      {errorMsg && (
        <div className="absolute top-20 inset-x-0 z-30 flex justify-center px-6 ai-fade-up">
          <div className="flex items-center justify-between gap-4 max-w-lg w-full px-4 py-2.5 rounded-2xl bg-red-950/80 border border-red-500/40 backdrop-blur-xl text-xs text-red-100">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>
      )}

      {/* ---------------- Real-time Subtitles (User Live STT & AI Subtitles) ---------------- */}
      <div className="absolute bottom-24 sm:bottom-28 inset-x-0 z-20 flex flex-col items-center gap-3 px-6 pointer-events-none">
        {/* User's Spoken Speech (Real-Time Live Captioning) */}
        {liveUserSubtitle && (
          <div className="max-w-2xl w-full px-5 py-2.5 rounded-2xl bg-cyan-950/40 backdrop-blur-md border border-cyan-400/20 text-right ai-fade-up shadow-[0_0_20px_rgba(34,211,238,0.06)]">
            <div className="text-[11px] font-bold text-cyan-300 tracking-wider mb-1">
              شما (در حال بیان):
            </div>
            <p className="text-sm sm:text-base text-cyan-50 leading-7">
              {liveUserSubtitle}
            </p>
          </div>
        )}

        {/* AI FORZA's Spoken Response (Real-Time Subtitle) */}
        {displayedAiSubtitle && (
          <div className="max-w-2xl w-full px-6 py-4 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 text-right ai-fade-up shadow-[0_0_35px_rgba(0,0,0,0.7)]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-extrabold text-orange-400 tracking-widest">
                AI FORZA:
              </span>
              <span className="text-[10px] text-white/40">
                {status === 'speaking' ? 'در حال پخش گفتار…' : 'پاسخ ارائه شد'}
              </span>
            </div>
            <p
              className={`text-sm sm:text-base leading-8 text-white/95 font-medium ${
                status === 'speaking' || status === 'thinking' ? 'ai-caret' : ''
              }`}
            >
              {displayedAiSubtitle}
            </p>
          </div>
        )}
      </div>

      {/* ---------------- Bottom Dynamic Energy Visualizer (Icon-Free) ---------------- */}
      <footer className="absolute bottom-8 inset-x-0 z-20 flex flex-col items-center gap-2 px-6 pointer-events-none">
        {/* Sound Waveform Visualization */}
        <div className="h-6 flex items-center gap-[3px]" dir="ltr" aria-hidden="true">
          {Array.from({ length: 32 }).map((_, i) => (
            <span
              key={i}
              className={`ai-wave-bar ${
                status === 'speaking'
                  ? 'bg-gradient-to-t from-orange-600 to-amber-300'
                  : status === 'listening'
                    ? 'bg-gradient-to-t from-cyan-600 to-cyan-300'
                    : status === 'thinking'
                      ? 'bg-gradient-to-t from-amber-600 to-amber-300'
                      : 'bg-white/20'
              }`}
              style={{
                height: `${8 + ((i * 5) % 18)}px`,
                animationDelay: `${(i % 8) * 0.08}s`,
                animationDuration: status === 'thinking' ? '0.5s' : '0.85s',
              }}
            />
          ))}
        </div>

        {/* Turn Guide Hint */}
        <div className="text-[11px] text-white/45 tracking-wide text-center">
          {status === 'listening' && 'هر زمان صحبت خود را تمام یا مکس کنید، هوش مصنوعی خودکار شروع به پاسخ می‌کند'}
          {status === 'thinking' && 'هوش مصنوعی در حال تحلیل پرسش شماست…'}
          {status === 'speaking' && 'در حال گوش دادن به پاسخ هوش مصنوعی فورزا'}
          {status === 'idle' && 'آماده گفتگو'}
        </div>
      </footer>
    </div>
  );
};
