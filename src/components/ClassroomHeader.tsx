import React, { useState } from 'react';
import {
  Video,
  Users,
  Copy,
  Check,
  Sparkles,
  LogOut,
  Radio,
  Share2,
  BookOpen,
} from 'lucide-react';
import { UserRole } from '../types';

interface ClassroomHeaderProps {
  roomName: string;
  roomId: string;
  userName: string;
  role: UserRole;
  userCount: number;
  isConnected: boolean;
  onOpenAiModal: () => void;
  onOpenShareModal: () => void;
  onLeaveRoom: () => void;
}

export const ClassroomHeader: React.FC<ClassroomHeaderProps> = ({
  roomName,
  roomId,
  userName,
  role,
  userCount,
  isConnected,
  onOpenAiModal,
  onOpenShareModal,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    let origin = window.location.origin;
    if (origin.includes('ais-dev-')) {
      origin = origin.replace('ais-dev-', 'ais-pre-');
    }
    const studentUrl = `${origin}${window.location.pathname}?room=${roomId}&role=student`;
    navigator.clipboard.writeText(studentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 px-4 py-2.5 flex items-center justify-between shadow-md">
      {/* Left / Brand Info */}
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600/20 p-2 rounded-xl border border-indigo-500/30 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <span className="font-extrabold text-sm text-indigo-200 hidden sm:inline">
            کلاس آنلاین
          </span>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base text-slate-100 max-w-[200px] sm:max-w-xs truncate">
              {roomName}
            </h1>
            <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full border border-slate-700 font-monoDir">
              کد: {roomId}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span className="flex items-center gap-1">
              {isConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400 font-medium">زنده (وصل شده)</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-amber-400">در حال اتصال...</span>
                </>
              )}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {userCount} نفر در کلاس
            </span>
          </div>
        </div>
      </div>

      {/* Center Actions */}
      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer"
          title="کپی لینک اختصاصی دانش‌آموزان"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">لینک کپی شد</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>کپی لینک دعوت دانش‌آموز</span>
            </>
          )}
        </button>

        <button
          onClick={onOpenAiModal}
          className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-5 dev hover:to-purple-500 text-white font-medium px-3.5 py-1.5 rounded-lg shadow-sm transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
          <span>دستیار معلم AI</span>
        </button>
      </div>

      {/* Right / User Badge & Exit */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/60">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
              role === 'teacher'
                ? 'bg-indigo-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {role === 'teacher' ? 'استاد' : 'دانش'}
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-200 truncate max-w-[100px]">
              {userName}
            </span>
            <span className="text-[10px] text-slate-400">
              {role === 'teacher' ? 'مدرس اصلی' : 'دانش‌آموز'}
            </span>
          </div>
        </div>

        <button
          onClick={onLeaveRoom}
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
          title="خروج از کلاس"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
