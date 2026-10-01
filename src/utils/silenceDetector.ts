/**
 * silenceDetector.ts
 *
 * Advanced Persian Voice Activity & Silence Detection (VAD)
 * Analyzes audio energy (RMS/AnalyserNode) and Persian linguistic cues
 * to intelligently identify the natural conclusion of a user's spoken sentence
 * and automatically dispatch the turn for Gemini processing.
 */

export interface PersianSentenceAnalysis {
  isComplete: boolean;
  isQuestion: boolean;
  isMidThought: boolean;
  confidence: number;
  recommendedPauseMs: number;
  detectedReason: string;
}

/**
 * Intelligent Persian linguistic analyzer to detect if a spoken sentence has reached its conclusion.
 * Differentiates between completed inquiries, polite terminations, and mid-sentence pauses.
 */
export function analyzePersianSentenceCompletion(text: string): PersianSentenceAnalysis {
  const clean = (text || '')
    .trim()
    .replace(/[،,؛;]/g, ' ')
    .replace(/\s+/g, ' ');

  if (!clean || clean.length < 2) {
    return {
      isComplete: false,
      isQuestion: false,
      isMidThought: true,
      confidence: 0,
      recommendedPauseMs: 1800,
      detectedReason: 'متن بسیار کوتاه یا در انتظار صحبت کاربر است',
    };
  }

  // 1. Terminal punctuation check (Strongest indicator)
  if (/[.?!؟]$/.test(clean)) {
    const isQ = /[?؟]/.test(clean);
    return {
      isComplete: true,
      isQuestion: isQ,
      isMidThought: false,
      confidence: 0.98,
      recommendedPauseMs: 850,
      detectedReason: isQ ? 'علامت سوال در پایان جمله' : 'نقطه پایان جمله',
    };
  }

  // 2. Mid-thought connector words at the end (User definitely needs more time)
  const midThoughtEndingPattern =
    /(?:\s|^)(و|که|چون|چونکه|برای|برای\s+اینکه|مثلا|مثلاً|اما|ولی|یا|اگر|یعنی|در\s+واقع|به\s+عبارت\s+دیگر|سپس|بعد|بعدش|همچنین|به\s+همراه|با|از\s+طرفی)$/i;

  if (midThoughtEndingPattern.test(clean)) {
    return {
      isComplete: false,
      isQuestion: false,
      isMidThought: true,
      confidence: 0.1,
      recommendedPauseMs: 2200, // Longer grace period for thought continuation
      detectedReason: 'حرف ربط در انتهای کلام (مکث موقت بین جمله)',
    };
  }

  // 3. Persian Interrogative / Question endings (High confidence sentence end)
  const questionEndings = [
    /(?:چیست|چیه|چنده|چقدره|چقدر\s+است|کدام\s+است|کدومه|کدوم\s+است|چطوریه|چگونه\s+است|کجاست|چند\s+تومنه|چند\s+در\s+میاد)$/i,
    /(?:داری|دارید|دارین|موجود\s+دارید|موجود\s+دارین|موجود\s+هست|موجوده|امکانش\s+هست|میشه|می‌شه|میشه\s+بگید)$/i,
    /(?:چه\s+فرقی\s+دارند|چه\s+فرقی\s+دارن|چه\s+تفاوتی\s+داره|کدوم\s+بهتره|کدام\s+بهتر\s+است|بهتره|درسته)$/i,
    /(?:آیا\s+.+)$/i,
    /(?:کی\s+می‌رسه|کی\s+آماده\s+می‌شه|کی\s+ارسال\s+می‌شه|ضمانت\s+داره|گارانتی\s+داره)$/i,
  ];

  for (const pattern of questionEndings) {
    if (pattern.test(clean)) {
      return {
        isComplete: true,
        isQuestion: true,
        isMidThought: false,
        confidence: 0.95,
        recommendedPauseMs: 950, // Prompt cutoff for finished questions
        detectedReason: 'پرسش و استعلام پایانی کاربر',
      };
    }
  }

  // 4. Persian Request / Inquiry / Imperative Verbs
  const requestEndings = [
    /(?:می‌خواهم|میخوام|می‌خوام|میخواستم|می‌خواستم|نیاز\s+دارم|لازم\s+دارم)$/i,
    /(?:بگید|بفرمایید|توضیح\s+دهید|توضیح\s+بدید|راهنمایی\s+کنید|راهنمایی\s+بفرمایید|کمکم\s+کنید)$/i,
    /(?:محاسبه\s+کنید|معادل‌یابی\s+کنید|پیشنهاد\s+دهید|پیشنهاد\s+بدید|معرفی\s+کنید)$/i,
    /(?:پیش‌فاکتور\s+می‌خوام|پیش\s+فاکتور\s+بدید|استعلام\s+قیمت\s+می‌خواهم|ارسال\s+کنید|صادر\s+کنید|ثبت\s+کنید)$/i,
  ];

  for (const pattern of requestEndings) {
    if (pattern.test(clean)) {
      return {
        isComplete: true,
        isQuestion: false,
        isMidThought: false,
        confidence: 0.92,
        recommendedPauseMs: 1000,
        detectedReason: 'فعل درخواستی و پایانی جمله',
      };
    }
  }

  // 5. Politeness / Closing Tokens
  const politeEndings = [
    /(?:ممنون|ممنونم|متشکرم|تشکر|خیلی\s+ممنون|سپاسگزارم|سپاس|لطفاً|لطفا|دستت\s+درد\s+نکنه|دستتون\s+درد\s+نکنه)$/i,
    /(?:سلام|درود|خسته\s+نباشید|خداحافظ|روز\s+خوش|موفق\s+باشید)$/i,
  ];

  for (const pattern of politeEndings) {
    if (pattern.test(clean)) {
      return {
        isComplete: true,
        isQuestion: false,
        isMidThought: false,
        confidence: 0.9,
        recommendedPauseMs: 950,
        detectedReason: 'عبارت تشکر یا اختتام مکالمه',
      };
    }
  }

  // 6. Common terminal Persian verbs (بود، شد، رفت، دارد، کرد، است، نیست)
  const commonVerbs = [
    /(?:هست|نیست|دارد|ندارد|است|شد|شده|شده\s+است|می‌شود|میشه|کرد|کرده|می‌کند|میکنه|بفرستید|باشه|بزنید)$/i,
  ];

  for (const pattern of commonVerbs) {
    if (pattern.test(clean)) {
      return {
        isComplete: true,
        isQuestion: false,
        isMidThought: false,
        confidence: 0.85,
        recommendedPauseMs: 1150,
        detectedReason: 'فعل خبری استاندارد در پایان جمله',
      };
    }
  }

  // 7. General fallback: if sentence has at least 3 words, default to natural conversational pause
  const wordCount = clean.split(/\s+/).length;
  if (wordCount >= 4) {
    return {
      isComplete: true,
      isQuestion: false,
      isMidThought: false,
      confidence: 0.72,
      recommendedPauseMs: 1350, // Balanced natural conversation pause
      detectedReason: 'مکث پس از بیان عبارت کامل',
    };
  }

  // Default short utterance
  return {
    isComplete: false,
    isQuestion: false,
    isMidThought: true,
    confidence: 0.45,
    recommendedPauseMs: 1700,
    detectedReason: 'عبارت کوتاه در حال تکمیل',
  };
}

