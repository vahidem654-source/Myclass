import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  UserCheck,
  Shield,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../types';

interface VideoGridProps {
  role: UserRole;
  teacherName: string;
  teacherHasVideo: boolean;
  teacherHasAudio: boolean;
  teacherIsSharingScreen: boolean;
  onUpdateMediaState: (state: {
    hasVideo?: boolean;
    hasAudio?: boolean;
    isSharingScreen?: boolean;
  }) => void;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  role,
  teacherName,
  teacherHasVideo,
  teacherHasAudio,
  teacherIsSharingScreen,
  onUpdateMediaState,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasMic, setHasMic] = useState<boolean>(false);
  const [hasCam, setHasCam] = useState<boolean>(false);
  const [isSharingScreen, setIsSharingScreen] = useState<boolean>(false);
  const [isMutedLocal, setIsMutedLocal] = useState<boolean>(false);

  const isTeacher = role === 'teacher';

  // Teacher camera stream handler
  const toggleCamera = async () => {
    if (!isTeacher) return;

    if (hasCam && stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setHasCam(false);
      onUpdateMediaState({ hasVideo: false });
    } else {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: hasMic,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setHasCam(true);
        onUpdateMediaState({ hasVideo: true });
      } catch (err) {
        console.warn('Camera permission or availability issue:', err);
        alert('امکان دسترسی به دوربین وجود ندارد یا اجازه داده نشده است.');
      }
    }
  };

  // Teacher mic stream handler
  const toggleMic = async () => {
    if (!isTeacher) return;

    if (hasMic) {
      if (stream) {
        stream.getAudioTracks().forEach((track) => (track.enabled = false));
      }
      setHasMic(false);
      onUpdateMediaState({ hasAudio: false });
    } else {
      try {
        if (stream) {
          stream.getAudioTracks().forEach((track) => (track.enabled = true));
        } else {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: hasCam,
          });
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        }
        setHasMic(true);
        onUpdateMediaState({ hasAudio: true });
      } catch (err) {
        console.warn('Mic permission issue:', err);
        alert('دستگاه میکروفون پیدا نشد.');
      }
    }
  };

  // Teacher Screen Sharing handler
  const toggleScreenShare = async () => {
    if (!isTeacher) return;

    if (isSharingScreen && stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
      setIsSharingScreen(false);
      onUpdateMediaState({ isSharingScreen: false });
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        setStream(screenStream);
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
        }
        setIsSharingScreen(true);
        onUpdateMediaState({ isSharingScreen: true });

        screenStream.getVideoTracks()[0].onended = () => {
          setIsSharingScreen(false);
          onUpdateMediaState({ isSharingScreen: false });
        };
      } catch (err) {
        console.warn('Screen share canceled or failed:', err);
      }
    }
  };

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg p-3 flex flex-col gap-2">
      {/* Stream Box */}
      <div className="relative aspect-video w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center group">
        {hasCam || isSharingScreen || teacherHasVideo || teacherIsSharingScreen ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isTeacher} // Mute self to prevent acoustic feedback loop
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 text-slate-500 p-4 text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400 font-extrabold text-2xl shadow-inner">
              {teacherName ? teacherName.charAt(0) : 'ا'}
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-semibold text-sm text-slate-300">
                تصویر {teacherName || 'استاد'}
              </span>
              <span className="text-xs text-slate-500">
                {isTeacher
                  ? 'دوربین یا اشتراک‌گذاری صفحه غیرفعال است'
                  : 'منتظر فعال‌سازی دوربین استاد...'}
              </span>
            </div>
          </div>
        )}

        {/* Floating Badges */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-2">
          <span className="bg-slate-900/80 backdrop-blur text-indigo-300 border border-indigo-500/30 text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <Shield className="w-3 h-3 text-indigo-400" />
            استاد: {teacherName || 'نامشخص'}
          </span>
          {isSharingScreen && (
            <span className="bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-[11px] font-medium px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
              <Monitor className="w-3 h-3" />
              اشتراک صفحه
            </span>
          )}
        </div>

        {/* Audio Indicator */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur px-2 py-1 rounded-lg border border-slate-700/80 text-xs">
          {hasMic || teacherHasAudio ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-emerald-300 text-[11px]">صدا فعال</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-300 text-[11px]">صدا بسته</span>
            </>
          )}
        </div>
      </div>

      {/* Teacher Media Controls Toolbar */}
      {isTeacher && (
        <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 flex items-center justify-around gap-2">
          <button
            onClick={toggleMic}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition cursor-pointer ${
              hasMic
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                : 'bg-rose-900/30 text-rose-300 border-rose-700/50 hover:bg-rose-900/40'
            }`}
          >
            {hasMic ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            <span>{hasMic ? 'میکروفون فعال' : 'میکروفون خاموش'}</span>
          </button>

          <button
            onClick={toggleCamera}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition cursor-pointer ${
              hasCam
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30'
                : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
            }`}
          >
            {hasCam ? <VideoIcon className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
            <span>{hasCam ? 'دوربین روشن' : 'دوربین خاموش'}</span>
          </button>

          <button
            onClick={toggleScreenShare}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition cursor-pointer ${
              isSharingScreen
                ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 text-purple-300" />
            <span>{isSharingScreen ? 'توقف اشتراک صفحه' : 'اشتراک‌گذاری صفحه'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
