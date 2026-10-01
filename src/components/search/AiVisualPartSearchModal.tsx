import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  UploadCloud,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Ruler,
  Sliders,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  ShoppingCart,
  Zap,
  Info,
  Check,
  RotateCcw,
  ShieldCheck,
  Eye,
  Wrench,
  Phone,
  MessageCircle,
  Scan,
  Target,
  Cpu,
  Activity,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import {
  aiVisualSearchService,
  AiPartAnalysisResult,
  AiAnalysisStage,
  INDUSTRIAL_PRESET_SAMPLES,
  IndustrialPresetSample,
} from '../../services/aiVisualSearchService';
import { getProductImageUrl } from '../../assets/imagesproducts';
import { toPersianDigits, formatPrice } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { pricingCreditService } from '../../services/pricingCreditService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type WizardStep = 1 | 2 | 3 | 'analyzing' | 'results';

interface AnalysisPhase {
  title: string;
  en: string;
  icon: React.ElementType;
  tag: string;
  detail: string;
}

const ANALYSIS_PHASES: AnalysisPhase[] = [
  {
    title: 'اسکن هندسه مقطع و دندانه‌ها',
    en: 'GEOMETRY SCAN',
    icon: Scan,
    tag: 'هندسه و مقطع',
    detail: 'بررسی عمق و زاویه شیار',
  },
  {
    title: 'محاسبه گام و ابعاد استاندارد',
    en: 'PITCH & DIMENSIONS',
    icon: Ruler,
    tag: 'گام و ابعاد',
    detail: 'اندازه‌گیری گام برحسب میلیمتر',
  },
  {
    title: 'تشخیص ساختار و نوع متریال',
    en: 'MATERIAL IDENTIFICATION',
    icon: Layers,
    tag: 'نوع متریال',
    detail: 'تشخیص پلی‌یورتان یا لاستیک',
  },
  {
    title: 'انطباق با کاتالوگ قطعات اطلس',
    en: 'CATALOG MATCHING',
    icon: Cpu,
    tag: 'کاتالوگ اطلس',
    detail: 'بررسی موجودی و کدهای معادل',
  },
];