/**
 * Calculates Root Mean Square (RMS) volume and frequency spectrum from an AnalyserNode
 */
export function calculateAudioMetrics(analyser: AnalyserNode, timeBuffer: Uint8Array, freqBuffer: Uint8Array): {
  rms: number;
  peakDb: number;
  averageFrequency: number;
  voiceBandEnergy: number;
} {
  analyser.getByteTimeDomainData(timeBuffer as any);
  analyser.getByteFrequencyData(freqBuffer as any);

  let sumSquares = 0;
  for (let i = 0; i < timeBuffer.length; i++) {
    const normalized = (timeBuffer[i] - 128) / 128;
    sumSquares += normalized * normalized;
  }
  const rms = Math.sqrt(sumSquares / timeBuffer.length);

  // Focus on Persian vocal formant frequencies (150Hz to 3200Hz)
  // Assuming 44.1kHz or 48kHz, bin width ~ 43Hz for fftSize 512
  const minBin = Math.max(1, Math.floor(150 / 43));
  const maxBin = Math.min(freqBuffer.length - 1, Math.ceil(3200 / 43));
  let voiceSum = 0;
  let totalFreqSum = 0;

  for (let i = 0; i < freqBuffer.length; i++) {
    totalFreqSum += freqBuffer[i];
    if (i >= minBin && i <= maxBin) {
      voiceSum += freqBuffer[i];
    }
  }

  const voiceBandEnergy = voiceSum / (maxBin - minBin + 1) / 255;
  const averageFrequency = totalFreqSum / freqBuffer.length / 255;
  const peakDb = rms > 0 ? 20 * Math.log10(rms) : -100;

  return {
    rms,
    peakDb,
    averageFrequency,
    voiceBandEnergy,
  };
}

