import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Bot,
  Send,
  User,
  ChevronLeft,
  X,
  RotateCcw,
  Calculator,
  Camera,
  PhoneCall,
  FileText,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Info,
  Layers,
  ArrowUpRight,
  Sliders,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  Activity,
  Cpu,
  Mic,
  MicOff,
  Zap,
  Volume2,
  VolumeX,
  Square,
  Play,
  Loader2,
  Radio,
  Trash2,
  AlertCircle,
  AudioWaveform,
  RefreshCw,
} from 'lucide-react';
import { STORE_ASSETS } from '../../assets/images';
import { apiUrl } from '../../config/apiConfig';
import { toPersianDigits } from '../../utils/formatters';
import { analyzePersianSentenceCompletion, calculateAudioMetrics } from '../../utils/silenceDetector';
import { renderEngineeringMarkdown } from '../../utils/engineeringMarkdown';
import { AiForzaFaceToFaceModal } from './AiForzaFaceToFaceModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onOpenVisualSearch?: () => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  isVoice?: boolean;
  suggestedAction?: {
    label: string;
    link?: string;
  };
  category?: string;
}

const QUICK_TOPICS = [
  {
    id: 'ceramic',
    label: '🔥 خطوط کوره کاشی و سرامیک',
    prompt: 'تسمه و رولیک مناسب برای کوره رولری پخت کاشی با دمای بالا چیست؟',
  },
  {
    id: 'calc',
    label: '📐 محاسبه طول تسمه و پولی',
    prompt: 'فرمول دقیق محاسبه طول اسمی تسمه بین دو پولی با فاصله محوری مشخص چیست؟',
  },
  {
    id: 'timing',
    label: '⚙️ تسمه تایمینگ PU و کلروپرن',
    prompt: 'تفاوت تسمه تایمینگ پلی‌یورتان با کورد استیل در مقایسه با رابر کلروپرن چیست؟',
  },
  {
    id: 'brands',
    label: '🇩🇪 محصولات انحصاری SWR و FORZA',
    prompt: 'شرایط خرید، گارانتی و استعلام قیمت برندهای انحصاری SWR آلمان و FORZA ایتالیا چیست؟',
  },
  {
    id: 'textile',
    label: '🧵 ماشین‌آلات نساجی و ریسندگی',
    prompt: 'تسمه‌های تخت انتقال قدرت بالا و تسمه‌های ضدالکتریسیته ساکن برای دستگاه‌های نساجی',
  },
  {
    id: 'rfq',
    label: '📋 صدور پیش‌فاکتور رسمی',
    prompt: 'نحوه دریافت پیش‌فاکتور رسمی مودیان با ارزش افزوده برای خرید عمده کارخانه',
  },
];

