import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import migrateToFirebase from '../scripts/migrateToFirebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import words from '../data/words';

const ADMIN_EMAIL = 'polboy777@gmail.com';

export default function Migration() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin access control - only allow specific email
  const isAdmin = user?.email === ADMIN_EMAIL;

  // If not admin, redirect to home
  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const handleMigration = async () => {
    setLoading(true);
    setStatus('Starting import...');

    try {
      const count = await migrateToFirebase();
      if (count === 0) {
        setStatus('Import cancelled - already completed');
      } else {
        setStatus(`✅ Sync complete! ${count} curated words reconciled without creating duplicate entries.`);
        await checkWordCount();
      }
    } catch (error) {
      setStatus(`❌ Import failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkWordCount = async () => {
    setLoading(true);

    try {
      const wordsCollection = collection(db, 'words');
      const wordSnapshot = await getDocs(query(wordsCollection, where('isGlobal', '==', true)));
      const fetchedWords = wordSnapshot.docs.map(doc => doc.data()).filter(word => !word.archived);
      setStatus(`📊 Found ${fetchedWords.length} active shared words in Firestore`);
    } catch (error) {
      setStatus(`❌ Failed to fetch words: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full glass rounded-3xl p-8 shadow-2xl">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="font-bold text-yellow-800 dark:text-yellow-300">Admin Access Only</h3>
          </div>
          <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-2">
            Restricted to admin account: <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">polboy777@gmail.com</code>
          </p>
        </div>

        <h2 className="text-3xl font-bold text-gradient mb-6">Database Migration & Import</h2>

        <div className="space-y-4">
          <div className="card bg-green-50/50 dark:bg-green-950/30 p-6">
            <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-200">Verify Database</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Check total word count in Firestore
            </p>
            <button
              onClick={checkWordCount}
              disabled={loading}
              className="btn btn--success w-full"
            >
              {loading ? 'Checking...' : 'Check Word Count'}
            </button>
          </div>

          {status && (
            <div className={`card p-6 ${status.includes('❌') ? 'bg-red-50/50 dark:bg-red-950/30' :
              'bg-green-50/50 dark:bg-green-950/30'
              }`}>
              <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-200">Status</h3>
              <p className="text-sm whitespace-pre-wrap text-slate-800 dark:text-slate-200">{status}</p>
            </div>
          )}

          <div className="card bg-blue-50/50 dark:bg-blue-950/30 p-6">
            <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-200">Import Words to Firestore</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Sync {words.length} curated words. Existing entries are updated, equivalent spellings are grouped, and duplicates are archived.
            </p>
            <button
              onClick={handleMigration}
              disabled={loading}
              className="btn btn--primary w-full "
            >
              {loading ? 'Importing...' : `Import ${words.length} Words`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
