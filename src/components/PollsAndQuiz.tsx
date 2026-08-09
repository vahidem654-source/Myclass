import React, { useState } from 'react';
import {
  HelpCircle,
  Plus,
  CheckCircle2,
  BarChart2,
  X,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Poll, UserRole } from '../types';

interface PollsAndQuizProps {
  activePoll: Poll | null;
  currentUserId: string;
  role: UserRole;
  onCreatePoll: (question: string, options: string[]) => void;
  onVotePoll: (optionId: string) => void;
  onClosePoll: () => void;
  onOpenAiQuizModal: () => void;
}

export const PollsAndQuiz: React.FC<PollsAndQuizProps> = ({
  activePoll,
  currentUserId,
  role,
  onCreatePoll,
  onVotePoll,
  onClosePoll,
  onOpenAiQuizModal,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['گزینه ۱', 'گزینه ۲']);

  const isTeacher = role === 'teacher';

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, `گزینه ${options.length + 1}`]);
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) return;

    onCreatePoll(question.trim(), validOptions);
    setShowCreateModal(false);
    setQuestion('');
    setOptions(['گزینه ۱', 'گزینه ۲']);
  };

  // Calculate total votes
  const totalVotes = activePoll
    ? activePoll.options.reduce((acc, opt) => acc + opt.votes.length, 0)
    : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col h-full shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600/20 rounded-lg border border-indigo-500/30 text-indigo-400">
            <BarChart2 className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-slate-200">نظرسنجی و کوییز آنلاین</h3>
        </div>

        {isTeacher && (
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenAiQuizModal}
              className="flex items-center gap-1 text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-lg transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>کوییز AI</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg transition cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>سوال جدید</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Poll Content Area */}
      <div className="flex-1 overflow-y-auto my-3 pr-1 custom-scrollbar">
        {!activePoll ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs p-4 text-center">
            <HelpCircle className="w-8 h-8 text-slate-600 mb-2" />
            <span>در حال حاضر هیچ سوال یا نظرسنجی فعالی در جریان نیست.</span>
            {isTeacher && (
              <span className="text-slate-400 mt-1">
                می‌توانید با دکمه "سوال جدید" یا "کوییز AI" یک سوال آنلاین به کلاس بدهید.
              </span>
            )}
          </div>
        ) : (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="text-xs font-bold text-slate-200 leading-relaxed">
                {activePoll.question}
              </span>
              {isTeacher && activePoll.isActive && (
                <button
                  onClick={onClosePoll}
                  className="text-[10px] bg-rose-900/40 text-rose-300 border border-rose-700/50 px-2 py-0.5 rounded-lg hover:bg-rose-900/60 transition cursor-pointer"
                >
                  پایان نظرسنجی
                </button>
              )}
            </div>

            {/* Options List */}
            <div className="space-y-2.5 my-1">
              {activePoll.options.map((opt) => {
                const hasVotedThis = opt.votes.includes(currentUserId);
                const count = opt.votes.length;
                const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

                return (
                  <div
                    key={opt.id}
                    onClick={() => activePoll.isActive && onVotePoll(opt.id)}
                    className={`relative overflow-hidden p-3 rounded-xl border transition cursor-pointer ${
                      hasVotedThis
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-100 shadow'
                        : 'bg-slate-900/80 border-slate-700 hover:border-slate-600 text-slate-200'
                    }`}
                  >
                    {/* Live Progress Bar Fill */}
                    <div
                      className="absolute inset-y-0 right-0 bg-indigo-600/20 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />

                    <div className="relative z-10 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            hasVotedThis
                              ? 'bg-indigo-600 border-indigo-400 text-white'
                              : 'border-slate-500'
                          }`}
                        >
                          {hasVotedThis && <CheckCircle2 className="w-3 h-3" />}
                        </div>
                        <span className="font-medium">{opt.text}</span>
                      </div>

                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                        <span>{percentage}%</span>
                        <span>({count} رای)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-[11px] text-slate-400 text-left pt-1 border-t border-slate-700/60 flex items-center justify-between">
              <span>مجموع آرای ثبت شده: {totalVotes} نفر</span>
              <span>{!activePoll.isActive ? 'پایان یافته' : 'در حال برگزاری...'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Manual Create Poll Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-400" />
              ایجاد سوال یا نظرسنجی جدید
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">متن سوال:</label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="مثلا: گزینه صحیح در فرمول فوق کدام است؟"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">گزینه‌ها:</label>
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      required
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {options.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن گزینه جدید</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 px-3 py-2 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl transition cursor-pointer shadow-md"
                >
                  انتشار برای همه دانش‌آموزان
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