/**
 * Converts Float32Array from Web Audio API into 16-bit PCM Int16Array
 */
export function float32ToInt16PCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}

/**
 * Encodes Int16Array PCM buffer to Base64 string
 */
export function pcm16ToBase64(int16Array: Int16Array): string {
  const buffer = new Uint8Array(int16Array.buffer, int16Array.byteOffset, int16Array.byteLength);
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

/**
 * Decodes Base64 string to 16-bit PCM Int16Array
 */
export function base64ToPCM16(base64: string): Int16Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
}

/**
 * Converts Int16Array PCM data into a playable Web Audio API AudioBuffer
 */
export function pcm16ToAudioBuffer(
  pcmData: Int16Array,
  audioCtx: AudioContext,
  sampleRate = 24000
): AudioBuffer {
  const audioBuffer = audioCtx.createBuffer(1, pcmData.length, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  for (let i = 0; i < pcmData.length; i++) {
    channelData[i] = pcmData[i] / 32768.0;
  }
  return audioBuffer;
}

/**
 * Downsamples Float32Array audio buffer from inputSampleRate to outputSampleRate (e.g. 48kHz -> 16kHz)
 */
export function downsampleAudioBuffer(
  buffer: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number
): Float32Array {
  if (outputSampleRate >= inputSampleRate) {
    return buffer;
  }
  const ratio = inputSampleRate / outputSampleRate;
  const newLength = Math.floor(buffer.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const srcIndex = Math.floor(i * ratio);
    result[i] = buffer[srcIndex] || 0;
  }
  return result;
}

/**
 * Wrap raw PCM into a standard RIFF WAV container for fallback audio elements
 */
export function pcm16ToWavBlob(pcmData: Int16Array, sampleRate = 24000, numChannels = 1): Blob {
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const dataSize = pcmData.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Copy PCM samples
  const pcmBytes = new Uint8Array(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength);
  new Uint8Array(buffer, 44).set(pcmBytes);

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Decodes a base64 audio data URI (mp3, wav, webm) into an AudioBuffer
 */
export async function decodeBase64ToAudioBuffer(
  base64AudioUri: string,
  audioCtx: AudioContext
): Promise<AudioBuffer | null> {
  try {
    const base64Data = base64AudioUri.replace(/^data:[^;]+;base64,/, '');
    const binary = atob(base64Data);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const arrayBuffer = bytes.buffer;
    return await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  } catch (err) {
    console.warn('[AudioDecode] Error decoding base64 audio buffer:', err);
    return null;
  }
}
