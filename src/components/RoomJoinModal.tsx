import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Users,
  Shield,
  ArrowLeft,
  Sparkles,
  Link2,
  CheckCircle2,
  Video,
} from 'lucide-react';
import { UserRole } from '../types';

interface RoomJoinModalProps {
  onJoinRoom: (
    roomId: string,
    userName: string,
    role: UserRole,
    roomName?: string
  ) => void;
}

export const RoomJoinModal: React.FC<RoomJoinModalProps> = ({ onJoinRoom }) => {
  const [role, setRole] = useState<UserRole>('student');
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [roomName, setRoomName] = useState('کلاس ریاضی / فیزیک');

  useEffect(() => {
    // Parse URL query params
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const roleParam = params.get('role');

    if (roomParam) {
      setRoomId(roomParam.toUpperCase());
    } else {
      // Generate random room code like "MATH-101"
      const randomCode = 'CLASS-' + Math.floor(1000 + Math.random() * 9000);
      setRoomId(randomCode);
    }

    if (roleParam === 'teacher' || roleParam === 'student') {
      setRole(roleParam);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim() || !userName.trim()) return;

    onJoinRoom(
      roomId.trim().toUpperCase(),
      userName.trim(),
      role,
      role === 'teacher' ? roomName.trim() : undefined
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative flex flex-col text-right">
        {/* Top App Icon & Title */}
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-indigo-400" />
            </div>
          </div>

          <h2 className="text-xl font-extrabold text-slate-100 mt-1">
            سامانه کلاس آنلاین تعاملی
          </h2>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            ویژه برگزاری کلاس‌های آنلاین تا ۳۵+ دانش‌آموز بدون نیاز به خرید سرور به همراه تخته سیاه
            هوشمند و ویدیو آنلاین
          </p>
        </div>

        {/* Role Toggle Selector */}
        <div className="grid grid-cols-2 gap-2 bg-slate-800/80 p-1.5 rounded-2xl mb-6 border border-slate-700/80">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              role === 'student'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>ورود به عنوان دانش‌آموز</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('teacher')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              role === 'teacher'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4 text-yellow-300" />
            <span>ایجاد کلاس به عنوان استاد</span>
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {role === 'teacher' ? 'نام و نام خانوادگی استاد:' : 'نام و نام خانوادگی دانش‌آموز:'}
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder={role === 'teacher' ? 'مثلا: استاد علیرضا رضایی' : 'مثلا: سارا محمدی'}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">کد اختصاصی کلاس:</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder="مثلا: MATH-101"
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono tracking-wider focus:outline-none focus:border-indigo-500 transition"
              required
            />
          </div>

          {role === 'teacher' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">عنوان یا عنوان درس کلاس:</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="مثلا: کلاس ریاضی کنکور / فیزیک پایه دهم"
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                required
              />
            </div>
          )}

          {/* Info Feature Badges */}
          <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-2xl space-y-1.5 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>پشتیبانی همزمان تا ۳۵+ دانش‌آموز آنلاین</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>تخته سیاه زنده، اشتراک‌گذاری صفحه و کوییز AI</span>
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-3 rounded-2xl font-bold text-xs text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-2 ${
              role === 'teacher'
                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
            }`}
          >
            <span>{role === 'teacher' ? 'شروع و ورود به کلاس' : 'اتصال به کلاس استاد'}</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