export const AiVisualPartSearchModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { currentUser } = useAuth();

  // Wizard state: 1: Image, 2: Dimensions, 3: Application & Features, 'analyzing', 'results'
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Form states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [length, setLength] = useState<string>('');

  // Dynamic scanning simulation state while analyzing
  const [analysisProgress, setAnalysisProgress] = useState<number>(18);
  const [analysisPhaseIndex, setAnalysisPhaseIndex] = useState<number>(0);

  React.useEffect(() => {
    if (currentStep !== 'analyzing') {
      setAnalysisProgress(18);
      setAnalysisPhaseIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 94) return 94;
        const jump = Math.floor(Math.random() * 7) + 5;
        return Math.min(prev + jump, 94);
      });
      setAnalysisPhaseIndex(prev => (prev + 1) % ANALYSIS_PHASES.length);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentStep]);
  const [width, setWidth] = useState<string>('');
  const [pitch, setPitch] = useState<string>('');
  const [application, setApplication] = useState<string>('');
  const [features, setFeatures] = useState<string>('');

  // Camera stream state
  const [isUsingCamera, setIsUsingCamera] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Analysis result & error
  const [analysisResult, setAnalysisResult] = useState<AiPartAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [showSimilar, setShowSimilar] = useState<boolean>(false);

  // Short part family for dynamic titles, e.g. «این چرخ‌دهنده‌ها را داریم».
  // Different per product type (wheel / belt / pulley / bush / ...).
  const partFamily =
    (analysisResult?.summary?.partFamilyFarsi || '').trim() ||
    (analysisResult?.summary?.detectedPartType || '').split(/[()/،,]/)[0].trim().split(/\s+/)[0] ||
    '';
  const partFamilyPlural = partFamily ? partFamily + '\u200cها' : 'اقلام مشابه';

  // Two-stage flow: 'quick' = image-only instant ID, 'refined' = image + dims + application
  const [pendingStage, setPendingStage] = useState<AiAnalysisStage>('refined');
  const [lastStage, setLastStage] = useState<AiAnalysisStage>('refined');

  // Quick preset chips for applications and features
  const APPLICATION_SUGGESTIONS = [
    'کوره رولری پخت کاشی و سرامیک',
    'خط لعاب‌کاری و چاپ دیجیتال',
    'فن‌های مکنده و کمپرسور باد',
    'ماشین‌آلات بسته‌بندی پرسرعت',
    'پرس هیدرولیک و اکسترودر',
    'نوار نقاله و خطوط انتقال مواد',
  ];

  const FEATURE_SUGGESTIONS = [
    'مقاوم به حرارت بالا (تا ۱۲۰۰ درجه)',
    'ضدروغن، اسید و گریس صنعتی',
    'روکش پارچه‌ای ضدسایش (بی‌صدا)',
    'کورد استیل ضدزنگ و تقویت‌شده',
    'بدون لغزش دندانه و انعطاف بالا',
  ];

  // Handle file drop / select
  const handleFile = async (file: File) => {
    try {
      setErrorMessage('');
      const converted = await aiVisualSearchService.fileToBase64(file);
      setSelectedImage(converted.base64);
      setMimeType(converted.mimeType);
      if (isUsingCamera) stopCamera();
    } catch {
      setErrorMessage('خطا در خواندن فایل تصویر. لطفاً تصویر دیگری انتخاب نمایید.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Preset sample loader
  const loadPreset = (preset: IndustrialPresetSample) => {
    setSelectedImage(preset.imageUrl);
    setMimeType('image/jpeg');
    setLength(preset.length.toString());
    setWidth(preset.width.toString());
    if (preset.pitch) setPitch(preset.pitch.toString());
    else setPitch('');
    setApplication(preset.application);
    setFeatures(preset.features);
    setErrorMessage('');
    if (isUsingCamera) stopCamera();
    // Move to step 2 directly with preset data for quick flow
    setCurrentStep(2);
  };

  // Camera start / stop / capture
  const startCamera = async () => {
    try {
      setIsUsingCamera(true);
      setErrorMessage('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setIsUsingCamera(false);
      setErrorMessage('دسترسی به دوربین برقرار نشد. لطفاً از آپلود فایل یا تصاویر نمونه استفاده کنید.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsUsingCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setSelectedImage(dataUrl);
        setMimeType('image/jpeg');
        stopCamera();
      }
    }
  };

  // Reset all
  const resetForm = () => {
    stopCamera();
    setSelectedImage(null);
    setLength('');
    setWidth('');
    setPitch('');
    setApplication('');
    setFeatures('');
    setAnalysisResult(null);
    setErrorMessage('');
    setPendingStage('refined');
    setLastStage('refined');
    setCurrentStep(1);
  };

  // Navigation handlers
  const goToStep2 = () => {
    setErrorMessage('');
    setCurrentStep(2);
  };

  const goToStep3 = () => {
    if (!length && !width && !selectedImage) {
      setErrorMessage('لطفاً طول و عرض تقریبی را وارد نمایید یا در مرحله قبل تصویر بارگذاری کنید.');
      return;
    }
    setErrorMessage('');
    setCurrentStep(3);
  };

  // Submit to AI (two-stage: quick = image only, refined = image + dims + application)
  const handleAnalyze = async (stage: AiAnalysisStage = 'refined') => {
    if (!selectedImage && !length && !width) {
      setErrorMessage('لطفاً حداقل تصویر قطعه یا ابعاد (طول و عرض) را مشخص فرمایید.');
      return;
    }
    if (stage === 'quick' && !selectedImage) {
      setErrorMessage('برای شناسایی فوری، ابتدا تصویر قطعه را بارگذاری کنید.');
      return;
    }

    setErrorMessage('');
    setPendingStage(stage);
    setCurrentStep('analyzing');

    try {
      const result = await aiVisualSearchService.analyzePartWithAi({
        imageBase64: selectedImage || undefined,
        mimeType: mimeType,
        length: length ? parseFloat(length) : undefined,
        width: width ? parseFloat(width) : undefined,
        pitch: pitch ? parseFloat(pitch) : undefined,
        application: application.trim() || undefined,
        features: features.trim() || undefined,
        stage,
      });

      setAnalysisResult(result);
      setLastStage(result.stage || stage);
      setCurrentStep('results');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'خطا در ارتباط با سامانه تحلیل هوش مصنوعی.');
      setCurrentStep(stage === 'quick' ? 1 : 3);
    }
  };

  // Resolve a match image that may be a bare catalog filename (e.g. "e(001).png")
  const resolveMatchImage = (match: any, catalogItem: any): string => {
    const raw: string =
      (catalogItem?.images && catalogItem.images[0]) || catalogItem?.image || match?.image || '';
    if (raw && /^e\(\d+\)\.png$/i.test(raw.trim())) {
      return getProductImageUrl(raw.trim());
    }
    return raw;
  };

  // Calculate inquiry price for user
  const getItemPrice = (catalogItem?: any) => {
    if (!catalogItem) return null;
    const inquiry = pricingCreditService.calculateInquiryPrice(
      catalogItem,
      currentUser?.assignedPriceListId,
      currentUser?.assignedGradeId
    );
    return inquiry;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopCamera();
        onClose();
      }}
      title="شناسایی هوشمند قطعه و تسمه با هوش مصنوعی"
      maxWidth={currentStep === 'analyzing' || currentStep === 'results' ? 'xl' : 'lg'}
    >
      <div className="text-right space-y-5">
        {/* TOP STEPPER (Only visible during steps 1, 2, 3) */}
        {typeof currentStep === 'number' && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
            <div className="flex items-center justify-between max-w-md mx-auto relative">
              {/* Stepper connecting line */}
              <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
              <div
                className="absolute top-1/2 right-6 -translate-y-1/2 h-0.5 bg-[#E06518] transition-all duration-300 z-0"
                style={{
                  width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
                }}
              />

              {/* Step 1 Item */}
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`relative z-10 flex flex-col items-center gap-1.5 cursor-pointer group transition-all`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    currentStep === 1
                      ? 'bg-[#E06518] text-white ring-4 ring-orange-100 shadow-sm'
                      : currentStep > 1
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-slate-400 border border-slate-300'
                  }`}
                >
                  {currentStep > 1 ? <Check className="w-4 h-4" /> : '۱'}
                </div>
                <span
                  className={`text-[11px] font-bold ${
                    currentStep === 1 ? 'text-[#E06518]' : 'text-slate-600'
                  }`}
                >
                  تصویر قطعه
                </span>
              </button>

              {/* Step 2 Item */}
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className={`relative z-10 flex flex-col items-center gap-1.5 cursor-pointer group transition-all`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    currentStep === 2
                      ? 'bg-[#E06518] text-white ring-4 ring-orange-100 shadow-sm'
                      : currentStep > 2
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-slate-400 border border-slate-300'
                  }`}
                >
                  {currentStep > 2 ? <Check className="w-4 h-4" /> : '۲'}
                </div>
                <span
                  className={`text-[11px] font-bold ${
                    currentStep === 2 ? 'text-[#E06518]' : 'text-slate-600'
                  }`}
                >
                  طول و عرض
                </span>
              </button>

              {/* Step 3 Item */}
              <button
                type="button"
                onClick={() => {
                  if (selectedImage || length || width) {
                    setCurrentStep(3);
                  }
                }}
                className={`relative z-10 flex flex-col items-center gap-1.5 cursor-pointer group transition-all`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    currentStep === 3
                      ? 'bg-[#E06518] text-white ring-4 ring-orange-100 shadow-sm'
                      : 'bg-white text-slate-400 border border-slate-300'
                  }`}
                >
                  ۳
                </div>
                <span
                  className={`text-[11px] font-bold ${
                    currentStep === 3 ? 'text-[#E06518]' : 'text-slate-600'
                  }`}
                >
                  کاربرد و ویژگی‌ها
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Error notification banner */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* MAIN STEP CONTENT AREA WITH MOTION ANIMATION */}
        <AnimatePresence mode="wait">
          {/* ============================================================ */}
          {/* STEP 1: IMAGE CAPTURE & UPLOAD                               */}
          {/* ============================================================ */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-5"
            >
              {/* Header Title */}
              <div className="text-center space-y-1">
                <h4 className="text-base font-black text-[#55565A] flex items-center justify-center gap-2">
                  <Camera className="w-5 h-5 text-[#E06518]" />
                  <span>مرحله اول: بارگذاری تصویر تسمه یا قطعه</span>
                </h4>
                <p className="text-xs text-slate-500">
                  یک عکس واضح از مقطع یا دندانه‌های قطعه بارگذاری کنید یا با دوربین عکس بگیرید.
                </p>
              </div>

              {/* Upload Dropzone / Camera View / Selected Image */}
              {!selectedImage && !isUsingCamera ? (
                <div
                  onDragOver={e => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-[#E06518] bg-orange-50/60 scale-[1.01]'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 hover:border-slate-300'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        handleFile(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-[#E06518] mb-3">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-sm text-[#55565A]">
                    عکس قطعه را اینجا بکشید یا برای انتخاب کلیک کنید
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    پشتیبانی از انواع فرمت‌های JPG، PNG و WEBP
                  </span>

                  <div className="mt-5 pt-4 border-t border-slate-200 w-full max-w-xs flex justify-center">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        startCamera();
                      }}
                      className="h-10 px-5 bg-white hover:bg-orange-50 border border-slate-300 hover:border-[#E06518] text-[#55565A] rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <Camera className="w-4 h-4 text-[#E06518]" />
                      <span>عکس‌برداری با دوربین گوشی یا لپ‌تاپ</span>
                    </button>
                  </div>
                </div>
              ) : isUsingCamera ? (
                <div className="relative rounded-2xl overflow-hidden bg-[#12203C] border border-slate-800 shadow-md">
                  <div className="aspect-video max-h-72 w-full flex items-center justify-center bg-[#12203C]">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3 px-4">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="h-10 px-5 bg-[#E06518] hover:bg-[#C95210] text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      <span>ثبت عکس قطعه</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="h-10 px-4 bg-white/90 hover:bg-white text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-all"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              ) : (
                /* Selected Image Preview */
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full sm:w-44 h-36 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 relative shrink-0">
                    <img
                      src={selectedImage || undefined}
                      alt="قطعه انتخابی"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>عکس بارگذاری شد</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 text-right">
                    <span className="text-xs font-bold text-[#55565A] block">
                      تصویر آماده پردازش هوش مصنوعی است
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      هوش مصنوعی مستقیماً بر اساس ظاهر فیزیکی قطعه در عکس، تصاویر کاتالوگ محصولات را مقایسه و محصول دقیق را پیدا می‌کند.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-bold text-slate-700 hover:text-[#E06518] bg-white border border-slate-200 hover:border-orange-300 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        تغییر تصویر
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          stopCamera();
                        }}
                        className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        حذف تصویر
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sample Presets for Quick Testing */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 block">
                  یا جهت تست سریع، یکی از نمونه‌های آماده صنعتی را انتخاب نمایید:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {INDUSTRIAL_PRESET_SAMPLES.map(sample => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => loadPreset(sample)}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-orange-50/70 hover:border-[#E06518] text-right transition-all cursor-pointer flex flex-col justify-between group shadow-2xs"
                    >
                      <div>
                        <div className="font-bold text-[11px] text-[#55565A] group-hover:text-[#E06518] line-clamp-1">
                          {sample.title}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {sample.length}×{sample.width}mm
                        </div>
                      </div>
                      <span className="text-[10px] text-[#E06518] font-bold mt-2 inline-flex items-center gap-0.5">
                        <span>انتخاب سریع</span>
                        <ChevronLeft className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 1 Actions */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
                >
                  پاک کردن فرم
                </button>

                <div className="flex items-center gap-2">
                  {selectedImage && (
                    <button
                      type="button"
                      onClick={() => handleAnalyze('quick')}
                      className="h-11 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>شناسایی فوری فقط با تصویر</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={goToStep2}
                    className="h-11 px-5 bg-[#E06518] hover:bg-[#C95210] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>مرحله بعد: ابعاد اختیاری</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: DIMENSIONS (LENGTH & WIDTH)                          */}
          {/* ============================================================ */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-5"
            >
              {/* Header Title */}
              <div className="text-center space-y-1">
                <h4 className="text-base font-black text-[#55565A] flex items-center justify-center gap-2">
                  <Ruler className="w-5 h-5 text-[#E06518]" />
                  <span>مرحله دوم: مشخص کردن طول و عرض محصول</span>
                </h4>
                <p className="text-xs text-slate-500">
                  ابعاد فیزیکی قطعه را برحسب میلی‌متر وارد نمایید تا انطباق دقیق در کاتالوگ انجام گیرد.
                </p>
              </div>

              {/* Context bar showing if image was selected */}
              {selectedImage && (
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedImage}
                      alt="قطعه"
                      className="w-10 h-10 object-cover rounded-lg border border-emerald-200 bg-[#12203C]"
                    />
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block">
                        تصویر قطعه دریافت شد
                      </span>
                      <span className="text-[10px] text-emerald-700">
                        اکنون ابعاد قطعه را وارد نمایید
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                  >
                    تغییر عکس
                  </button>
                </div>
              )}

              {/* Dimensions Input Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Length Input */}
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-[#55565A]">
                    طول قطعه یا تسمه (میلی‌متر) <span className="text-[#E06518]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      dir="ltr"
                      value={length}
                      onChange={e => setLength(e.target.value)}
                      placeholder="مثلاً 1760"
                      className="w-full h-11 px-3 border border-slate-300 rounded-xl text-sm font-mono text-left focus:border-[#E06518] focus:bg-white focus:outline-none bg-white shadow-2xs"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono pointer-events-none">
                      mm
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    محیط دور بیرونی، طول گام دندانه یا طول کلی رولیک/نوار
                  </p>
                </div>

                {/* Width Input */}
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-[#55565A]">
                    عرض مقطع (میلی‌متر) <span className="text-[#E06518]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      dir="ltr"
                      value={width}
                      onChange={e => setWidth(e.target.value)}
                      placeholder="مثلاً 50 یا 13"
                      className="w-full h-11 px-3 border border-slate-300 rounded-xl text-sm font-mono text-left focus:border-[#E06518] focus:bg-white focus:outline-none bg-white shadow-2xs"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono pointer-events-none">
                      mm
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    پهنای پشت تسمه، قطر لوله رولیک یا ضخامت نوار
                  </p>
                </div>
              </div>

              {/* Optional Pitch / Tooth Profile */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#55565A]">
                    فاصله گام دندانه‌ها یا ضخامت (اختیاری)
                  </label>
                  <span className="text-[10px] text-slate-400">اختیاری</span>
                </div>
                <div className="relative max-w-sm">
                  <input
                    type="number"
                    dir="ltr"
                    value={pitch}
                    onChange={e => setPitch(e.target.value)}
                    placeholder="مثلاً 8 برای گام 8M یا 10 برای T10"
                    className="w-full h-10 px-3 border border-slate-300 rounded-xl text-xs font-mono text-left focus:border-[#E06518] focus:bg-white focus:outline-none bg-white shadow-2xs"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono pointer-events-none">
                    mm
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  فاصله نوک یک دندانه تا نوک دندانه بعدی بر حسب میلی‌متر (در صورت نامشخص بودن خالی بگذارید).
                </p>
              </div>

              {/* Step 2 Actions (Back & Next) */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>بازگشت به مرحله تصویر</span>
                </button>

                <button
                  type="button"
                  onClick={goToStep3}
                  className="h-11 px-6 bg-[#E06518] hover:bg-[#C95210] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>مرحله بعد: کاربرد و ویژگی‌ها</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: APPLICATION & FEATURES (FINAL STEP BEFORE AI)        */}
          {/* ============================================================ */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-5"
            >
              {/* Header Title */}
              <div className="text-center space-y-1">
                <h4 className="text-base font-black text-[#55565A] flex items-center justify-center gap-2">
                  <Sliders className="w-5 h-5 text-[#E06518]" />
                  <span>مرحله سوم: برای چه کاری می‌خواهید؟ و ویژگی‌های محصول</span>
                </h4>
                <p className="text-xs text-slate-500">
                  نوع دستگاه و شرایط کاری را مشخص فرمایید تا بهترین قطعه سازگار انتخاب شود.
                </p>
              </div>

              {/* Compact Review of Steps 1 & 2 */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  {selectedImage ? (
                    <img
                      src={selectedImage}
                      alt="قطعه"
                      className="w-9 h-9 object-cover rounded-lg border border-slate-300 bg-[#12203C]"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500">
                      <Camera className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-[#55565A] block">
                      {selectedImage ? 'تصویر دارد' : 'بدون تصویر'}
                    </span>
                    <span className="text-slate-500 text-[11px] font-mono">
                      طول: {length ? `${length}mm` : 'نامشخص'} | عرض: {width ? `${width}mm` : 'نامشخص'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs text-[#E06518] font-bold hover:underline cursor-pointer"
                >
                  ویرایش ابعاد
                </button>
              </div>

              {/* 1. Application / Purpose */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#55565A] flex items-center justify-between">
                  <span>برای چه کاری می‌خواهید؟ (دستگاه یا صنعت مورد نظر)</span>
                  <span className="text-[11px] text-slate-400 font-normal">توصیه شده</span>
                </label>
                <textarea
                  rows={2}
                  value={application}
                  onChange={e => setApplication(e.target.value)}
                  placeholder="مثال: برای کوره رولری پخت سوم کاشی، فن مکنده صنعتی، خط انتقال بسته‌بندی، نساجی، سنگبری..."
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:border-[#E06518] focus:bg-white focus:outline-none bg-slate-50/50 resize-none transition-colors"
                />

                {/* Quick Application Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold ml-1">پیشنهاد سریع:</span>
                  {APPLICATION_SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setApplication(item)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        application === item
                          ? 'bg-orange-50 border-[#E06518] text-[#E06518] font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Features / Environmental requirements */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#55565A] flex items-center justify-between">
                  <span>ویژگی خاص یا الزامات فنی قطعه</span>
                  <span className="text-[11px] text-slate-400 font-normal">اختیاری</span>
                </label>
                <input
                  type="text"
                  value={features}
                  onChange={e => setFeatures(e.target.value)}
                  placeholder="مثال: مقاومت به حرارت ۱۲۰۰ درجه، ضدروغن و گریس، روکش ضدسایش دندانه، کورد استیل..."
                  className="w-full h-10 px-3 border border-slate-300 rounded-xl text-xs focus:border-[#E06518] focus:bg-white focus:outline-none bg-slate-50/50 transition-colors"
                />

                {/* Quick Feature Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold ml-1">ویژگی‌های پرکاربرد:</span>
                  {FEATURE_SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (features.includes(item)) return;
                        setFeatures(features ? `${features}، ${item}` : item);
                      }}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-[#E06518] hover:text-[#E06518] transition-all cursor-pointer"
                    >
                      + {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3 Actions: Back to Step 2 & Trigger AI Analysis */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>بازگشت به مرحله ابعاد</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAnalyze('refined')}
                  className="h-11 px-7 bg-[#E06518] hover:bg-[#C95210] text-white rounded-xl text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{lastStage === 'quick' ? 'تحلیل دقیق نهایی با ابعاد' : 'تحلیل هوش مصنوعی و یافتن کالا'}</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* STEP: ANALYZING STATE (Bright, Delightful Studio Scanner)    */}
          {/* ============================================================ */}
          {currentStep === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* IMAGE VIEWPORT CONTAINER (Bright Studio Frame) */}
              <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-white border border-slate-200/90 shadow-lg shadow-slate-200/50">
                {/* Clean Delightful Top Header */}
                <div className="relative z-30 px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[#55565A]">
                      شناسایی و آنالیز هوشمند قطعه
                    </span>
                    <span className="hidden sm:inline text-slate-300">|</span>
                    <span className="hidden sm:inline text-[11px] text-slate-400">
                      پردازش ابعاد و متریال
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-[#C95210] text-xs font-bold font-mono shadow-2xs">
                      {toPersianDigits(analysisProgress)}٪ در حال بررسی
                    </div>
                  </div>
                </div>

                {/* THE IMAGE DISPLAY & VIBRANT LASER LINE */}
                <div className="relative w-full h-72 sm:h-84 md:h-96 flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-orange-50/20 select-none">
                  {/* Subtle Light Blueprint Dot Grid */}
                  <div
                    className="absolute inset-0 opacity-40 pointer-events-none"
                    style={{
                      backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
                      backgroundSize: '24px 24px',
                    }}
                  />

                  {/* Soft Warm Radial Aura */}
                  <div className="absolute w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-orange-200/25 via-amber-100/20 to-transparent pointer-events-none blur-2xl" />

                  {/* Elegant Corner Framing Brackets */}
                  <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-orange-400/70 rounded-tr-md pointer-events-none z-10" />
                  <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-orange-400/70 rounded-tl-md pointer-events-none z-10" />
                  <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-orange-400/70 rounded-br-md pointer-events-none z-10" />
                  <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-orange-400/70 rounded-bl-md pointer-events-none z-10" />

                  {/* The uploaded part image (blends smoothly on light background) */}
                  {selectedImage ? (
                    <img
                      src={selectedImage}
                      alt="قطعه صنعتی در حال آنالیز"
                      className="max-h-full max-w-full object-contain relative z-10 p-6 drop-shadow-md"
                    />
                  ) : (
                    <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center shadow-xs">
                        <Cpu className="w-8 h-8 text-[#E06518] animate-pulse" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        در حال انطباق بر اساس مشخصات ابعادی
                      </span>
                    </div>
                  )}

                  {/* ENERGETIC, VIBRANT LASER SCANNER LINE */}
                  <motion.div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    animate={{
                      top: ['3%', '95%', '3%'],
                    }}
                    transition={{
                      duration: 2.8,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    {/* Warm light wash trailing above laser */}
                    <div className="h-20 -mt-20 w-full bg-gradient-to-b from-transparent via-orange-400/10 to-orange-500/25 pointer-events-none" />

                    {/* Crisp glowing laser beam line */}
                    <div className="relative h-[2.5px] w-full bg-gradient-to-r from-transparent via-[#E06518] via-amber-400 to-transparent shadow-[0_0_14px_3px_rgba(249,115,22,0.45)]" />

                    {/* Center floating scan badge */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/95 border border-orange-200/90 text-[10px] font-bold text-[#C95210] shadow-sm backdrop-blur-md whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E06518] animate-pulse" />
                      <span>اسکن نوری و هندسی</span>
                    </div>
                  </motion.div>
                </div>

                {/* Shimmering Progress Bar */}
                <div className="w-full h-1.5 bg-slate-100 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-orange-400 via-amber-400 to-emerald-500"
                    style={{ width: `${analysisProgress}%` }}
                    transition={{ ease: 'easeOut', duration: 0.3 }}
                  />
                </div>

                {/* Delightful Bottom Status Section */}
                <div className="p-4 sm:p-5 bg-white border-t border-slate-100 space-y-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#55565A] font-bold flex items-center gap-2 text-xs sm:text-sm">
                      <Sparkles className="w-4 h-4 text-[#E06518]" />
                      <span>{ANALYSIS_PHASES[analysisPhaseIndex].title}</span>
                    </span>
                    <span className="text-slate-500 text-[11px] font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                      مرحله {toPersianDigits(analysisPhaseIndex + 1)} از ۴
                    </span>
                  </div>

                  {/* 4 Fresh Delightful Step Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ANALYSIS_PHASES.map((phase, idx) => {
                      const isCurrent = idx === analysisPhaseIndex;
                      const isDone = idx < analysisPhaseIndex;

                      return (
                        <div
                          key={idx}
                          className={`px-3 py-2.5 rounded-xl text-center transition-all text-xs flex items-center justify-center gap-1.5 border ${
                            isCurrent
                              ? 'bg-orange-50 text-[#C95210] font-bold border-orange-300 shadow-xs'
                              : isDone
                              ? 'bg-emerald-50 text-emerald-700 font-semibold border-emerald-200'
                              : 'bg-slate-50/70 text-slate-500 border-slate-200/70'
                          }`}
                        >
                          {isDone ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : isCurrent ? (
                            <span className="w-2 h-2 rounded-full bg-[#E06518] animate-pulse shrink-0" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                          )}
                          <span className="truncate">{phase.tag}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reassuring Friendly Note */}
                  <div className="pt-1 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      در حال تطبیق هوشمند با کاتالوگ جامع ۸۶۴ قلمی قطعات و تسمه‌های صنعتی بازرگانی اطلس
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* STEP: RESULTS VIEW                                           */}
          {/* ============================================================ */}
          {currentStep === 'results' && analysisResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-5"
            >
              {/* Fallback / AI-error notices */}
              {!analysisResult.isAiGenerated && analysisResult.fallbackNotice && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold block">حالت تطبیق مهندسی (بدون هوش مصنوعی)</span>
                    <span className="leading-relaxed block">{analysisResult.fallbackNotice}</span>
                    {analysisResult.aiError && (
                      <span className="block text-[10px] text-amber-700 font-mono" dir="ltr">
                        Detail: {analysisResult.aiError.slice(0, 220)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Summary Bar */}
              <div className="bg-[#55565A] text-white p-4 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#E06518] text-white flex items-center justify-center font-bold text-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2 flex-wrap">
                        <span>
                          {analysisResult.isAiGenerated ? 'نتیجه تطبیق قطعه توسط هوش مصنوعی' : 'نتیجه تطبیق قطعه'}
                        </span>
                        {(analysisResult.stage || lastStage) === 'quick' ? (
                          <span className="text-[10px] font-bold bg-teal-500/20 border border-teal-400/40 text-teal-300 px-2 py-0.5 rounded-lg">
                            تحلیل اولیه از روی تصویر
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-orange-500/20 border border-orange-400/40 text-orange-300 px-2 py-0.5 rounded-lg">
                            تحلیل دقیق با ابعاد و مشخصات
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        نوع قطعه: {analysisResult.summary.detectedPartType} | مقطع: {analysisResult.summary.detectedProfile}
                        {analysisResult.summary.material ? ` | جنس: ${analysisResult.summary.material}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ضریب اطمینان: {toPersianDigits(analysisResult.summary.confidence)}٪</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>جستجوی جدید</span>
                    </button>
                  </div>
                </div>

                {/* What the AI literally sees + detected part location on the user image */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {selectedImage && (
                    <div className="relative w-full sm:w-40 h-32 rounded-xl overflow-hidden bg-[#12203C] border border-slate-700 shrink-0" dir="ltr">
                      <img src={selectedImage} alt="تصویر کاربر" className="w-full h-full object-contain" />
                      {analysisResult.summary.boundingBox && (
                        <div
                          className="absolute border-2 border-emerald-400 rounded-md shadow-[0_0_0_2px_rgba(52,211,153,0.35)]"
                          style={{
                            left: `${analysisResult.summary.boundingBox.x_min / 10}%`,
                            top: `${analysisResult.summary.boundingBox.y_min / 10}%`,
                            width: `${(analysisResult.summary.boundingBox.x_max - analysisResult.summary.boundingBox.x_min) / 10}%`,
                            height: `${(analysisResult.summary.boundingBox.y_max - analysisResult.summary.boundingBox.y_min) / 10}%`,
                          }}
                        >
                          <span className="absolute -top-5 left-0 text-[9px] font-bold bg-emerald-400 text-slate-900 px-1.5 py-0.5 rounded whitespace-nowrap">
                            قطعه شناسایی‌شده
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex-1 space-y-2 min-w-0">
                    {analysisResult.summary.whatYouSee && (
                      <p className="text-xs text-teal-200 leading-relaxed bg-teal-500/10 border border-teal-500/30 rounded-xl p-2">
                        <strong>هوش مصنوعی در تصویر می‌بیند: </strong>
                        {analysisResult.summary.whatYouSee}
                      </p>
                    )}
                    {/* Visual Analysis Explanation */}
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {analysisResult.summary.visualAnalysis}
                    </p>
                  </div>
                </div>
              </div>

              {/* Refine CTA: visible after quick (image-only) analysis */}
              {(analysisResult.stage || lastStage) === 'quick' && (
                <div className="p-4 bg-gradient-to-l from-orange-50 to-amber-50 border border-orange-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#E06518] text-white flex items-center justify-center shrink-0">
                      <Ruler className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-black text-sm text-[#55565A]">می‌خوای دقیق‌تر پیدا کنی؟</div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        طول، عرض، گام دندانه و کاربرد دستگاه را وارد کن تا هوش مصنوعی دقیق‌ترین کالای کاتالوگ را معرفی کند.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="h-10 px-5 bg-[#55565A] hover:bg-[#1B293E] text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shrink-0"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>وارد کردن ابعاد و مشخصات</span>
                  </button>
                </div>
              )}

              {/* Visual Verification & Catalog Availability Banner */}
              {analysisResult.summary.catalogAvailability && (
                <div
                  className={`p-4 rounded-2xl border shadow-xs transition-all ${
                    analysisResult.summary.catalogAvailability.status === 'confirmed_in_catalog'
                      ? 'bg-gradient-to-l from-emerald-950 via-[#55565A] to-[#55565A] border-emerald-500/50 text-white'
                      : analysisResult.summary.catalogAvailability.status === 'similar_in_catalog'
                      ? 'bg-gradient-to-l from-blue-950 via-[#55565A] to-[#55565A] border-blue-500/50 text-white'
                      : 'bg-gradient-to-l from-amber-950 via-slate-900 to-[#55565A] border-amber-500/50 text-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        analysisResult.summary.catalogAvailability.status === 'confirmed_in_catalog'
                          ? 'bg-emerald-500 text-white'
                          : analysisResult.summary.catalogAvailability.status === 'similar_in_catalog'
                          ? 'bg-blue-500 text-white'
                          : 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      {analysisResult.summary.catalogAvailability.status === 'confirmed_in_catalog' ? (
                        <ShieldCheck className="w-6 h-6" />
                      ) : analysisResult.summary.catalogAvailability.status === 'similar_in_catalog' ? (
                        <Sparkles className="w-5 h-5" />
                      ) : (
                        <Wrench className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-white">
                          {analysisResult.summary.catalogAvailability.statusFarsiTitle}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                            analysisResult.summary.catalogAvailability.status === 'confirmed_in_catalog'
                              ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                              : analysisResult.summary.catalogAvailability.status === 'similar_in_catalog'
                              ? 'bg-blue-400/20 text-blue-300 border border-blue-400/40'
                              : 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                          }`}
                        >
                          {analysisResult.summary.catalogAvailability.status === 'confirmed_in_catalog'
                            ? 'تأیید انطباق قطعی (همونه)'
                            : analysisResult.summary.catalogAvailability.status === 'similar_in_catalog'
                            ? 'مدل جایگزین سازگار (شبیهه)'
                            : 'امکان ساخت سفارشی اطلس'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {analysisResult.summary.catalogAvailability.statusFarsiMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Exact visual match hero banner */}
              {analysisResult.summary.exactVisualMatch && analysisResult.matchedProducts[0]?.isVisualMatch && (
                <div className="p-3.5 bg-gradient-to-l from-emerald-600 to-teal-600 text-white rounded-2xl flex items-center gap-3 shadow-md">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-sm">🎯 عیناً همین کالا در سایت پیدا شد!</div>
                    <p className="text-[11px] text-emerald-50 leading-relaxed">
                      عکس شما با دقت بسیار بالا با تصویر «{analysisResult.matchedProducts[0].name}» ({analysisResult.matchedProducts[0].code}) در کاتالوگ مطابقت دارد.
                    </p>
                  </div>
                </div>
              )}

              {/* Matched Products List — ONLY 100% exact matches appear here */}
              {analysisResult.matchedProducts.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-[#55565A] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#E06518]" />
                    <span>عین قطعه شما در کاتالوگ پیدا شد ({toPersianDigits(analysisResult.matchedProducts.length)} مورد)</span>
                  </h4>
                  <span className="text-xs text-slate-500">
                    فقط اقلام با انطباق صددرصدی و تأیید راستی‌آزمایی بصری
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysisResult.matchedProducts.map((match, idx) => {
                    const catalogItem = match.catalogProduct;
                    const priceInfo = getItemPrice(catalogItem);

                    return (
                      <div
                        key={match.code + idx}
                        className={`bg-white border rounded-2xl p-4 transition-all shadow-xs hover:shadow-md flex flex-col justify-between space-y-3 ${
                          match.visualVerdict === 'exact_match'
                            ? 'border-emerald-400 ring-1 ring-emerald-200'
                            : 'border-slate-200 hover:border-[#E06518]'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start gap-3">
                            {resolveMatchImage(match, catalogItem) && (
                              <img
                                src={resolveMatchImage(match, catalogItem)}
                                alt={match.name}
                                referrerPolicy="no-referrer"
                                className="w-16 h-16 object-contain rounded-xl border border-slate-200 bg-slate-50 p-1 shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded-lg bg-orange-100 text-[#E06518] font-mono text-xs font-bold">
                                  {match.code}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-emerald-600" />
                                  <span>{toPersianDigits(match.similarityScore)}٪ انطباق</span>
                                </span>
                                {match.visualVerdict && (
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 ${
                                      match.visualVerdict === 'exact_match'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-blue-600 text-white'
                                    }`}
                                  >
                                    {match.visualVerdict === 'exact_match' ? (
                                      <CheckCircle2 className="w-3 h-3" />
                                    ) : (
                                      <Sparkles className="w-3 h-3" />
                                    )}
                                    <span>
                                      {match.visualVerdict === 'exact_match'
                                        ? 'همونه (تأیید تصویری)'
                                        : 'شبیهه (مدل مشابه)'}
                                    </span>
                                  </span>
                                )}
                              </div>

                              <h5 className="font-bold text-sm text-[#55565A] leading-snug mt-1 line-clamp-2">
                                {match.name}
                              </h5>

                              {((match as any).forzaCode || (catalogItem as any)?.forzaCode) && (
                                <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                                  {(match as any).forzaCode || (catalogItem as any)?.forzaCode}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Visual Explanation from Gemini Verification */}
                          {match.visualExplanation ? (
                            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-950 space-y-1">
                              <div className="flex items-center gap-1 font-bold text-emerald-900">
                                <Eye className="w-3.5 h-3.5 text-emerald-700" />
                                <span>راستی‌آزمایی چشمی هوش مصنوعی:</span>
                              </div>
                              <p className="leading-relaxed">{match.visualExplanation}</p>
                            </div>
                          ) : match.distinction ? (
                            <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-200/70 text-[11px] text-blue-900 flex items-start gap-1.5">
                              <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                              <span>
                                <strong>تفاوت عملکردی:</strong> {match.distinction}
                              </span>
                            </div>
                          ) : null}

                          <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">
                            {match.matchReason}
                          </p>

                          {/* Quick Specs */}
                          <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                            {match.specs.slice(0, 4).map((s, sIdx) => (
                              <div key={sIdx} className="bg-slate-50 px-2 py-1 rounded-md text-[10px] text-slate-600 flex justify-between">
                                <span>{s.key}:</span>
                                <span className="font-mono font-bold text-[#55565A]">{s.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Price & Actions */}
                        <div className="pt-3 border-t border-slate-100 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">قیمت / استعلام:</span>
                            {priceInfo ? (
                              <div className="text-left font-bold text-[#55565A]">
                                <span>{formatPrice(priceInfo.calculatedPrice)}</span>
                                {priceInfo.discountPercent > 0 && (
                                  <span className="text-[10px] text-emerald-600 mr-1">
                                    ({toPersianDigits(priceInfo.discountPercent)}٪ تخفیف)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[#E06518] font-bold">استعلام آنلاین</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {catalogItem && (
                              <button
                                type="button"
                                onClick={() => addItem(catalogItem, 1)}
                                className="flex-1 h-9 bg-slate-100 hover:bg-orange-50 hover:text-[#E06518] text-[#55565A] rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>افزودن به سبد</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                navigate(`/product/${match.code}`);
                              }}
                              className="h-9 px-4 bg-[#55565A] hover:bg-[#1B293E] text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>مشاهده کالا</span>
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              ) : (analysisResult.similarCandidates?.length || 0) > 0 ? (
                <div className="space-y-3">
                  {/* ─── TIER 2: «این ...ها را داریم» — closest available items ─── */}
                  <div className="p-5 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-600 text-white shadow-md space-y-1.5">
                    <div className="font-black text-base flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span>این {partFamilyPlural} را داریم</span>
                    </div>
                    <p className="text-xs text-emerald-50 leading-relaxed">
                      عینِ قطعه شما در کاتالوگ موجود نیست، اما این {partFamilyPlural} نزدیک‌ترین اقلام کاتالوگ به عکس شما هستند و همین حالا قابل سفارش‌اند:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analysisResult.similarCandidates!.map((match, idx) => {
                      const catalogItem = match.catalogProduct;
                      const priceInfo = getItemPrice(catalogItem);
                      return (
                        <div
                          key={match.code + idx}
                          className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start gap-3">
                              {resolveMatchImage(match, catalogItem) && (
                                <img
                                  src={resolveMatchImage(match, catalogItem)}
                                  alt={match.name}
                                  referrerPolicy="no-referrer"
                                  className="w-16 h-16 object-contain rounded-xl border border-slate-200 bg-slate-50 p-1 shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-1.5 flex-wrap">
                                  <span className="px-2 py-0.5 rounded-lg bg-orange-100 text-[#E06518] font-mono text-xs font-bold">
                                    {match.code}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    <span>شبیه است — عین قطعه شما نیست</span>
                                  </span>
                                </div>
                                <h5 className="font-bold text-sm text-[#55565A] leading-snug mt-1 line-clamp-2">
                                  {match.name}
                                </h5>
                                {((match as any).forzaCode || (catalogItem as any)?.forzaCode) && (
                                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                                    {(match as any).forzaCode || (catalogItem as any)?.forzaCode}
                                  </span>
                                )}
                              </div>
                            </div>
                            {match.visualExplanation && (
                              <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">
                                {match.visualExplanation}
                              </p>
                            )}
                          </div>
                          <div className="pt-3 border-t border-slate-100 space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">قیمت / استعلام:</span>
                              {priceInfo ? (
                                <span className="font-bold text-[#55565A]">{formatPrice(priceInfo.calculatedPrice)}</span>
                              ) : (
                                <span className="text-[#E06518] font-bold">استعلام آنلاین</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {catalogItem && (
                                <button
                                  type="button"
                                  onClick={() => addItem(catalogItem, 1)}
                                  className="flex-1 h-9 bg-slate-100 hover:bg-orange-50 hover:text-[#E06518] text-[#55565A] rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                                >
                                  <ShoppingCart className="w-3.5 h-3.5" />
                                  <span>افزودن به سبد</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  navigate(`/product/${match.code}`);
                                }}
                                className="h-9 px-4 bg-[#55565A] hover:bg-[#1B293E] text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <span>مشاهده کالا</span>
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ─── TIER 3 (compact): custom order if none of the above fits ─── */}
                  <div className="p-4 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/70 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E06518] text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="font-black text-sm text-[#55565A]">
                          عینِ همین قطعه را می‌خواهید؟ می‌تونیم براتون بسازیم
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          اگر هیچ‌کدام از {partFamilyPlural} بالا مناسب قطعه شما نیست، کارگاه تخصصی هایپر صنعت اطلس
                          ساخت یا تأمین سفارشی <strong>دقیقاً همین قطعه</strong> را انجام می‌دهد؛ عکس را بفرستید تا
                          استعلام قیمت و زمان ساخت اعلام شود.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <a
                        href="tel:03538739900"
                        className="flex-1 h-10 bg-[#55565A] hover:bg-[#1B293E] text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        <span>تماس با اطلس: ۰۳۵-۳۸۷۳۹۹۰۰</span>
                      </a>
                      <a
                        href="https://wa.me/989903427027?text=سلام%2C%20این%20تصویر%20قطعه%20را%20برای%20ساخت%20سفارشی%20ارسال%20می‌کنم"
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>ارسال عکس در واتس‌اپ</span>
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
              /* ─── Custom Order Panel (no similar items at all) ─── */
              <div className="p-5 rounded-2xl border-2 border-dashed border-amber-300 bg-gradient-to-l from-amber-50 via-orange-50 to-amber-50 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#E06518] text-white flex items-center justify-center shrink-0 shadow-md">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="font-black text-base text-[#55565A]">
                      می‌تونیم براتون بسازیم 🔧
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      هوش مصنوعی اطلس عکس شما را با تمام {toPersianDigits(864)} قلم کالای کاتالوگ مقایسه کرد و
                      هیچ‌کدام انطباق صددرصدی با قطعه شما نداشت؛ یعنی عین همین قطعه در کاتالوگ فعلی موجود نیست.
                      اما کارگاه تخصصی هایپر صنعت اطلس توانایی ساخت یا تأمین سفارشی <strong>دقیقاً همین قطعه</strong> را دارد.
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      کافیست همین عکس را برای کارشناسان ما ارسال کنید تا شناسایی دقیق، استعلام قیمت و زمان ساخت اعلام شود.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <a
                    href="tel:03538739900"
                    className="flex-1 h-11 bg-[#55565A] hover:bg-[#1B293E] text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span>تماس با اطلس: ۰۳۵-۳۸۷۳۹۹۰۰</span>
                  </a>
                  <a
                    href="https://wa.me/989903427027?text=سلام%2C%20این%20تصویر%20قطعه%20را%20برای%20ساخت%20سفارشی%20ارسال%20می‌کنم"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>ارسال عکس در واتس‌اپ</span>
                  </a>
                </div>
              </div>
              )}

              {/* Closest Visual Alternatives — secondary info shown only when an
                  exact match was found and resembling extras also exist */}
              {analysisResult.matchedProducts.length > 0 &&
                analysisResult.similarCandidates &&
                analysisResult.similarCandidates.length > 0 && (
                <div className="border border-amber-200 rounded-2xl bg-amber-50/60 p-3.5 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setShowSimilar(!showSimilar)}
                    className="w-full flex items-center justify-between text-xs font-bold text-amber-800 hover:text-amber-950 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-amber-600" />
                      <span>
                        شبیه‌ترین گزینه‌های کاتالوگ — عین قطعه شما نیستند (
                        {toPersianDigits(analysisResult.similarCandidates.length)} قلم)
                      </span>
                    </span>
                    <span className="text-[11px] text-amber-700 flex items-center gap-1">
                      {showSimilar ? 'بستن' : 'مشاهده'}
                      {showSimilar ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                  </button>

                  {showSimilar && (
                    <div className="pt-2 border-t border-amber-200 space-y-2">
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        این اقلام از نظر ظاهری نزدیک‌ترین‌ها به عکس شما بودند، اما راستی‌آزمایی چشمی هوش مصنوعی تأیید نکرد که عین قطعه شما باشند؛ صرفاً به‌عنوان مرجع نمایش داده می‌شوند:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {analysisResult.similarCandidates.map((rej, rIdx) => {
                          const cItem = rej.catalogProduct;
                          const rImg = resolveMatchImage(rej, cItem);
                          return (
                            <div
                              key={rej.code + rIdx}
                              className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-start gap-2.5 text-xs"
                            >
                              {rImg && (
                                <img
                                  src={rImg}
                                  alt={rej.name}
                                  referrerPolicy="no-referrer"
                                  className="w-12 h-12 object-contain rounded-lg border border-slate-100 bg-slate-50 shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] text-slate-500 font-bold">{rej.code}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-800">
                                    شبیه است — ولی عین قطعه شما نیست
                                  </span>
                                </div>
                                <div className="font-bold text-slate-800 text-[11px] truncate">{rej.name}</div>
                                {rej.visualExplanation && (
                                  <p className="text-[10px] text-slate-500 leading-tight">
                                    {rej.visualExplanation}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Technical Advice Footnote */}
              {analysisResult.technicalAdvice && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold block">توصیه فنی مهندسی هایپر صنعت اطلس:</span>
                    <p className="leading-relaxed">{analysisResult.technicalAdvice}</p>
                  </div>
                </div>
              )}

              {/* Return to edit button */}
              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>بازگشت و اصلاح مشخصات</span>
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-500 hover:text-[#55565A] font-bold cursor-pointer"
                >
                  شروع جستجوی جدید
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
};
