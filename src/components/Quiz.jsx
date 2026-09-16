import React, { useState } from "react";
import shuffleArray from "./../helper-functions/array_shuffle";
import say from "./../helper-functions/say";
import { useWords } from "../hooks/useWords";
import { useAuth } from "../contexts/AuthContext";
import QuizNew from "./QuizNew";
import QuizResult from "./QuizResult";

export default function Quiz() {
  const { user } = useAuth();
  const { words: allWords, loading: wordsLoading } = useWords(user?.uid);
  const [quizRunning, setQuizRunning] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [words, setWords] = useState([]);
  const [answerMap, setAnswerMap] = useState({});
  const [answer, setAnswer] = useState("");
  const [currentWord, CurrentWord] = useState();

  function handleNextQuestion() {
    setAnswerMap({ ...answerMap, [currentWord]: answer });
    let tempWords = [...words];
    tempWords = tempWords.filter((w) => w.word !== currentWord);
    setWords(tempWords);
    const selectedWord = tempWords[0]?.word;
    CurrentWord(selectedWord);
    if (selectedWord) {
      say(selectedWord);
    }
    setAnswer("");
  }

  function handlePlayAgain() {
    say(currentWord);
  }

  function handleInputChange(value) {
    const sanitized = value.replace(/[^a-zA-Z]/g, "");
    setAnswer(sanitized);
  }

  function handleStartQuiz() {
    setQuizRunning(1);
    setAnswerMap({});

    // Get words from Firestore and shuffle
    let tempWords = shuffleArray([...allWords]).slice(0, totalQuestions);
    setWords(tempWords);

    const selectedWord = tempWords[0]?.word;
    CurrentWord(selectedWord);
    if (selectedWord) {
      say(selectedWord);
    }
  }

  function handleStartQuizAgain() {
    setQuizRunning(0);
  }

  function handleInput(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleNextQuestion();
      return;
    }

    if (e.key === "1") {
      e.preventDefault();
      handlePlayAgain();
    }
  }

  function quizStatus(key, value) {
    return key.trim().toLowerCase() === value.trim().toLowerCase()
      ? "Correct"
      : "Incorrect";
  }

  // Show loading state while fetching words
  if (wordsLoading) {
    return (
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center">
        <div className="text-2xl font-bold text-gradient">Loading words...</div>
      </div>
    );
  }

  // Show error if no words available
  if (!allWords || allWords.length === 0) {
    return (
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center p-6">
        <div className="glass rounded-3xl p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            No Words Available
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Please run the migration from the Migrate page first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        {!quizRunning ? (
          <QuizNew
            totalQuestions={totalQuestions}
            setTotalQuestions={setTotalQuestions}
            handleStartQuiz={handleStartQuiz}
          />
        ) : words.length > 0 ? (
          <div className="glass rounded-3xl p-8 md:p-12 shadow-2xl animate-fade-in">
            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Question {totalQuestions - words.length + 1} of {totalQuestions}
                </span>
                <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                  {Math.round(((totalQuestions - words.length) / totalQuestions) * 100)}% Complete
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-brand-400 transition-all duration-500 ease-out"
                  style={{ width: `${((totalQuestions - words.length) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            {/* Main quiz area */}
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Listen and Type the Word
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Click the speaker button to hear the pronunciation
                </p>
              </div>

              <input
                type="text"
                value={answer}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => handleInput(e)}
                placeholder="Type the word here..."
                className="w-full px-6 py-4 text-xl text-center rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-800 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300 backdrop-blur-sm"
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  className="btn flex items-center justify-center gap-2 flex-1 bg-brand-100 hover:bg-brand-200 dark:bg-brand-900/40 dark:hover:bg-brand-900/60 text-brand-900 dark:text-brand-100"
                  onClick={() => handlePlayAgain()}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  Listen Again
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-300/70 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                    1
                  </span>
                </button>
                <button
                  className="btn btn--success flex items-center justify-center gap-2 flex-1"
                  onClick={() => handleNextQuestion()}
                >
                  {words.length === 1 ? "Finish Quiz" : "Next Question"}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200/70 dark:border-emerald-700/70">
                    Enter
                  </span>

                </button>
              </div>
            </div>
          </div>
        ) : (
          <QuizResult
            answerMap={answerMap}
            quizStatus={quizStatus}
            totalQuestions={totalQuestions}
            handleStartQuizAgain={handleStartQuizAgain}
          />
        )}
      </div>
    </div>
  );
}
