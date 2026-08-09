import React, { useState } from 'react';
import { Sparkles, X, BookOpen, Send, Check, Loader2, HelpCircle } from 'lucide-react';
import { generateAiQuiz, askAiAssistant } from '../lib/gemini';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePoll: (question: string, options: string[]) => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  onCreatePoll,
}) => {
  const [activeTab, setActiveTab] = useState<'quiz' | 'explain'>('quiz');
  const [quizTopic, setQuizTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(3);
  const [generatedQuiz, setGeneratedQuiz] = useState<any[]>([]);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  const [explainPrompt, setExplainPrompt] = useState('');
  const [explainAnswer, setExplainAnswer] = useState('');
  const [isLoadingExplain, setIsLoadingExplain] = useState(false);

  if (!isOpen) return null;

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTopic.trim()) return;

    setIsLoadingQuiz(true);
    try {
      const quiz = await generateAiQuiz(quizTopic.trim(), numQuestions);
      setGeneratedQuiz(quiz || []);
    } catch (err: any) {
      alert('خطا در تولید آزمون: ' + err.message);
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const handleLaunchQuizQuestion = (q: any) => {
    onCreatePoll(q.question, q.options);
    onClose();
  };

  const handleAskExplain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explainPrompt.trim()) return;

    setIsLoadingExplain(true);
    try {
      const ans = await askAiAssistant(explainPrompt.trim());
      setExplainAnswer(ans || '');
    } catch (err: any) {
      alert('خطا در دریافت پاسخ: ' + err.message);
    } finally {
      setIsLoadingExplain(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-5 shadow-2xl relative flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white">
            <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">دستیار هوشمند معلم (Gemini AI)</h3>
            <span className="text-xs text-slate-400">تولید سریع سوالات، خلاصه‌سازی و توضیح کانسپت‌ها</span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl mb-4 text-xs font-medium border border-slate-700">
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'quiz'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            تولید آزمون سریع با AI
          </button>
          <button
            onClick={() => setActiveTab('explain')}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'explain'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            توضیح و پاسخ به سوال درس
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {activeTab === 'quiz' ? (
            <div className="space-y-4">
              <form onSubmit={handleGenerateQuiz} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">
                    موضوع درس یا مبحث آزمون:
                  </label>
                  <input
                    type="text"
                    value={quizTopic}
                    onChange={(e) => setQuizTopic(e.target.value)}
                    placeholder="مثلا: قوانین حرکت نیوتن / معادلات درجه دوم / دستور زبان فارسی"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span>تعداد سوالات:</span>
                    <select
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(Number(e.target.value))}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 focus:outline-none"
                    >
                      <option value={2}>۲ سوال</option>
                      <option value={3}>۳ سوال</option>
                      <option value={5}>۵ سوال</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoadingQuiz}
                    className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {isLoadingQuiz ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-yellow-300" />
                        <span>در حال تولید هوشمند سوالات...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                        <span>ساخت سوالات با AI</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Generated Quiz List */}
              {generatedQuiz.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-200">سوالات پیشنهادی هوش مصنوعی:</h4>
                  {generatedQuiz.map((q, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl flex flex-col gap-2 text-xs"
                    >
                      <span className="font-bold text-indigo-300">
                        {idx + 1}. {q.question}
                      </span>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
                        {q.options?.map((opt: string, oIdx: number) => (
                          <div
                            key={oIdx}
                            className={`p-1.5 rounded-lg border ${
                              q.correctIndex === oIdx
                                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                                : 'bg-slate-900/60 border-slate-800'
                            }`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => handleLaunchQuizQuestion(q)}
                        className="mt-1 flex items-center justify-center gap-1 text-xs bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 text-indigo-400" />
                        <span>ارسال آنلاین این سوال به کلاس</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleAskExplain} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">
                    سوال یا مفهوم مورد نظر برای توضیح:
                  </label>
                  <textarea
                    value={explainPrompt}
                    onChange={(e) => setExplainPrompt(e.target.value)}
                    rows={3}
                    placeholder="مثلا: چرخه فتوسنتز را چطور به دانش‌آموزان سال نهم ساده توضیح دهم؟"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoadingExplain}
                    className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {isLoadingExplain ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-yellow-300" />
                        <span>در حال تحلیل...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                        <span>توضیح هوشمند</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {explainAnswer && (
                <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl text-xs leading-relaxed text-slate-200 text-right space-y-2">
                  <div className="font-bold text-indigo-300 flex items-center gap-1.5 border-b border-slate-700 pb-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <span>پاسخ و راهنمای هوش مصنوعی:</span>
                  </div>
                  <div className="whitespace-pre-wrap">{explainAnswer}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
