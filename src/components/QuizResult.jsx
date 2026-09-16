import React from "react";
import { v4 as uuidv4 } from "uuid";

export default function QuizResult(props) {
  const { answerMap, quizStatus, totalQuestions, handleStartQuizAgain } = props;

  const correctCount = Object.entries(answerMap).filter(
    ([key, value]) => key.trim().toLowerCase() === value.trim().toLowerCase()
  ).length;

  const percentage = Math.round((correctCount / totalQuestions) * 100);

  return (
    <div className="glass rounded-3xl p-8 md:p-12 shadow-2xl animate-fade-in">
      {/* Score Card */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">
          Quiz Complete! 🎉
        </h2>
        <div className="inline-block">
          <div className="text-6xl font-bold text-gradient mb-2">
            {percentage}%
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            {correctCount} out of {totalQuestions} correct
          </p>
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-primary-600 to-brand-700 text-white">
              <th className="px-6 py-4 text-left font-semibold">Correct Word</th>
              <th className="px-6 py-4 text-left font-semibold">Your Answer</th>
              <th className="px-6 py-4 text-center font-semibold">Result</th>
            </tr>
          </thead>
          <tbody className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
            {Object.entries(answerMap).map(([key, value]) => {
              const isCorrect = quizStatus(key, value) === "Correct";
              return (
                <tr
                  key={uuidv4()}
                  className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                    {key.toLowerCase()}
                  </td>
                  <td className={`px-6 py-4 ${isCorrect ? 'text-slate-800 dark:text-slate-200' : 'text-red-600 dark:text-red-400 line-through'}`}>
                    {value.toLowerCase()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Incorrect
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Action Button */}
      <div className="text-center">
        <button
          className="btn btn--primary text-lg px-10 py-4"
          onClick={() => handleStartQuizAgain()}
        >
          Start New Quiz
        </button>
      </div>
    </div>
  );
}