export const AiConsultModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialQuery,
  onOpenVisualSearch,
}) => {
  const navigate = useNavigate();
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<Record<string, 'up' | 'down'>>({});
  const [activeMobileTab, setActiveMobileTab] = useState<'chat' | 'calc'>('chat');
  const [isFaceToFaceOpen, setIsFaceToFaceOpen] = useState(false);
  const openedFromDeskRef = useRef(false);
  const streamAbortControllerRef = useRef<AbortController | null>(null);

  const handleSyncMessageFromForza = (userText: string, aiText: string) => {
    const timeNow = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => {
      // Deduplicate if already present
      const last = prev[prev.length - 1];
      if (last && last.text === aiText) {
        return prev;
      }
      return [
        ...prev,
        {
          id: 'u-' + Date.now(),
          sender: 'user',
          text: userText,
          time: timeNow,
          isVoice: true,
        },
        {
          id: 'ai-' + (Date.now() + 1),
          sender: 'ai',
          text: aiText,
          time: timeNow,
        },
      ];
    });
  };

  // Handle progressive streaming tokens from Face-to-Face / Gemini Live WebSocket
  const handleLiveStreamChunkFromForza = (responseId: string, userText: string, chunkText: string, isFullReplace = false) => {
    const timeNow = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const targetAiId = `ai-${responseId}`;
    const targetUserId = `u-${responseId}`;

    setMessages(prev => {
      const aiIdx = prev.findIndex(m => m.id === targetAiId);
      if (aiIdx >= 0) {
        const updated = [...prev];
        const prevText = updated[aiIdx].text || '';
        updated[aiIdx] = {
          ...updated[aiIdx],
          text: isFullReplace ? chunkText : prevText + chunkText,
        };
        return updated;
      } else {
        const userMsg: Message = {
          id: targetUserId,
          sender: 'user',
          text: userText || 'پرسش صوتی زنده',
          time: timeNow,
          isVoice: true,
        };
        const aiMsg: Message = {
          id: targetAiId,
          sender: 'ai',
          text: chunkText,
          time: timeNow,
        };
        return [...prev, userMsg, aiMsg];
      }
    });
  };

  useEffect(() => {
    const handleOpenForza = () => {
      openedFromDeskRef.current = false;
      setIsFaceToFaceOpen(true);
    };
    const handleForzaSync = (e: any) => {
      if (e?.detail?.userText && e?.detail?.aiText) {
        handleSyncMessageFromForza(e.detail.userText, e.detail.aiText);
      }
    };
    const handleForzaStreamChunk = (e: any) => {
      if (e?.detail?.chunk || e?.detail?.textSoFar) {
        const respId = e.detail.responseId || 'live-stream';
        const userText = e.detail.userText || '';
        const chunk = e.detail.chunk || '';
        const textSoFar = e.detail.textSoFar;
        if (textSoFar !== undefined) {
          handleLiveStreamChunkFromForza(respId, userText, textSoFar, true);
        } else {
          handleLiveStreamChunkFromForza(respId, userText, chunk, false);
        }
      }
    };
    const handleUserRequest = (e: any) => {
      const q = e?.detail?.query;
      if (q && typeof q === 'string' && q.trim()) {
        handleSend(q.trim(), true);
      }
    };

    window.addEventListener('open-forza-face-to-face', handleOpenForza);
    window.addEventListener('ai-forza-sync-message', handleForzaSync);
    window.addEventListener('ai-forza-stream-chunk', handleForzaStreamChunk);
    window.addEventListener('ai-forza-user-request', handleUserRequest);
    return () => {
      window.removeEventListener('open-forza-face-to-face', handleOpenForza);
      window.removeEventListener('ai-forza-sync-message', handleForzaSync);
      window.removeEventListener('ai-forza-stream-chunk', handleForzaStreamChunk);
      window.removeEventListener('ai-forza-user-request', handleUserRequest);
    };
  }, []);

  // Text-To-Speech (TTS) State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const lastAudioLevelUpdateRef = useRef(0);

  useEffect(() => {
    if (isFaceToFaceOpen) {
      // Release Desk's mic and audio loops completely when Face-to-Face is active
      stopRecordingCleanly();
      stopCurrentAudio();
      clearSilenceTimers();
    }
  }, [isFaceToFaceOpen]);
  const [isLiveVoiceMode, setIsLiveVoiceMode] = useState(true);
  const isLiveVoiceModeRef = useRef(true);
  isLiveVoiceModeRef.current = isLiveVoiceMode;

  const [voiceTurnState, setVoiceTurnState] = useState<
    'idle' | 'listening' | 'userSpeaking' | 'silenceWaiting' | 'transcribing' | 'consulting' | 'aiSpeaking' | 'interrupted'
  >('idle');
  const voiceTurnStateRef = useRef(voiceTurnState);
  voiceTurnStateRef.current = voiceTurnState;

  const [silenceProgress, setSilenceProgress] = useState(0); // 0 to 100%
  const [silenceReason, setSilenceReason] = useState<string>('');

  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const targetSilenceMsRef = useRef<number>(1500);
  const hasUserSpokenRef = useRef(false);
  const lastVocalTimestampRef = useRef(0);
  const ambientNoiseFloorRef = useRef(0.015);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micAnimFrameRef = useRef<number | null>(null);

  // Prime browser audio context to allow seamless automated voice playback
  const primeAudioContext = () => {
    try {
      if (typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
          }
        }
        const silentAudio = new Audio(
          'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'
        );
        silentAudio.play().catch(() => {});
      }
    } catch {}
  };

  const getOrCreateAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
    return audioContextRef.current;
  };

  // Speech-To-Text (STT / Voice Input) State
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  isRecordingRef.current = isRecording;

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const liveTranscriptRef = useRef('');
  liveTranscriptRef.current = liveTranscript;

  const [audioLevels, setAudioLevels] = useState<number[]>([25, 45, 75, 55, 85, 60, 30]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const liveSpeechRecognitionRef = useRef<any>(null);
  const recognizedTextRef = useRef<string>('');

  // Interactive Belt Length Calculator State (Side Tool)
  const [calcC, setCalcC] = useState<string>('500'); // Center distance mm
  const [calcD, setCalcD] = useState<string>('200'); // Large pulley mm
  const [calcd, setCalcd] = useState<string>('100'); // Small pulley mm
  const [calcResult, setCalcResult] = useState<{
    length: number;
    ratio: number;
    recommendedSections: string[];
  } | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `درود و احترام! من **مشاور هوشمند مهندسی و بازرگانی هایپر صنعت اطلس** هستم.

در زمینه انتخاب تخصصی انواع **تسمه‌های انتقال قدرت** (V-Belt، تایمینگ، شیاردار، جوشی PU)، **پولی‌های تیپرلاک FORZA**، **بلبرینگ‌ها** و قطعات خطوط تولید کارخانجات، چه کمکی می‌توانم به شما بکنم؟

🎙️ *مکالمه صوتی زنده با قابلیت تشخیص خودکار سکوت و مکث فعال است؛ می‌توانید با لمس دکمه نارنجی میکروفون، پرسش خود را به صورت صوتی بفرمایید. به محض اتمام صحبت، سیستم به طور خودکار پاسخ را به صورت گفتاری و متنی ارائه می‌دهد.*`,
      time: 'هم‌اکنون',
      suggestedAction: {
        label: 'مشاهده دسته‌بندی محصولات',
        link: '/category/industrial-belts',
      },
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const stopCurrentAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPlayingAudioId(null);
    setAudioLoadingId(null);
  };

  const clearSilenceTimers = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (silenceProgressIntervalRef.current) {
      clearInterval(silenceProgressIntervalRef.current);
      silenceProgressIntervalRef.current = null;
    }
    setSilenceProgress(0);
  };

  const stopRecordingCleanly = () => {
    clearSilenceTimers();

    if (micAnimFrameRef.current) {
      cancelAnimationFrame(micAnimFrameRef.current);
      micAnimFrameRef.current = null;
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }

    if (audioStreamRef.current) {
      try {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      } catch {}
      audioStreamRef.current = null;
    }

    if (liveSpeechRecognitionRef.current) {
      try {
        liveSpeechRecognitionRef.current.stop();
      } catch {}
      liveSpeechRecognitionRef.current = null;
    }

    setIsRecording(false);
    isRecordingRef.current = false;
    setRecordingSeconds(0);
    setVoiceTurnState('idle');
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(scrollToBottom, 100);
      if (initialQuery) {
        handleSend(initialQuery);
      }
    } else {
      document.body.style.overflow = '';
      stopCurrentAudio();
      stopRecordingCleanly();
      setMicError(null);
    }
    return () => {
      document.body.style.overflow = '';
      stopCurrentAudio();
      stopRecordingCleanly();
    };
  }, [isOpen, initialQuery]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, isRecording, isTranscribing, silenceProgress]);

  // Live calculation of belt length
  const calculateBelt = () => {
    const C = parseFloat(calcC);
    const D = parseFloat(calcD);
    const d = parseFloat(calcd);
    if (!C || !D || !d || C <= 0 || D <= 0 || d <= 0) return;

    // Formula: L = 2C + 1.57(D + d) + (D - d)^2 / (4C)
    const L = 2 * C + 1.570796 * (D + d) + Math.pow(D - d, 2) / (4 * C);
    const ratio = D / d;

    const sections: string[] = [];
    if (d >= 63 && d < 90) sections.push('SPZ', 'SPA');
    else if (d >= 90 && d < 140) sections.push('SPA', 'SPB');
    else if (d >= 140 && d < 224) sections.push('SPB', 'SPC');
    else sections.push('SPC', '8M / 14M');

    setCalcResult({
      length: Math.round(L),
      ratio: Number(ratio.toFixed(2)),
      recommendedSections: sections,
    });
  };

  useEffect(() => {
    calculateBelt();
  }, [calcC, calcD, calcd]);

  // =========================================================================
  // 1. SPEECH-TO-TEXT WITH LINGUISTIC & ACOUSTIC SILENCE DETECTION
  // =========================================================================
  const startVoiceRecording = async (isAutoResume = false) => {
    primeAudioContext();

    // If already recording and user clicked manually -> finish & send
    if (isRecording && !isAutoResume) {
      finishVoiceRecordingAndSend();
      return;
    }

    stopCurrentAudio();
    clearSilenceTimers();
    setMicError(null);
    setLiveTranscript('');
    liveTranscriptRef.current = '';
    recognizedTextRef.current = '';
    audioChunksRef.current = [];
    hasUserSpokenRef.current = false;
    setSilenceProgress(0);
    setSilenceReason('');
    setVoiceTurnState('listening');

    let stream = audioStreamRef.current;

    // Check if we need to request fresh media stream
    if (!stream || !stream.active) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
        } else {
          const legacyGetMedia =
            (navigator as any).getUserMedia ||
            (navigator as any).webkitGetUserMedia ||
            (navigator as any).mozGetUserMedia;
          if (legacyGetMedia) {
            stream = await new Promise<MediaStream>((resolve, reject) => {
              legacyGetMedia.call(navigator, { audio: true }, resolve, reject);
            });
          }
        }
      } catch (permErr: any) {
        console.warn('Microphone permission notice:', permErr);
        setIsRecording(false);
        isRecordingRef.current = false;
        setVoiceTurnState('idle');
        const isIframe = typeof window !== 'undefined' && window.self !== window.top;
        if (isIframe) {
          setMicError(
            'مرورگر کروم پنجره تایید میکروفون (Allow) را فقط در تب مستقل باز می‌کند؛ لطفاً روی دکمه «باز کردن در تب مستقیم» کلیک کنید تا پنجره Allow ظاهر شود.'
          );
        } else {
          setMicError(
            'لطفاً در نوار آدرس بالای مرورگر، روی آیکون میکروفون/قفل کلیک کرده و دسترسی را روی Allow بگذارید.'
          );
        }
        return;
      }
    }

    if (!stream) {
      setMicError('میکروفون در دسترس نیست. لطفاً اجازه دسترسی به میکروفون را در مرورگر فعال کنید.');
      setIsRecording(false);
      isRecordingRef.current = false;
      setVoiceTurnState('idle');
      return;
    }

    audioStreamRef.current = stream;

    // A. Setup Web Audio AnalyserNode for Acoustic RMS & Voice Activity Detection (VAD)
    try {
      const audioCtx = getOrCreateAudioContext();
      if (audioCtx) {
        if (micSourceRef.current) {
          try {
            micSourceRef.current.disconnect();
          } catch {}
        }
        const micSource = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.35;
        micSource.connect(analyser);

        micSourceRef.current = micSource;
        analyserRef.current = analyser;

        const timeBuffer = new Uint8Array(analyser.frequencyBinCount);
        const freqBuffer = new Uint8Array(analyser.frequencyBinCount);

        const monitorAudioMetricsLoop = () => {
          if (!analyserRef.current || !isRecordingRef.current) {
            return;
          }

          const metrics = calculateAudioMetrics(analyserRef.current, timeBuffer, freqBuffer);
          const rms = metrics.rms;
          const voiceBandEnergy = metrics.voiceBandEnergy;

          // Adaptive background noise floor
          ambientNoiseFloorRef.current = ambientNoiseFloorRef.current * 0.98 + rms * 0.02;
          const speechThreshold = Math.max(0.028, ambientNoiseFloorRef.current * 1.5);
          const isAcousticallySpeaking = rms > speechThreshold || voiceBandEnergy > 0.11;

          // Reactive waveform heights (throttled to 16fps to prevent React render saturation)
          const nowTs = Date.now();
          if (nowTs - lastAudioLevelUpdateRef.current > 60) {
            lastAudioLevelUpdateRef.current = nowTs;
            const normLevel = Math.min(100, Math.max(10, Math.round(rms * 280)));
            setAudioLevels([
              Math.min(100, Math.round(normLevel * 0.45 + 10)),
              Math.min(100, Math.round(normLevel * 0.75 + 15)),
              Math.min(100, Math.round(normLevel * 1.1 + 20)),
              Math.min(100, Math.round(normLevel * 0.95 + 15)),
              Math.min(100, Math.round(normLevel * 1.2 + 20)),
              Math.min(100, Math.round(normLevel * 0.7 + 10)),
              Math.min(100, Math.round(normLevel * 0.4 + 5)),
            ]);
          }

          // Real-time Interruption (Barge-in): Customer speaks while AI is talking
          if (isAcousticallySpeaking && currentAudioRef.current && !currentAudioRef.current.paused) {
            stopCurrentAudio();
            hasUserSpokenRef.current = true;
            setVoiceTurnState('userSpeaking');
          }

          if (isAcousticallySpeaking) {
            hasUserSpokenRef.current = true;
            lastVocalTimestampRef.current = Date.now();
            setVoiceTurnState('userSpeaking');

            // Reset silence timer on active vocalization
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
            if (silenceProgressIntervalRef.current) {
              clearInterval(silenceProgressIntervalRef.current);
              silenceProgressIntervalRef.current = null;
            }
            setSilenceProgress(0);
          } else if (hasUserSpokenRef.current && isRecordingRef.current) {
            // Customer has spoken and has now paused
            if (!silenceTimerRef.current) {
              const currentText = recognizedTextRef.current.trim() || liveTranscriptRef.current.trim();
              const analysis = analyzePersianSentenceCompletion(currentText);
              const pauseMs = analysis.recommendedPauseMs;
              targetSilenceMsRef.current = pauseMs;

              setVoiceTurnState('silenceWaiting');
              setSilenceReason(analysis.detectedReason);

              const startTime = Date.now();
              setSilenceProgress(0);

              silenceProgressIntervalRef.current = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const pct = Math.min(100, Math.round((elapsed / pauseMs) * 100));
                setSilenceProgress(pct);
              }, 40);

              silenceTimerRef.current = setTimeout(() => {
                if (silenceProgressIntervalRef.current) {
                  clearInterval(silenceProgressIntervalRef.current);
                  silenceProgressIntervalRef.current = null;
                }
                setSilenceProgress(100);
                // Trigger automated turn dispatch on silence
                finishVoiceRecordingAndSend();
              }, pauseMs);
            }
          }

          micAnimFrameRef.current = requestAnimationFrame(monitorAudioMetricsLoop);
        };

        if (micAnimFrameRef.current) {
          cancelAnimationFrame(micAnimFrameRef.current);
        }
        micAnimFrameRef.current = requestAnimationFrame(monitorAudioMetricsLoop);
      }
    } catch (e) {
      console.warn('AudioContext VAD initialization error:', e);
    }

    // B. MediaRecorder for raw audio capture & backup
    try {
      let mimeType = 'audio/webm;codecs=opus';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
          else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
          else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
          else mimeType = '';
        }

        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = e => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = async () => {
          const immediateText = recognizedTextRef.current.trim() || liveTranscriptRef.current.trim() || inputQuery.trim();
          if (immediateText) {
            setIsTranscribing(false);
            handleSend(immediateText, true);
            return;
          }

          if (audioChunksRef.current.length > 0) {
            const recordedBlob = new Blob(audioChunksRef.current, {
              type: recorder.mimeType || 'audio/webm',
            });
            await processRecordedVoice(recordedBlob);
          } else {
            setIsTranscribing(false);
            setVoiceTurnState('idle');
          }
        };

        recorder.start(100);
      }
    } catch (recErr) {
      console.warn('MediaRecorder init error:', recErr);
    }

    // C. Web Speech API with real-time Persian speech parsing
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (SpeechRecognition) {
      try {
        const liveRecognition = new SpeechRecognition();
        liveRecognition.lang = 'fa-IR';
        liveRecognition.continuous = true;
        liveRecognition.interimResults = true;
        liveRecognition.maxAlternatives = 1;

        liveRecognition.onresult = (event: any) => {
          let fullTranscript = '';
          for (let i = 0; i < event.results.length; ++i) {
            fullTranscript += event.results[i][0].transcript;
          }
          const cleaned = fullTranscript.trim();
          if (cleaned) {
            setLiveTranscript(cleaned);
            liveTranscriptRef.current = cleaned;
            recognizedTextRef.current = cleaned;
            setInputQuery(cleaned);
            hasUserSpokenRef.current = true;
            lastVocalTimestampRef.current = Date.now();
            setVoiceTurnState('userSpeaking');

            // Reset existing silence timer with new linguistic tokens
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
            if (silenceProgressIntervalRef.current) {
              clearInterval(silenceProgressIntervalRef.current);
              silenceProgressIntervalRef.current = null;
            }
            setSilenceProgress(0);

            // Dynamic linguistic sentence completion analysis
            const analysis = analyzePersianSentenceCompletion(cleaned);
            setSilenceReason(analysis.detectedReason);
            const pauseMs = analysis.recommendedPauseMs;
            targetSilenceMsRef.current = pauseMs;

            const startT = Date.now();
            silenceProgressIntervalRef.current = setInterval(() => {
              const elapsed = Date.now() - startT;
              const pct = Math.min(100, Math.round((elapsed / pauseMs) * 100));
              setSilenceProgress(pct);
            }, 40);

            silenceTimerRef.current = setTimeout(() => {
              if (silenceProgressIntervalRef.current) {
                clearInterval(silenceProgressIntervalRef.current);
                silenceProgressIntervalRef.current = null;
              }
              setSilenceProgress(100);
              finishVoiceRecordingAndSend();
            }, pauseMs);
          }
        };

        liveRecognition.onerror = (e: any) => {
          if (e?.error !== 'no-speech' && e?.error !== 'aborted') {
            console.warn('SpeechRecognition notice:', e?.error);
          }
        };

        liveRecognition.onend = () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            try {
              liveRecognition.start();
            } catch {}
          }
        };

        liveRecognition.start();
        liveSpeechRecognitionRef.current = liveRecognition;
      } catch (err) {
        console.warn('SpeechRecognition start error:', err);
      }
    }

    setIsRecording(true);
    isRecordingRef.current = true;
    setRecordingSeconds(0);

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);
  };

  const cancelVoiceRecording = () => {
    clearSilenceTimers();
    audioChunksRef.current = [];
    recognizedTextRef.current = '';
    setLiveTranscript('');
    liveTranscriptRef.current = '';
    stopRecordingCleanly();
    setVoiceTurnState('idle');
  };

  const finishVoiceRecordingAndSend = () => {
    primeAudioContext();
    clearSilenceTimers();

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (micAnimFrameRef.current) {
      cancelAnimationFrame(micAnimFrameRef.current);
      micAnimFrameRef.current = null;
    }

    const quickText = recognizedTextRef.current.trim() || liveTranscriptRef.current.trim() || inputQuery.trim();

    if (liveSpeechRecognitionRef.current) {
      try {
        liveSpeechRecognitionRef.current.stop();
      } catch {}
      liveSpeechRecognitionRef.current = null;
    }

    setIsRecording(false);
    isRecordingRef.current = false;

    // If recognized text is available, dispatch immediately to Gemini!
    if (quickText) {
      setVoiceTurnState('consulting');
      handleSend(quickText, true);
      return;
    }

    setVoiceTurnState('transcribing');
    setIsTranscribing(true);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.requestData();
        }
        mediaRecorderRef.current.stop();
      } catch {
        setIsTranscribing(false);
        setVoiceTurnState('idle');
      }
    } else {
      setIsTranscribing(false);
      setVoiceTurnState('idle');
    }
  };

  const processRecordedVoice = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setVoiceTurnState('transcribing');

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string) || '';

        try {
          const res = await fetch(apiUrl('/api/ai/stt'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Data,
              mimeType: audioBlob.type || 'audio/webm',
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.text && data.text.trim()) {
              setIsTranscribing(false);
              setVoiceTurnState('consulting');
              handleSend(data.text.trim(), true);
              return;
            }
          }
        } catch (apiErr) {
          console.warn('STT API error, checking live transcript:', apiErr);
        }

        const fallbackText = recognizedTextRef.current.trim() || liveTranscriptRef.current.trim() || inputQuery.trim();
        if (fallbackText) {
          setIsTranscribing(false);
          setVoiceTurnState('consulting');
          handleSend(fallbackText, true);
        } else {
          setIsTranscribing(false);
          setVoiceTurnState('idle');
          setMicError('متن گفتار شما تشخیص داده نشد. لطفاً مجدداً صحبت فرمایید یا سوال خود را تایپ کنید.');
        }
      };
    } catch {
      setIsTranscribing(false);
      setVoiceTurnState('idle');
      const fallbackText = recognizedTextRef.current.trim() || liveTranscriptRef.current.trim() || inputQuery.trim();
      if (fallbackText) {
        handleSend(fallbackText, true);
      }
    }
  };

  // =========================================================================
  // 2. TEXT-TO-SPEECH (TTS ENGINE WITH HIGH-FIDELITY PERSIAN MALE VOICE)
  // =========================================================================
  const playAiSpeech = async (
    text: string,
    messageId: string,
    preloadedAudio?: string,
    preloadedMime?: string
  ) => {
    if (playingAudioId === messageId) {
      stopCurrentAudio();
      return;
    }

    stopCurrentAudio();
    setAudioLoadingId(messageId);
    setVoiceTurnState('aiSpeaking');

    const handlePlayAudioElement = (audioSrc: string) => {
      const audio = new Audio(audioSrc);
      currentAudioRef.current = audio;

      audio.onplay = () => {
        setAudioLoadingId(null);
        setPlayingAudioId(messageId);
        setVoiceTurnState('aiSpeaking');
      };

      audio.onended = () => {
        setPlayingAudioId(null);
        currentAudioRef.current = null;
        setVoiceTurnState('idle');
        // Seamless Hands-Free Continuous Voice Loop!
        if (isLiveVoiceModeRef.current) {
          setTimeout(() => {
            startVoiceRecording(true);
          }, 600);
        }
      };

      audio.onerror = e => {
        console.warn('Audio playback error, falling back to browser speech:', e);
        fallbackBrowserSpeech(text, messageId);
      };

      audio.play().catch(err => {
        console.warn('Audio play notice:', err);
        fallbackBrowserSpeech(text, messageId);
      });
    };

    if (preloadedAudio) {
      const audioSrc = preloadedAudio.startsWith('data:')
        ? preloadedAudio
        : `data:${preloadedMime || 'audio/mp3'};base64,${preloadedAudio}`;
      handlePlayAudioElement(audioSrc);
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/ai/tts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'fa-IR-FaridNeural' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.audioBase64) {
          const audioSrc = data.audioBase64.startsWith('data:')
            ? data.audioBase64
            : `data:${data.mimeType || 'audio/mp3'};base64,${data.audioBase64}`;
          handlePlayAudioElement(audioSrc);
          return;
        }
      }
    } catch (err) {
      console.warn('TTS API error, attempting fallback:', err);
    }

    fallbackBrowserSpeech(text, messageId);
  };

  const fallbackBrowserSpeech = (text: string, messageId: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setAudioLoadingId(null);
      setPlayingAudioId(null);
      setVoiceTurnState('idle');
      return;
    }

    window.speechSynthesis.cancel();

    const voiceList = window.speechSynthesis.getVoices();
    const faVoice = voiceList.find(
      v =>
        v.lang.toLowerCase().startsWith('fa') ||
        v.name.toLowerCase().includes('persian') ||
        v.name.toLowerCase().includes('farsi')
    );

    if (!faVoice) {
      console.warn('No native Persian voice found in browser speech synthesis. Aborting foreign pronunciation.');
      setAudioLoadingId(null);
      setPlayingAudioId(null);
      setVoiceTurnState('idle');
      return;
    }

    const cleanText = text
      .replace(/#{1,6}\s?/g, '')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/\*{1,3}/g, '')
      .replace(/_{1,3}/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[$@%^&~|]/g, '')
      .replace(/^[\s*•\-–—]+\s*/gm, ' ')
      .replace(/[\n\r]+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      setAudioLoadingId(null);
      setPlayingAudioId(null);
      setVoiceTurnState('idle');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'fa-IR';
    utterance.rate = 0.95;
    utterance.pitch = 0.95;
    utterance.voice = faVoice;

    utterance.onend = () => {
      setPlayingAudioId(null);
      currentAudioRef.current = null;
      setVoiceTurnState('idle');
      if (isLiveVoiceModeRef.current) {
        setTimeout(() => {
          startVoiceRecording(true);
        }, 600);
      }
    };

    utterance.onerror = () => {
      setPlayingAudioId(null);
      currentAudioRef.current = null;
      setVoiceTurnState('idle');
    };

    setAudioLoadingId(null);
    setPlayingAudioId(messageId);
    setVoiceTurnState('aiSpeaking');
    window.speechSynthesis.speak(utterance);
  };

  // =========================================================================
  // 3. SEND MESSAGE HANDLER (LOGS ALL SPOKEN WORDS IN CHAT DESK / TABLE)
  // =========================================================================
  const handleSend = async (queryText?: string, isVoiceSent = false) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend) return;

    if (streamAbortControllerRef.current) {
      streamAbortControllerRef.current.abort();
      streamAbortControllerRef.current = null;
    }
    const abortCtrl = new AbortController();
    streamAbortControllerRef.current = abortCtrl;

    const userMessageId = 'u-' + Date.now();
    const uniqueResponseId = `resp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const timeNow = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    const newUserMessage: Message = {
      id: userMessageId,
      sender: 'user',
      text: textToSend,
      time: timeNow,
      isVoice: isVoiceSent,
    };

    const aiMessageId = `ai-${uniqueResponseId}`;
    const initialAiMessage: Message = {
      id: aiMessageId,
      sender: 'ai',
      text: '',
      time: timeNow,
    };

    // Append user message and placeholder for progressive streaming AI bubble
    setMessages(prev => [...prev, newUserMessage, initialAiMessage]);
    setInputQuery('');
    setLiveTranscript('');
    liveTranscriptRef.current = '';
    recognizedTextRef.current = '';
    setLoading(true);
    setVoiceTurnState('consulting');

    const t0 = Date.now();
    console.log(`[VOICE_TIMING] [T0_USER_TURN_FINAL] time=${new Date().toISOString()} responseId=${uniqueResponseId}`);

    try {
      const historyPayload = messages
        .filter(m => m.id !== 'welcome' && m.id !== aiMessageId)
        .slice(-6)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text,
        }));

      // 1. Try progressive SSE streaming
      let streamSucceeded = false;
      let firstTextTime = 0;
      let firstAudioTime = 0;

      try {
        const res = await fetch(apiUrl('/api/ai/consult-stream'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortCtrl.signal,
          body: JSON.stringify({
            query: textToSend,
            history: historyPayload,
            responseId: uniqueResponseId,
            includeAudio: true,
          }),
        });

        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let accumulatedText = '';
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              try {
                const data = JSON.parse(trimmed.slice(5).trim());
                if (data.type === 'text_chunk') {
                  streamSucceeded = true;
                  if (!firstTextTime) {
                    firstTextTime = Date.now();
                    console.log(`[VOICE_TIMING] [T1_FIRST_TEXT_CHUNK] deltaMs=${firstTextTime - t0} chunk="${data.chunk}" responseId=${uniqueResponseId}`);
                    console.log(`[VOICE_TIMING] [T2_FIRST_DESK_RENDER] deltaMs=${Date.now() - t0} responseId=${uniqueResponseId}`);
                  }
                  accumulatedText = data.textSoFar || (accumulatedText + (data.chunk || ''));
                  setMessages(prev =>
                    prev.map(m => (m.id === aiMessageId ? { ...m, text: accumulatedText } : m))
                  );

                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(
                      new CustomEvent('ai-forza-desk-stream-chunk', {
                        detail: {
                          responseId: uniqueResponseId,
                          chunk: data.chunk,
                          textSoFar: accumulatedText,
                          userQuery: textToSend,
                          t0,
                        },
                      })
                    );
                  }
                } else if (data.type === 'audio_chunk') {
                  if (!firstAudioTime) {
                    firstAudioTime = Date.now();
                    console.log(`[VOICE_TIMING] [T3_FIRST_AUDIO_CHUNK] deltaMs=${firstAudioTime - t0} phrase="${data.phraseText}" responseId=${uniqueResponseId}`);
                  }
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(
                      new CustomEvent('ai-forza-desk-audio-chunk', {
                        detail: {
                          responseId: uniqueResponseId,
                          phraseIndex: data.phraseIndex,
                          phraseText: data.phraseText,
                          audioBase64: data.audioBase64,
                          mimeType: data.mimeType || 'audio/mp3',
                          t0,
                        },
                      })
                    );
                  }
                } else if (data.type === 'done') {
                  streamSucceeded = true;
                  accumulatedText = data.fullText || accumulatedText;
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === aiMessageId
                        ? {
                            ...m,
                            text: accumulatedText,
                            suggestedAction: data.suggestedAction,
                          }
                        : m
                    )
                  );
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(
                      new CustomEvent('ai-forza-desk-stream-done', {
                        detail: {
                          responseId: uniqueResponseId,
                          fullText: accumulatedText,
                          suggestedAction: data.suggestedAction,
                          t0,
                        },
                      })
                    );
                    window.dispatchEvent(
                      new CustomEvent('ai-forza-desk-response', {
                        detail: {
                          type: 'ai-response',
                          responseId: uniqueResponseId,
                          messageId: aiMessageId,
                          conversationId: 'atlas-consult-session',
                          role: 'assistant',
                          text: accumulatedText,
                          source: 'engineering-desk',
                          userQuery: textToSend,
                          timestamp: Date.now(),
                          t0,
                        },
                      })
                    );
                  }
                }
              } catch (e) {
                console.warn('[SSE Parse Error]:', e);
              }
            }
          }
        }
      } catch (streamErr) {
        console.warn('[SSE stream fetch failed, falling back to REST]:', streamErr);
      }

      if (streamSucceeded) {
        setVoiceTurnState('idle');
        return;
      }

      // 2. Fallback to standard REST endpoint if SSE did not stream
      const res = await fetch(apiUrl('/api/ai/consult'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          history: historyPayload,
          includeSpeech: isVoiceSent || isLiveVoiceMode || autoPlayAudio,
        }),
      });

      if (!res.ok) throw new Error('Failed to consult AI');

      const data = await res.json();
      const aiReplyText =
        data.reply ||
        'توصیه مهندسی: با توجه به استانداردهای صنعتی و مشخصات کاربری، استفاده از قطعات اورجینال با مقاومت کششی و حرارتی بالا توصیه می‌شود.';

      console.log(`[AI RESPONSE CREATED] responseId=${uniqueResponseId}`);

      setMessages(prev =>
        prev.map(m =>
          m.id === aiMessageId
            ? {
                ...m,
                text: aiReplyText,
                suggestedAction: data.suggestedAction,
                category: data.category,
              }
            : m
        )
      );

      // Mirror & dispatch AI response immediately to Face-to-Face Voice UI!
      if (typeof window !== 'undefined') {
        console.log(`[AI RESPONSE → FACE_TO_FACE] responseId=${uniqueResponseId}`);
        window.dispatchEvent(
          new CustomEvent('ai-forza-desk-response', {
            detail: {
              type: 'ai-response',
              responseId: uniqueResponseId,
              messageId: aiMessageId,
              conversationId: 'atlas-consult-session',
              role: 'assistant',
              text: aiReplyText,
              audioBase64: data.audioBase64,
              mimeType: data.mimeType,
              source: 'engineering-desk',
              userQuery: textToSend,
              timestamp: Date.now(),
            },
          })
        );
      }

      // If Face-to-Face is NOT open, speak the response aloud in the Desk
      if (!isFaceToFaceOpen && (isVoiceSent || isLiveVoiceMode || autoPlayAudio)) {
        setTimeout(() => {
          playAiSpeech(aiReplyText, aiMessageId, data.audioBase64, data.mimeType);
        }, 200);
      } else {
        setVoiceTurnState('idle');
      }
    } catch {
      const fallbackText = `### پاسخ مهندسی هایپر صنعت اطلس:
