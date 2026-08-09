import React from 'react';
import {
  Users,
  Hand,
  Mic,
  MicOff,
  Shield,
  User,
  Download,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ClassroomUser, UserRole } from '../types';

interface AttendanceListProps {
  users: ClassroomUser[];
  currentUserId: string;
  role: UserRole;
  onLowerHand: (targetUserId: string) => void;
  onToggleMute: (targetUserId: string, isMuted: boolean) => void;
}

export const AttendanceList: React.FC<AttendanceListProps> = ({
  users,
  currentUserId,
  role,
  onLowerHand,
  onToggleMute,
}) => {
  const isTeacher = role === 'teacher';

  // Sort users: Teacher first, then users with raised hands (sorted by raised time), then alphabetically
  const sortedUsers = [...users].sort((a, b) => {
    if (a.role === 'teacher') return -1;
    if (b.role === 'teacher') return 1;
    if (a.handRaised && !b.handRaised) return -1;
    if (!a.handRaised && b.handRaised) return 1;
    if (a.handRaised && b.handRaised) {
      return (a.handRaisedAt || 0) - (b.handRaisedAt || 0);
    }
    return a.name.localeCompare(b.name, 'fa');
  });

  const studentsCount = users.filter((u) => u.role === 'student').length;
  const handsRaisedCount = users.filter((u) => u.handRaised).length;

  const exportAttendanceReport = () => {
    const dateStr = new Date().toLocaleDateString('fa-IR');
    let report = `گزارش حضور و غیاب کلاس آنلاین - تاریخ: ${dateStr}\n`;
    report += `تعداد کل حاضران: ${users.length} نفر (${studentsCount} دانش‌آموز)\n\n`;
    report += `فهرست دانش‌آموزان و وضعیت:\n`;
    report += `--------------------------------------------------\n`;

    sortedUsers.forEach((u, idx) => {
      const roleText = u.role === 'teacher' ? 'استاد' : 'دانش‌آموز';
      report += `${idx + 1}. ${u.name} | نقش: ${roleText} | زمان ورود: ${u.joinedAt} | دست گرفته: ${
        u.handRaised ? 'بله' : 'خیر'
      }\n`;
    });

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendance-report-${Date.now()}.txt`;
    link.click();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col h-full shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600/20 rounded-lg border border-indigo-500/30 text-indigo-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-200">حضور و غیاب ({users.length} نفر)</h3>
            <span className="text-[11px] text-slate-400">{studentsCount} دانش‌آموز آنلاین</span>
          </div>
        </div>

        <button
          onClick={exportAttendanceReport}
          className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition cursor-pointer"
          title="دانلود خروجی لیست حضور و غیاب"
        >
          <Download className="w-3 h-3 text-indigo-400" />
          <span>دانلود لیست</span>
        </button>
      </div>

      {/* Raised Hands Alert Banner */}
      {handsRaisedCount > 0 && (
        <div className="mt-2.5 bg-amber-950/60 border border-amber-800/60 p-2 rounded-xl flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-1.5">
            <Hand className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>{handsRaisedCount} نفر اجازه صحبت یا سوال گرفته‌اند!</span>
          </div>
        </div>
      )}

      {/* Roster List */}
      <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1 custom-scrollbar">
        {sortedUsers.map((user, idx) => {
          const isSelf = user.id === currentUserId;

          return (
            <div
              key={user.id}
              className={`p-2.5 rounded-xl border transition flex items-center justify-between ${
                user.handRaised
                  ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                  : user.role === 'teacher'
                  ? 'bg-indigo-950/20 border-indigo-500/30'
                  : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {/* Role Avatar */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs relative ${
                    user.role === 'teacher'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {user.role === 'teacher' ? (
                    <Shield className="w-4 h-4 text-yellow-300" />
                  ) : (
                    <span>{user.name ? user.name.charAt(0) : 'د'}</span>
                  )}

                  {user.handRaised && (
                    <span
                      className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow"
                      title="دست گرفته"
                    >
                      <Hand className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <div className="flex flex-col text-right">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-200">{user.name}</span>
                    {isSelf && (
                      <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 rounded">
                        شما
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>ورود: {user.joinedAt}</span>
                  </div>
                </div>
              </div>

              {/* Status & Teacher Actions */}
              <div className="flex items-center gap-1.5">
                {user.handRaised && isTeacher && (
                  <button
                    onClick={() => onLowerHand(user.id)}
                    className="text-[11px] bg-amber-900/40 hover:bg-amber-800/60 text-amber-200 border border-amber-700/50 px-2 py-0.5 rounded-lg transition cursor-pointer"
                    title="پایین آوردن دست"
                  >
                    پایین آوردن دست
                  </button>
                )}

                {isTeacher && user.role !== 'teacher' && (
                  <button
                    onClick={() => onToggleMute(user.id, !user.isMuted)}
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                      user.isMuted
                        ? 'bg-rose-900/30 text-rose-300 border-rose-700/40 hover:bg-rose-900/50'
                        : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                    }`}
                    title={user.isMuted ? 'باز کردن میکروفون' : 'بستن میکروفون دانش‌آموز'}
                  >
                    {user.isMuted ? (
                      <MicOff className="w-3.5 h-3.5" />
                    ) : (
                      <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
