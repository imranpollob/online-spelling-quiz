import React from "react";

export default function QuizNew({
  totalQuestions,
  setTotalQuestions,
  handleStartQuiz,
}) {
  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center p-6 animate-fade-in">
      <div className="max-w-2xl w-full glass rounded-3xl p-8 md:p-12 shadow-2xl">
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold text-gradient">Start Your Quiz</h2>

          <div className="space-y-3">
            <label htmlFor="totalQuestions" className="block text-lg font-semibold text-slate-700 dark:text-slate-200">
              Select number of words
            </label>
            <select
              name="totalQuestions"
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(e.target.value)}
              className="w-full px-6 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 font-semibold text-lg focus:outline-none focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-800 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300 cursor-pointer"
            >
              <option value={5}>5 words</option>
              <option value={10}>10 words</option>
              <option value={15}>15 words</option>
              <option value={20}>20 words</option>
              <option value={30}>30 words</option>
              <option value={50}>50 words</option>
            </select>
          </div>

          <div className="card bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200/50 dark:border-brand-900/50 text-left mt-8">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How to Play
            </h3>
            <ul className="space-y-3 text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold">•</span>
                <span>Listen to the audio pronunciation and type the word you hear</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold">•</span>
                <span>Click <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded font-semibold text-sm">LISTEN</span> to replay the audio</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold">•</span>
                <span>Press <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded font-semibold text-sm">ENTER</span> or click <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded font-semibold text-sm">NEXT</span> to continue</span>
              </li>
            </ul>
          </div>

          <button
            className="btn btn--primary text-lg px-10 py-4 mt-6 w-full sm:w-auto"
            onClick={() => handleStartQuiz()}
          >
            Start Quiz Now
          </button>
        </div>
      </div>
    </div>
  );
}
