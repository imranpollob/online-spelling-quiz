import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-brand-50 via-teal-50/50 to-slate-100/60 dark:from-slate-900 dark:via-brand-950/40 dark:to-slate-950 border-b border-brand-100/60 dark:border-brand-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100/80 dark:bg-brand-950/70 border border-brand-300/60 dark:border-brand-800/60 text-brand-800 dark:text-brand-300 text-xs font-semibold tracking-wide uppercase mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
              Interactive Learning Platform
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 font-heading tracking-tight leading-tight">
              Master Your <span className="text-gradient">Spelling</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Practice commonly misspelled words with interactive audio quizzes. Build your personal word library and track your progress effortlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/quiz"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-semibold rounded-xl shadow-lg shadow-brand-600/30 transition-all transform hover:-translate-y-0.5 active:scale-95"
              >
                Start Quiz
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                to="/words"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-600 transition-all active:scale-95"
              >
                Browse Words
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 font-heading">
            Everything You Need to Improve
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            A fast, modern spelling practice platform built for students, professionals, and language enthusiasts.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-8 hover:shadow-xl hover:border-brand-400/50 dark:hover:border-brand-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/40 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 font-heading">
              Interactive Quizzes
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Practice with audio pronunciation and instant feedback on your spelling accuracy.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-8 hover:shadow-xl hover:border-teal-400/50 dark:hover:border-teal-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/40 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 font-heading">
              Personal Word Library
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Build your own collection of challenging words to practice, test, and master over time.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-8 hover:shadow-xl hover:border-brand-400/50 dark:hover:border-brand-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/40 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 font-heading">
              Audio Pronunciation
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Listen to crystal-clear pronunciation for every word powered by high quality speech synthesis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
