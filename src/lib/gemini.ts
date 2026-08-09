export async function generateAiQuiz(topic: string, numQuestions: number = 3) {
  try {
    const res = await fetch('/api/ai/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, numQuestions }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || 'خطا در ارتباط با سرور هوش مصنوعی');
    }
    return data.quiz;
  } catch (err: any) {
    console.error('Quiz error:', err);
    throw err;
  }
}

export async function askAiAssistant(prompt: string, context?: string) {
  try {
    const res = await fetch('/api/ai/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, context }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || 'خطا در دریافت پاسخ هوش مصنوعی');
    }
    return data.answer;
  } catch (err: any) {
    console.error('AI assistant error:', err);
    throw err;
  }
}