در انتخاب انواع تسمه‌های صنعتی و پولی‌ها، بررسی توان الکتروموتور (kW)، دور ورودی و خروجی (RPM)، فاصله مراکز شفت‌ها و شرایط محیطی (دما و آلودگی) حائز اهمیت اساسی است.

برای بررسی دقیق ابعاد کاتالوگ یا دریافت فاکتور رسمی، همکاران واحد فنی و مهندسی در انبار مرکزی یزد آماده راهنمایی شما هستند.`;

      console.log(`[AI RESPONSE CREATED] responseId=${uniqueResponseId}`);

      setMessages(prev =>
        prev.map(m =>
          m.id === aiMessageId
            ? {
                ...m,
                text: fallbackText,
                suggestedAction: {
                  label: 'مشاهده کل کاتالوگ صنعتی',
                  link: '/category/industrial-belts',
                },
              }
            : m
        )
      );

      if (typeof window !== 'undefined') {
        console.log(`[AI RESPONSE → FACE_TO_FACE] responseId=${uniqueResponseId}`);
        window.dispatchEvent(
          new CustomEvent('ai-forza-desk-response', {
            detail: {
              type: 'ai-response',
              responseId: uniqueResponseId,
              messageId: aiMessageId,
              conversationId: 'atlas-consult-session',
              role: 'assistant',
              text: fallbackText,
              source: 'engineering-desk',
              userQuery: textToSend,
              timestamp: Date.now(),
            },
          })
        );
      }

      if (!isFaceToFaceOpen && (isVoiceSent || isLiveVoiceMode || autoPlayAudio)) {
        setTimeout(() => {
          playAiSpeech(fallbackText, aiMessageId);
        }, 200);
      } else {
        setVoiceTurnState('idle');
      }
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    stopCurrentAudio();
    stopRecordingCleanly();
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        sender: 'ai',
        text: `گفتگوی جدید آغاز شد. مشاور مهندسی هایپر صنعت اطلس آماده پاسخگویی صوتی و متنی به سوالات فنی شماست.`,
        time: 'هم‌اکنون',
      },
    ]);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${toPersianDigits(mins.toString().padStart(2, '0'))}:${toPersianDigits(
      secs.toString().padStart(2, '0')
    )}`;
  };

  if (!isOpen && !isFaceToFaceOpen) return null;

  return (
    <>
      {/* 1. Engineering Desk Cockpit View */}
      {isOpen && !isFaceToFaceOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-0 lg:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          dir="rtl"
        >
          {/* Container - Desktop: Cockpit Station, Mobile: Full Screen Native Drawer */}
          <div className="relative w-full h-full lg:h-[90vh] lg:max-w-6xl bg-white lg:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-700/50">
        {/* Top 3px Precision Highlight Line matching Atlas Header */}
        <div className="h-[3px] w-full bg-gradient-to-r from-orange-500 via-[#E06518] to-orange-400 shrink-0 z-20" />

        {/* ===================================================================== */}
        {/* 1. DESKTOP COCKPIT INTERFACE (Visible on lg+)                        */}
        {/* ===================================================================== */}
        <div className="hidden lg:flex w-full h-full overflow-hidden">
          {/* Right Column: Engineering Tools & Specs Sidebar */}
          <div className="w-80 bg-[#1E232B] text-white flex flex-col border-l border-slate-800 shrink-0 overflow-y-auto">
            {/* AI Agent Identity Card */}
            <div className="p-5 border-b border-slate-800 bg-gradient-to-b from-[#2B313A] to-[#1E232B]">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#E06518] to-orange-400 p-0.5 shadow-lg shadow-orange-950/40">
                    <img
                      src={STORE_ASSETS.aiConsultRobot}
                      alt="مشاور هوشمند اطلس"
                      className="w-full h-full object-cover rounded-[14px]"
                    />
                  </div>
                  <span className="absolute -bottom-1 -left-1 w-4 h-4 bg-emerald-500 border-2 border-[#1E232B] rounded-full flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm text-white">مشاور هوشمند اطلس</h3>
                    <span className="px-1.5 py-0.5 rounded bg-[#E06518] text-white text-[10px] font-black tracking-wide">
                      AI 3.5
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>آنلاین • انبار مرکزی یزد</span>
                  </p>
                </div>
              </div>

              {/* Status Chips */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-medium">
                <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#E06518]" />
                  <span>تأییدیه SWR & FORZA</span>
                </div>
                <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>فرمول محاسباتی DIN</span>
                </div>
              </div>
            </div>

            {/* Audio Auto-Play Toggle */}
            <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                <Volume2 className="w-4 h-4 text-[#E06518]" />
                <span>پخش صوتی خودکار پاسخ‌ها</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoPlayAudio(!autoPlayAudio)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  autoPlayAudio ? 'bg-[#E06518]' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    autoPlayAudio ? 'left-1' : 'left-6'
                  }`}
                />
              </button>
            </div>

            {/* Mini Calculator Widget in Cockpit */}
            <div className="p-5 border-b border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Calculator className="w-4 h-4 text-[#E06518]" />
                  <span>محاسبه‌گر سریع طول تسمه</span>
                </div>
                <span className="text-[10px] text-slate-400">DIN 2215</span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">فاصله مراکز شفت (C mm):</label>
                  <input
                    type="number"
                    value={calcC}
                    onChange={e => setCalcC(e.target.value)}
                    className="w-full h-8 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-center text-xs focus:outline-none focus:border-[#E06518]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">پولی بزرگ (D):</label>
                    <input
                      type="number"
                      value={calcD}
                      onChange={e => setCalcD(e.target.value)}
                      className="w-full h-8 px-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-center text-xs focus:outline-none focus:border-[#E06518]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">پولی کوچک (d):</label>
                    <input
                      type="number"
                      value={calcd}
                      onChange={e => setCalcd(e.target.value)}
                      className="w-full h-8 px-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-center text-xs focus:outline-none focus:border-[#E06518]"
                    />
                  </div>
                </div>

                {calcResult && (
                  <div className="mt-2 p-2.5 rounded-xl bg-orange-950/40 border border-[#E06518]/40 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>طول تسمه ($L_p$):</span>
                      <span className="font-mono font-bold text-white text-xs">
                        {toPersianDigits(calcResult.length)} mm
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>نسبت دور (Ratio):</span>
                      <span className="font-mono font-bold text-orange-400 text-xs">
                        ۱ به {toPersianDigits(calcResult.ratio)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleSend(
                          `لطفاً تسمه مناسب با طول نامی ${calcResult.length} میلیمتر و نسبت دور ۱:${calcResult.ratio} را از کاتالوگ هایپر صنعت اطلس پیشنهاد دهید.`
                        )
                      }
                      className="w-full mt-2 py-1.5 bg-[#E06518] hover:bg-[#C95210] text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer text-center block"
                    >
                      استعلام موجودی این طول تسمه ↵
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions at Bottom of Sidebar */}
            <div className="p-4 mt-auto space-y-2">
              <button
                type="button"
                onClick={() => {
                  openedFromDeskRef.current = true;
                  setIsFaceToFaceOpen(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#E06518] to-[#C95210] hover:brightness-110 text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-md shadow-orange-950/20 active:scale-98"
                title="مکالمه زنده تصویری و صوتی با هوش مصنوعی FORZA"
              >
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 animate-pulse" />
                  <span>مکالمه رو در رو با AI FORZA</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-black/30 text-[9px] font-black tracking-wider">
                  زنده
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenVisualSearch) onOpenVisualSearch();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#E06518]" />
                  <span>شناسایی تصویری قطعه</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <a
                href="tel:03538739900"
                className="w-full py-2 px-3 rounded-xl bg-[#2B313A] hover:bg-[#E06518] text-white font-bold text-xs flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>تماس با مهندسین انبار</span>
                </div>
                <span className="font-mono text-[10px] text-slate-300">۰۳۵-۳۸۷۳۹۹۰۰</span>
              </a>
            </div>
          </div>

          {/* Left Column: Primary Chat Stream & Workspace */}
          <div className="flex-1 flex flex-col bg-[#F6F7F7] overflow-hidden">
            {/* Top Bar with Clear Chat & Close */}
            <div className="h-16 px-6 bg-white border-b border-[#CBD2D8] flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-rose-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
                  <span className="font-black text-sm text-[#2B313A]">
                    میز مشاوره و محاسبات مهندسی هایپر صنعت اطلس
                  </span>
                </div>
                {/* Voice Status Pill */}
                {voiceTurnState === 'listening' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>در حال شنیدن صدای شما...</span>
                  </span>
                )}
                {voiceTurnState === 'userSpeaking' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-400 text-emerald-800 text-xs font-black flex items-center gap-1.5 animate-pulse">
                    <Mic className="w-3 h-3 text-emerald-600 animate-bounce" />
                    <span>شما در حال صحبت هستید</span>
                  </span>
                )}
                {voiceTurnState === 'silenceWaiting' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-400 text-amber-800 text-xs font-black flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                    <span>تشخیص مکث: ارزیابی پایان جمله ({silenceProgress}٪)</span>
                  </span>
                )}
                {voiceTurnState === 'consulting' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-100 border border-orange-400 text-orange-800 text-xs font-black flex items-center gap-1.5 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin text-[#E06518]" />
                    <span>ارسال به هوش مصنوعی جمینای...</span>
                  </span>
                )}
                {voiceTurnState === 'aiSpeaking' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E06518]/15 border border-[#E06518] text-[#E06518] text-xs font-black flex items-center gap-1.5">
                    <Volume2 className="w-3 h-3 animate-pulse" />
                    <span>مشاور در حال پاسخگویی صوتی...</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Live Voice Continuous Mode Toggle with Silence Detection */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !isLiveVoiceMode;
                    setIsLiveVoiceMode(next);
                    isLiveVoiceModeRef.current = next;
                    if (next && !isRecording) {
                      startVoiceRecording();
                    } else if (!next && isRecording) {
                      stopRecordingCleanly();
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer shadow-2xs ${
                    isLiveVoiceMode
                      ? 'bg-orange-50 border-[#E06518] text-[#E06518] ring-2 ring-[#E06518]/20'
                      : 'bg-white border-[#CBD2D8] text-[#55565A] hover:bg-[#DEE2E5]'
                  }`}
                  title="تشخیص خودکار سکوت، پایان جمله و مکالمه پیوسته صوتی"
                >
                  <Radio className={`w-3.5 h-3.5 ${isLiveVoiceMode ? 'text-[#E06518] animate-pulse' : 'text-slate-400'}`} />
                  <span>مکالمه صوتی زنده (تشخیص سکوت)</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                      isLiveVoiceMode ? 'bg-[#E06518] text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isLiveVoiceMode ? 'روشن' : 'خاموش'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    openedFromDeskRef.current = true;
                    setIsFaceToFaceOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="باز کردن مکالمه چهره به چهره صوتی با AI FORZA"
                >
                  <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
                  <span>تماس چهره‌به‌چهره AI FORZA</span>
                </button>

                {playingAudioId && (
                  <button
                    type="button"
                    onClick={stopCurrentAudio}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 animate-pulse"
                  >
                    <Square className="w-3.5 h-3.5 fill-rose-600" />
                    <span>توقف صدا</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetChat}
                  title="شروع مجدد گفتگو"
                  className="p-2 rounded-xl text-[#55565A] hover:text-[#2B313A] hover:bg-[#DEE2E5] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  title="بستن"
                  className="p-2 rounded-xl text-[#55565A] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Topic Chips Strip */}
            <div className="px-6 py-2.5 bg-[#DEE2E5]/50 border-b border-[#CBD2D8] flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
              <span className="text-xs font-bold text-[#55565A] shrink-0">پرسش‌های پرکاربرد:</span>
              {QUICK_TOPICS.map(topic => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => handleSend(topic.prompt)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-white border border-[#CBD2D8] text-[#2B313A] hover:border-[#E06518] hover:text-[#E06518] font-bold whitespace-nowrap transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                >
                  {topic.label}
                </button>
              ))}
            </div>

            {/* Mic Notice */}
            {micError && (
              <div className="mx-6 mt-3 p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-300 rounded-2xl shadow-xs space-y-2 text-xs text-orange-950 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <Mic className="w-4 h-4 text-[#E06518] shrink-0" />
                    <span>{micError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMicError(null)}
                    className="p-1 text-orange-700 hover:text-orange-950 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-1 flex items-center justify-end">
                  <a
                    href={typeof window !== 'undefined' ? window.location.href : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#E06518] hover:bg-[#C95210] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>باز کردن در تب مستقیم برای ظاهر شدن پنجره Allow ↗</span>
                  </a>
                </div>
              </div>
            )}

            {/* Messages Chat List Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map(m => (
                <div
                  key={m.id}
                  className={`flex items-start gap-3.5 ${
                    m.sender === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-sm shadow-xs ${
                      m.sender === 'user'
                        ? 'bg-[#2B313A] text-white'
                        : 'bg-gradient-to-tr from-[#E06518] to-orange-400 text-white'
                    }`}
                  >
                    {m.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[78%] rounded-3xl p-4 space-y-2.5 shadow-xs transition-all ${
                      m.sender === 'user'
                        ? 'bg-[#2B313A] text-white rounded-tr-xs'
                        : 'bg-white text-[#2B313A] border border-[#CBD2D8] rounded-tl-xs'
                    }`}
                  >
                    {/* Header of bubble */}
                    <div className="flex items-center justify-between text-[11px] pb-1 border-b border-current/10">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">
                          {m.sender === 'user' ? 'شما' : 'مشاور فنی هایپر صنعت اطلس'}
                        </span>
                        {m.isVoice && (
                          <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold text-[10px] flex items-center gap-1">
                            <Mic className="w-2.5 h-2.5" />
                            <span>پیام صوتی</span>
                          </span>
                        )}
                      </div>
                      <span className="opacity-60">{m.time}</span>
                    </div>

                    {/* Body Text */}
                    <div className="text-xs sm:text-sm leading-relaxed font-normal">
                      {m.sender === 'ai' ? renderEngineeringMarkdown(m.text, false) : <div className="whitespace-pre-wrap">{m.text}</div>}
                    </div>

                    {/* AI Suggested Action Button if present */}
                    {m.suggestedAction && m.suggestedAction.link && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            navigate(m.suggestedAction!.link!);
                          }}
                          className="w-full py-2 px-3.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#E06518] font-bold text-xs flex items-center justify-between border border-orange-200 transition-colors cursor-pointer"
                        >
                          <span>{m.suggestedAction.label}</span>
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Footer Actions (TTS Voice, Copy, Feedback) */}
                    {m.sender === 'ai' && (
                      <div className="flex items-center justify-between pt-2 border-t border-[#CBD2D8]/40 text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => playAiSpeech(m.text, m.id)}
                            disabled={audioLoadingId === m.id}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                              playingAudioId === m.id
                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                                : 'bg-[#F6F7F7] hover:bg-[#DEE2E5] text-[#2B313A] border border-[#CBD2D8]'
                            }`}
                            title="شنیدن کل پاسخ با صدای روان گوینده مرد مهندس"
                          >
                            {audioLoadingId === m.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E06518]" />
                                <span>آماده‌سازی صدای گوینده مرد...</span>
                              </>
                            ) : playingAudioId === m.id ? (
                              <>
                                <Square className="w-3.5 h-3.5 fill-white" />
                                <span>قطع صدا ⏹️</span>
                                <span className="flex items-center gap-0.5 mr-1 h-3">
                                  <span className="w-0.5 h-2 bg-white rounded-full animate-pulse" />
                                  <span className="w-0.5 h-3.5 bg-white rounded-full animate-bounce" />
                                  <span className="w-0.5 h-2 bg-white rounded-full animate-pulse" />
                                </span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5 text-[#E06518]" />
                                <span>شنیدن با صدای مرد 🔊</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-1 text-[#777A7D]">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(m.text, m.id)}
                            className="p-1.5 hover:text-[#2B313A] hover:bg-[#F6F7F7] rounded-lg transition-colors cursor-pointer"
                            title="کپی متن"
                          >
                            {copiedId === m.id ? (
                              <span className="text-emerald-600 font-bold text-[11px]">کپی شد</span>
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setFeedbackState(prev => ({ ...prev, [m.id]: 'up' }))
                            }
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              feedbackState[m.id] === 'up'
                                ? 'text-emerald-600 bg-emerald-50'
                                : 'hover:text-[#2B313A]'
                            }`}
                            title="پاسخ مفید بود"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setFeedbackState(prev => ({ ...prev, [m.id]: 'down' }))
                            }
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              feedbackState[m.id] === 'down'
                                ? 'text-rose-600 bg-rose-50'
                                : 'hover:text-[#2B313A]'
                            }`}
                            title="نیاز به اصلاح"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Transcribing Voice Indicator */}
              {isTranscribing && (
                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-200 text-xs text-[#E06518] font-bold animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin text-[#E06518]" />
                  <span>هوش مصنوعی در حال تبدیل صدای شما به متن و ارسال به مشاور...</span>
                </div>
              )}

              {/* Real-time Silence Detection & Sentence Completion Progress Banner */}
              {voiceTurnState === 'silenceWaiting' && (
                <div className="p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-[#E06518]/50 rounded-2xl shadow-lg animate-in fade-in space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-orange-950">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E06518] animate-ping" />
                      <span className="text-sm font-black">مکث کاربر تشخیص داده شد — سنجش پایان جمله و ارسال خودکار</span>
                    </div>
                    <span className="font-mono text-[#E06518] text-sm font-black bg-white px-2 py-0.5 rounded-lg border border-[#E06518]/30">
                      {silenceProgress}٪
                    </span>
                  </div>

                  <div className="w-full bg-orange-200/80 rounded-full h-2.5 overflow-hidden p-0.5">
                    <div
                      className="bg-gradient-to-r from-[#E06518] via-orange-500 to-amber-500 h-full rounded-full transition-all duration-75 shadow-xs"
                      style={{ width: `${silenceProgress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-orange-900 font-medium">
                    <span>مبنای تشخیص: {silenceReason || 'مکث طبیعی در گفتار کاربر'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[10px] hidden sm:inline">برای ادامه صحبت، کافیست ادامه دهید</span>
                      <button
                        type="button"
                        onClick={finishVoiceRecordingAndSend}
                        className="px-2.5 py-1 bg-[#E06518] hover:bg-[#C95210] text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                      >
                        ارسال بدون معطلی ↵
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Processing Message */}
              {loading && (
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-[#CBD2D8] text-xs text-[#E06518] font-bold animate-pulse shadow-xs">
                  <Sparkles className="w-5 h-5 animate-spin text-[#E06518]" />
                  <span>مشاور مهندسی در حال تحلیل پرسش با هوش مصنوعی جمینای و کاتالوگ اطلس...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Composer Bar */}
            <div className="p-4 bg-white border-t border-[#CBD2D8] shrink-0 space-y-2">
              {/* Active Voice Recording Studio Drawer */}
              {isRecording ? (
                <div className="p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-[#E06518] rounded-2xl shadow-lg animate-in fade-in flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={finishVoiceRecordingAndSend}
                      title="کلیک برای ارسال ویس بدون انتظار"
                      className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#E06518] to-orange-500 hover:brightness-110 text-white flex items-center justify-center animate-pulse shadow-lg shadow-orange-950/20 shrink-0 cursor-pointer"
                    >
                      <Mic className="w-6 h-6" />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-800">
                          {voiceTurnState === 'silenceWaiting'
                            ? 'در حال تشخیص مکث و پایان جمله...'
                            : voiceTurnState === 'userSpeaking'
                            ? 'در حال شنیدن صحبت شما...'
                            : 'آماده برای دریافت گفتار...'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#E06518] text-white font-mono font-bold text-xs">
                          {formatTimer(recordingSeconds)}
                        </span>
                        {voiceTurnState === 'silenceWaiting' && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-white font-bold text-[10px] animate-pulse">
                            مکث: {silenceProgress}٪
                          </span>
                        )}
                      </div>

                      {/* Animated Sound Wave Bars */}
                      <div className="flex items-center gap-1 mt-1.5 h-4">
                        {audioLevels.map((lvl, idx) => (
                          <div
                            key={idx}
                            style={{ height: `${lvl}%` }}
                            className="w-1.5 bg-[#E06518] rounded-full transition-all duration-75"
                          />
                        ))}
                        <span className="text-xs text-slate-800 font-bold mr-2 truncate max-w-[320px]">
                          {liveTranscript ? `« ${liveTranscript} »` : 'صحبت بفرمایید؛ به محض مکث، سیستم خودکار ارسال می‌کند...'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <button
                      type="button"
                      onClick={cancelVoiceRecording}
                      className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                      <span>لغو ضبط</span>
                    </button>
                    <button
                      type="button"
                      onClick={finishVoiceRecordingAndSend}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E06518] to-orange-600 hover:brightness-110 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-orange-950/20 active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>ارسال فوری به جمینای</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="relative flex items-end gap-2 bg-[#F6F7F7] border border-[#CBD2D8] rounded-2xl p-2 focus-within:border-[#E06518] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#E06518]/20 transition-all shadow-inner"
                >
                  {/* Visual Search Camera Shortcut */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenVisualSearch) onOpenVisualSearch();
                    }}
                    title="شناسایی تصویری قطعه با دوربین"
                    className="w-10 h-10 rounded-xl bg-white border border-[#CBD2D8] text-[#55565A] hover:text-[#E06518] hover:border-[#E06518] flex items-center justify-center transition-all cursor-pointer shrink-0"
                  >
                    <Camera className="w-4 h-4" />
                  </button>

                  {/* High-Visibility Microphone Voice Button with Silence Detection Hint */}
                  <button
                    type="button"
                    onClick={() => startVoiceRecording()}
                    title="مکالمه صوتی زنده با تشخیص سکوت و پاسخ فوری گفتاری"
                    className="h-10 px-4 rounded-xl bg-[#E06518] hover:bg-[#C95210] text-white flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-md shadow-orange-950/20 active:scale-95 group font-bold text-xs"
                  >
                    <Mic className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
                    <span>صحبت صوتی (ویس هوشمند)</span>
                  </button>

                  <textarea
                    ref={textareaRef}
                    value={inputQuery}
                    onChange={e => setInputQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    rows={2}
                    placeholder="سوال خود را بنویسید یا دکمه نارنجی «ضبط ویس» را لمس کنید تا صوتی صحبت بفرمایید..."
                    className="flex-1 max-h-32 text-xs sm:text-sm bg-transparent border-0 text-[#2B313A] placeholder:text-[#777A7D] focus:outline-none resize-none p-2 leading-relaxed"
                  />

                  <button
                    type="submit"
                    disabled={!inputQuery.trim() || loading || isTranscribing}
                    className="h-10 px-5 bg-[#2B313A] hover:bg-[#1E232B] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow-sm active:scale-95"
                  >
                    <span>ارسال</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 2. ANDROID / MOBILE NATIVE APP EXPERIENCE (Visible on < lg)          */}
        {/* ===================================================================== */}
        <div className="flex lg:hidden flex-col w-full h-full bg-[#F6F7F7] select-none">
          {/* Mobile Native Header with Status & Tabs */}
          <div className="bg-[#2B313A] text-white px-4 pt-3 pb-2 border-b border-[#3F4550] shrink-0 shadow-md">
            <div className="flex items-center justify-between">
              {/* Profile & Authority */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    openedFromDeskRef.current = true;
                    setIsFaceToFaceOpen(true);
                  }}
                  className="relative cursor-pointer text-right group"
                  title="مکالمه زنده چهره به چهره با هوش مصنوعی AI FORZA"
                >
                  <div className="w-10 h-10 rounded-xl bg-black/40 border border-[#E06518] p-0.5 overflow-hidden shadow-md group-hover:scale-105 transition-transform">
                    <img
                      src={STORE_ASSETS.aiForzaCyborg}
                      alt="AI FORZA"
                      className="w-full h-full object-cover object-top rounded-[8px]"
                    />
                  </div>
                  <span className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#2B313A] rounded-full animate-pulse" />
                </button>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-sm text-white">مشاور هوشمند FORZA</h3>
                    <span className="px-1.5 py-0.2 bg-[#E06518] text-white text-[9px] font-black rounded">
                      ویس زنده
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>مکالمه دوطرفه صوتی و تصویری</span>
                  </p>
                </div>
              </div>

              {/* Actions: Stop Voice, Direct Call & Close */}
              <div className="flex items-center gap-1.5">
                {playingAudioId && (
                  <button
                    type="button"
                    onClick={stopCurrentAudio}
                    className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center transition-colors animate-pulse"
                    aria-label="توقف صدا"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                  </button>
                )}

                {/* Prominent Mobile Call Button Opening AI FORZA Face-to-Face */}
                <button
                  type="button"
                  onClick={() => {
                    openedFromDeskRef.current = true;
                    setIsFaceToFaceOpen(true);
                  }}
                  className="px-2.5 h-8 rounded-xl bg-gradient-to-r from-[#E06518] to-orange-600 hover:brightness-110 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-orange-950/30 active:scale-95 border border-white/20"
                  aria-label="تماس چهره به چهره صوتی با هوش مصنوعی FORZA"
                  title="مکالمه زنده تصویری و صوتی با هوش مصنوعی FORZA"
                >
                  <PhoneCall className="w-3.5 h-3.5 animate-pulse text-white" />
                  <span className="text-[11px] font-black">تماس FORZA</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="بستن"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile Mode Switcher (Chat vs Face-to-Face vs Calculator) */}
            <div className="grid grid-cols-3 gap-1 mt-3 bg-[#1E232B] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveMobileTab('chat')}
                className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeMobileTab === 'chat'
                    ? 'bg-[#E06518] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3 h-3" />
                <span>چت و ویس</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  openedFromDeskRef.current = true;
                  setIsFaceToFaceOpen(true);
                }}
                className="py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-xs animate-pulse"
                title="تماس زنده چهره به چهره با هوش مصنوعی فورزا"
              >
                <PhoneCall className="w-3 h-3" />
                <span>تماس FORZA</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMobileTab('calc')}
                className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeMobileTab === 'calc'
                    ? 'bg-[#E06518] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calculator className="w-3 h-3" />
                <span>محاسبات</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Mobile Chat Stream */}
          {activeMobileTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Quick Horizontal Prompt Carousel on Mobile */}
              <div className="px-3 py-2 bg-white border-b border-[#E3E5E6] flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                {QUICK_TOPICS.map(topic => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleSend(topic.prompt)}
                    className="text-[10px] px-2.5 py-1.5 rounded-xl bg-[#F6F7F7] border border-[#CBD2D8] text-[#2B313A] font-bold whitespace-nowrap shrink-0 active:scale-95 shadow-2xs"
                  >
                    {topic.label}
                  </button>
                ))}
              </div>

              {/* Mobile Mic Notice */}
              {micError && (
                <div className="mx-3 mt-2 p-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-300 rounded-xl space-y-2 text-xs text-orange-950">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Mic className="w-3.5 h-3.5 text-[#E06518] shrink-0" />
                      <span className="text-[11px]">{micError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMicError(null)}
                      className="p-1 text-orange-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="pt-1 flex items-center justify-end">
                    <a
                      href={typeof window !== 'undefined' ? window.location.href : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-[#E06518] text-white rounded-lg text-[11px] font-bold shadow-xs flex items-center gap-1"
                    >
                      <span>باز کردن در تب مستقیم برای تایید Allow ↗</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                {messages.map(m => (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2 ${
                      m.sender === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs ${
                        m.sender === 'user'
                          ? 'bg-[#2B313A] text-white'
                          : 'bg-[#E06518] text-white shadow-xs'
                      }`}
                    >
                      {m.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-3 space-y-2 text-xs leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-[#2B313A] text-white rounded-tr-xs shadow-xs'
                          : 'bg-white text-[#2B313A] border border-[#CBD2D8] rounded-tl-xs shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] pb-1 border-b border-current/10">
                        <div className="flex items-center gap-1">
                          <span className="font-bold">
                            {m.sender === 'user' ? 'شما' : 'مشاور اطلس'}
                          </span>
                          {m.isVoice && (
                            <span className="px-1 py-0.2 rounded bg-orange-500/20 text-orange-400 font-bold text-[9px] flex items-center gap-0.5">
                              <Mic className="w-2.5 h-2.5" />
                              <span>ویس</span>
                            </span>
                          )}
                        </div>
                        <span className="opacity-60">{m.time}</span>
                      </div>

                      <div className="text-xs sm:text-sm leading-relaxed font-normal">
                        {m.sender === 'ai' ? renderEngineeringMarkdown(m.text, false) : <div className="whitespace-pre-wrap">{m.text}</div>}
                      </div>

                      {m.suggestedAction && m.suggestedAction.link && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            navigate(m.suggestedAction!.link!);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-orange-50 text-[#E06518] font-bold text-[11px] flex items-center justify-between border border-orange-200 mt-2"
                        >
                          <span>{m.suggestedAction.label}</span>
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {m.sender === 'ai' && (
                        <div className="flex items-center justify-between pt-1 border-t border-[#CBD2D8]/40">
                          <button
                            type="button"
                            onClick={() => playAiSpeech(m.text, m.id)}
                            disabled={audioLoadingId === m.id}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                              playingAudioId === m.id
                                ? 'bg-rose-600 text-white'
                                : 'bg-[#F6F7F7] text-[#2B313A] border border-[#CBD2D8]'
                            }`}
                          >
                            {audioLoadingId === m.id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin text-[#E06518]" />
                                <span>آماده‌سازی...</span>
                              </>
                            ) : playingAudioId === m.id ? (
                              <>
                                <Square className="w-3 h-3 fill-white" />
                                <span>قطع صدا ⏹️</span>
                                <span className="flex items-center gap-0.5 mr-0.5 h-2.5">
                                  <span className="w-0.5 h-2 bg-white rounded-full animate-pulse" />
                                  <span className="w-0.5 h-3 bg-white rounded-full animate-bounce" />
                                </span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3 h-3 text-[#E06518]" />
                                <span>شنیدن با صدای مرد 🔊</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => copyToClipboard(m.text, m.id)}
                            className="text-[10px] text-[#777A7D] flex items-center gap-1"
                          >
                            {copiedId === m.id ? (
                              <span className="text-emerald-600 font-bold">کپی شد</span>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>کپی</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isTranscribing && (
                  <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-2xl border border-orange-200 text-xs text-[#E06518] font-bold animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال تبدیل صدای شما به متن و ارسال...</span>
                  </div>
                )}

                {loading && (
                  <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-[#CBD2D8] text-xs text-[#E06518] font-bold animate-pulse">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>در حال تحلیل و فرمول‌بندی پاسخ مهندسی...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Mobile Fixed Input Bar with Mic Recording Controls */}
              <div className="p-2.5 bg-white border-t border-[#CBD2D8] shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                {isRecording ? (
                  <div className="flex items-center justify-between gap-2 p-2.5 bg-rose-50 border-2 border-rose-400 rounded-2xl shadow-md">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={finishVoiceRecordingAndSend}
                        className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center animate-pulse shrink-0"
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-rose-800">در حال شنیدن</span>
                          <span className="font-mono font-bold text-xs text-white bg-rose-600 px-1.5 py-0.2 rounded">
                            {formatTimer(recordingSeconds)}
                          </span>
                        </div>
                        <span className="text-[10px] text-rose-800 font-bold block truncate max-w-[130px]">
                          {liveTranscript || 'صحبت بفرمایید...'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={cancelVoiceRecording}
                        className="px-3 py-1.5 rounded-xl bg-white text-rose-700 text-xs font-bold border border-rose-200"
                      >
                        لغو
                      </button>
                      <button
                        type="button"
                        onClick={finishVoiceRecordingAndSend}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs active:scale-95"
                      >
                        ارسال ویس
                      </button>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onOpenVisualSearch) onOpenVisualSearch();
                      }}
                      className="w-10 h-10 rounded-xl bg-[#F6F7F7] border border-[#CBD2D8] text-[#55565A] flex items-center justify-center shrink-0 active:scale-95"
                      aria-label="عکس قطعه"
                    >
                      <Camera className="w-4 h-4 text-[#E06518]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => startVoiceRecording()}
                      className="w-12 h-10 rounded-xl bg-[#E06518] hover:bg-[#C95210] text-white flex items-center justify-center shrink-0 active:scale-95 shadow-md shadow-orange-950/20"
                      aria-label="ارسال ویس صوتی"
                    >
                      <Mic className="w-5 h-5" />
                    </button>

                    <input
                      type="text"
                      value={inputQuery}
                      onChange={e => setInputQuery(e.target.value)}
                      placeholder="بنویسید یا دکمه نارنجی ویس را بزنید..."
                      className="flex-1 h-10 px-3 bg-[#F6F7F7] border border-[#CBD2D8] text-xs text-[#2B313A] rounded-xl focus:outline-none focus:border-[#E06518] focus:bg-white"
                    />

                    <button
                      type="submit"
                      disabled={!inputQuery.trim() || loading || isTranscribing}
                      className="w-10 h-10 rounded-xl bg-[#2B313A] disabled:bg-slate-300 text-white flex items-center justify-center shrink-0 shadow-sm active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Mobile Belt Calculator Dedicated View */}
          {activeMobileTab === 'calc' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-[#CBD2D8] shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-sm font-black text-[#2B313A]">
                  <Calculator className="w-5 h-5 text-[#E06518]" />
                  <span>محاسبه‌گر طول تسمه بین دو پولی</span>
                </div>
                <p className="text-xs text-[#55565A] leading-relaxed">
                  مقادیر فاصله مراکز و قطرهای پولی را وارد کنید تا طول استاندارد تسمه محاسبه گردد:
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-[#55565A] block mb-1">
                      فاصله بین مرکز دو شفت (C) برحسب میلیمتر:
                    </label>
                    <input
                      type="number"
                      value={calcC}
                      onChange={e => setCalcC(e.target.value)}
                      className="w-full h-10 px-3 bg-[#F6F7F7] border border-[#CBD2D8] rounded-xl text-center font-mono font-bold text-sm text-[#2B313A] focus:outline-none focus:border-[#E06518]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-xs font-bold text-[#55565A] block mb-1">
                        قطر پولی بزرگ (D):
                      </label>
                      <input
                        type="number"
                        value={calcD}
                        onChange={e => setCalcD(e.target.value)}
                        className="w-full h-10 px-3 bg-[#F6F7F7] border border-[#CBD2D8] rounded-xl text-center font-mono font-bold text-sm text-[#2B313A] focus:outline-none focus:border-[#E06518]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#55565A] block mb-1">
                        قطر پولی کوچک (d):
                      </label>
                      <input
                        type="number"
                        value={calcd}
                        onChange={e => setCalcd(e.target.value)}
                        className="w-full h-10 px-3 bg-[#F6F7F7] border border-[#CBD2D8] rounded-xl text-center font-mono font-bold text-sm text-[#2B313A] focus:outline-none focus:border-[#E06518]"
                      />
                    </div>
                  </div>
                </div>

                {calcResult && (
                  <div className="mt-4 p-3.5 rounded-xl bg-orange-50 border border-orange-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#55565A] font-bold">طول اسمی تسمه ($L_p$):</span>
                      <span className="font-mono font-black text-sm text-[#E06518]">
                        {toPersianDigits(calcResult.length)} mm
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#55565A] font-bold">نسبت تبدیل دور:</span>
                      <span className="font-mono font-bold text-xs text-[#2B313A]">
                        ۱ به {toPersianDigits(calcResult.ratio)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMobileTab('chat');
                        handleSend(
                          `لطفاً موجودی و مشخصات تسمه طول ${calcResult.length} میلیمتر را از کاتالوگ اطلس اعلام کنید.`
                        );
                      }}
                      className="w-full mt-2 py-2 bg-[#E06518] text-white font-bold rounded-xl text-xs text-center shadow-sm"
                    >
                      استعلام موجودی و قیمت این تسمه ↵
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
        </div>
      )}

      {/* 2. Face-to-Face Real-Time Voice Consultation Modal with AI FORZA */}
      <AiForzaFaceToFaceModal
        isOpen={isFaceToFaceOpen}
        onClose={() => {
          setIsFaceToFaceOpen(false);
          if (!openedFromDeskRef.current) {
            onClose();
          }
        }}
        onSwitchToWorkspace={() => {
          openedFromDeskRef.current = true;
          setIsFaceToFaceOpen(false);
        }}
        onSyncMessage={handleSyncMessageFromForza}
      />
    </>
  );
};
