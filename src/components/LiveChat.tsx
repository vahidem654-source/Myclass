import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Hand,
  Megaphone,
  Sparkles,
  Shield,
  User,
} from 'lucide-react';
import { ChatMessage, UserRole } from '../types';

interface LiveChatProps {
  messages: ChatMessage[];
  currentUserId: string;
  userName: string;
  role: UserRole;
  handRaised: boolean;
  onSendMessage: (text: string, isAnnouncement?: boolean) => void;
  onToggleRaiseHand: (raised: boolean) => void;
}

export const LiveChat: React.FC<LiveChatProps> = ({
  messages,
  currentUserId,
  userName,
  role,
  handRaised,
  onSendMessage,
  onToggleRaiseHand,
}) => {
  const [inputText, setInputText] = useState('');
  const [isAnnouncementMode, setIsAnnouncementMode] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const isTeacher = role === 'teacher';

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText.trim(), isTeacher && isAnnouncementMode);
    setInputText('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col h-full shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600/20 rounded-lg border border-indigo-500/30 text-indigo-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-slate-200">گفتگوی متنی (چت کلاس)</h3>
        </div>

        {/* Student Raise Hand Button */}
        {!isTeacher && (
          <button
            onClick={() => onToggleRaiseHand(!handRaised)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium border transition cursor-pointer shadow-sm ${
              handRaised
                ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/40'
            }`}
          >
            <Hand className={`w-3.5 h-3.5 ${handRaised ? 'text-slate-950' : 'text-amber-400'}`} />
            <span>{handRaised ? 'دست بالا است (منتظر پاسخ)' : 'دست گرفتن (اجازه)'}</span>
          </button>
        )}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto my-3 space-y-2.5 pr-1 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
            <span>هنوز پیامی ارسال نشده است.</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.senderId === currentUserId;
            const isTeacherSender = msg.senderRole === 'teacher';

            if (msg.isAnnouncement) {
              return (
                <div
                  key={msg.id}
                  className="bg-indigo-950/80 border border-indigo-500/50 p-2.5 rounded-xl text-xs text-indigo-200 my-1 shadow-sm flex items-start gap-2"
                >
                  <Megaphone className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col text-right w-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-indigo-300">اعلامیه مهم استاد</span>
                      <span className="text-[10px] text-indigo-400/80">{msg.timestamp}</span>
                    </div>
                    <p className="leading-relaxed text-indigo-100">{msg.text}</p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${
                  isSelf ? 'mr-auto items-end' : 'ml-auto items-start'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 px-1">
                  <span className="font-semibold text-slate-300">{msg.senderName}</span>
                  {isTeacherSender && (
                    <span className="bg-indigo-600/30 text-indigo-300 text-[9px] px-1.5 rounded border border-indigo-500/30">
                      استاد
                    </span>
                  )}
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`p-2.5 rounded-2xl text-xs leading-relaxed text-right ${
                    isSelf
                      ? 'bg-indigo-600 text-white rounded-tl-none'
                      : isTeacherSender
                      ? 'bg-slate-800 text-slate-100 border border-indigo-500/30 rounded-tr-none'
                      : 'bg-slate-800 text-slate-200 rounded-tr-none border border-slate-700/60'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="pt-2 border-t border-slate-800 flex flex-col gap-2">
        {isTeacher && (
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-indigo-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnnouncementMode}
                onChange={(e) => setIsAnnouncementMode(e.target.checked)}
                className="rounded accent-indigo-600 cursor-pointer"
              />
              <Megaphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>ارسال به عنوان اعلامیه برجسته</span>
            </label>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isAnnouncementMode ? 'متن اعلامیه مهم را وارد کنید...' : 'پیام خود را بنویسید...'
            }
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            type="submit"
            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition cursor-pointer shadow-md"
            title="ارسال پیام"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
