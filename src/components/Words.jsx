import React, { useState } from "react";
import { addWord, deleteWord } from "../services/wordService";
import { useWords } from "../hooks/useWords";
import { useAuth } from "../contexts/AuthContext";
import { successToast, dangerToast, infoToast } from "../helper-functions/toast";
import Toast from "../helper-components/Toast";
import WordList from "./WordList";

const ADMIN_EMAIL = 'polboy777@gmail.com';

export default function Words() {
  const { user, isAuthenticated } = useAuth();
  const { words, loading, refreshWords } = useWords(user?.uid);
  const [currentValue, setCurrentValue] = useState("");
  const [adding, setAdding] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;

  async function handleAddWord(word) {
    if (!word) {
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      infoToast("Please login to add your own words!");
      return;
    }

    const cleanWord = word.trim().toLowerCase();

    // Check if word already exists (in user's list or globally)
    if (words.some(w => w.word === cleanWord)) {
      dangerToast(`"${word}" is already in your word list`);
      return;
    }

    setAdding(true);
    try {
      await addWord({
        word: cleanWord,
        difficulty: 'intermediate',
        category: 'custom'
      }, user.uid, user.email);

      setCurrentValue("");

      if (isAdmin) {
        successToast(`"${word}" added globally for all users!`);
      } else {
        successToast(`"${word}" added to your personal list!`);
      }

      // Refresh the word list
      await refreshWords();
    } catch (error) {
      dangerToast(`Failed to add word: ${error.message}`);
    } finally {
      setAdding(false);
    }
  }

  function handleInput(e) {
    if (e.key === "Enter") {
      handleAddWord(e.target.value);
    }
  }

  async function handleDeleteWord(wordId, wordText, wordData) {
    // Only allow deleting own words (or admin can delete any)
    if (!isAdmin && wordData.userId !== user?.uid) {
      dangerToast("You can only delete your own words");
      return;
    }

    try {
      await deleteWord(wordId);
      dangerToast(`"${wordText}" removed from ${wordData.isGlobal ? 'global' : 'your'} list`);

      // Refresh the word list
      await refreshWords();
    } catch (error) {
      dangerToast(`Failed to remove word: ${error.message}`);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center">
        <div className="text-2xl font-bold text-gradient">Loading words...</div>
      </div>
    );
  }

  // Separate words by type for display
  const globalWords = words.filter(w => w.isGlobal);
  const personalWords = words.filter(w => !w.isGlobal);

  return (
    <div className="min-h-[calc(100vh-73px)] flex justify-center p-6 animate-fade-in">
      <Toast />
      <div className="max-w-4xl w-full">
        {/* Header Card with Add Word Form */}
        <div className="glass rounded-3xl p-8 md:p-12 shadow-2xl mb-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gradient mb-2">Manage Words</h2>
            <div className="space-y-1">
              <p className="text-slate-600 dark:text-slate-400">
                <span className="font-bold text-primary-600 dark:text-primary-400">{globalWords.length}</span> global words
                {isAuthenticated && (
                  <>
                    {' + '}
                    <span className="font-bold text-purple-600 dark:text-purple-400">{personalWords.length}</span> your words
                  </>
                )}
              </p>
              {isAdmin && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                  👑 Admin: Your words are visible to all users
                </p>
              )}
              {!isAdmin && isAuthenticated && (
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  📝 Your personal words are only visible to you
                </p>
              )}
            </div>
          </div>

          {!isAuthenticated ? (
            <div className="card bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200/50 dark:border-brand-900/50 p-6 text-center">
              <svg className="w-12 h-12 mx-auto mb-3 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-200">
                Please login to add your own words
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                You can browse and practice with existing words as a guest. Login to build your personal word list!
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                name="word"
                type="text"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                onKeyDown={(e) => handleInput(e)}
                placeholder="Enter a new word..."
                disabled={adding}
                className="flex-1 px-6 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-800 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300 backdrop-blur-sm disabled:opacity-50"
              />
              <button
                className="btn btn--primary px-8"
                onClick={() => handleAddWord(currentValue)}
                disabled={adding}
              >
                {adding ? 'Adding...' : (isAdmin ? 'Add Global Word' : 'Add My Word')}
              </button>
            </div>
          )}
        </div>

        {/* Word List Card */}
        <div className="glass rounded-3xl p-8 shadow-2xl">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Word Library
          </h3>
          <WordList words={words} handleDeleteWord={handleDeleteWord} currentUserId={user?.uid} />
        </div>
      </div>
    </div>
  );
}
