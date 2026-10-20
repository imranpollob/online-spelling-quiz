import { db } from './firebase';
import wordPolicy from '../data/wordPolicy.js';
import curationPlanner from '../data/curationPlan.js';
import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  limit,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';

const WORDS_COLLECTION = 'words';
const ADMIN_EMAIL = 'polboy777@gmail.com';
const { curateWord, policy, normalizeAnswer } = wordPolicy;
const { buildCurationPlan } = curationPlanner;

function invalidateWordCache() {
  if (typeof sessionStorage === 'undefined') return;
  for (const key of Object.keys(sessionStorage)) {
    if (key.startsWith('words_cache_')) sessionStorage.removeItem(key);
  }
}

/**
 * Get all words from Firestore (global + user-specific)
 * @param {string} userId - Current user's ID
 */
export async function getAllWords(userId = null) {
  try {
    const wordsRef = collection(db, WORDS_COLLECTION);
    const snapshot = await getDocs(wordsRef);
    const allWords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter: return global words + words created by this user
    return allWords.filter(word => !word.archived &&
      !(word.isGlobal && Object.prototype.hasOwnProperty.call(policy.retired, normalizeAnswer(word.word))) &&
      (word.isGlobal || (userId && word.userId === userId))
    ).map(curateWord);
  } catch (error) {
    console.error('Error fetching words:', error);
    throw error;
  }
}

/**
 * Get words by difficulty level
 */
export async function getWordsByDifficulty(difficulty) {
  try {
    const wordsRef = collection(db, WORDS_COLLECTION);
    const q = query(wordsRef, where('difficulty', '==', difficulty));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching words by difficulty:', error);
    throw error;
  }
}

/**
 * Get words by category
 */
export async function getWordsByCategory(category) {
  try {
    const wordsRef = collection(db, WORDS_COLLECTION);
    const q = query(wordsRef, where('category', '==', category));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching words by category:', error);
    throw error;
  }
}

/**
 * Search words by text (prefix search)
 */
export async function searchWords(searchTerm) {
  try {
    const wordsRef = collection(db, WORDS_COLLECTION);
    const q = query(
      wordsRef,
      where('word', '>=', searchTerm.toLowerCase()),
      where('word', '<=', searchTerm.toLowerCase() + '\uf8ff'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error searching words:', error);
    throw error;
  }
}

/**
 * Get a single word by ID
 */
export async function getWordById(wordId) {
  try {
    const wordRef = doc(db, WORDS_COLLECTION, wordId);
    const wordDoc = await getDoc(wordRef);

    if (wordDoc.exists()) {
      return { id: wordDoc.id, ...wordDoc.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching word:', error);
    throw error;
  }
}

/**
 * Add a new word to Firestore
 * @param {object} wordData - Word data
 * @param {string} userId - User ID adding the word
 * @param {string} userEmail - User email to check if admin
 */
export async function addWord(wordData, userId, userEmail) {
  try {
    const wordsRef = collection(db, WORDS_COLLECTION);
    const newDocRef = doc(wordsRef);

    // Check if user is admin
    const isAdmin = userEmail === ADMIN_EMAIL;
    const original = normalizeAnswer(wordData.word);
    if (Object.prototype.hasOwnProperty.call(policy.retired, original) && (isAdmin || original !== 'abbas')) {
      throw new Error(policy.retired[original]);
    }

    const curated = curateWord({ ...wordData, isGlobal: isAdmin });
    const wordDocument = {
      ...wordData,
      ...curated,
      word: curated.word,
      addedDate: new Date(),
      source: isAdmin ? 'admin' : 'user-contributed',
      verified: isAdmin, // Admin words are auto-verified
      usageCount: 0,
      category: wordData.category || 'custom',
      difficulty: curated.difficulty,
      // Access control fields
      isGlobal: isAdmin, // Only admin words are global
      userId: isAdmin ? null : userId, // Admin words don't have userId
      createdBy: userEmail
    };

    await setDoc(newDocRef, wordDocument);

    return { id: newDocRef.id, ...wordDocument };
  } catch (error) {
    console.error('Error adding word:', error);
    throw error;
  }
}

/** Idempotent admin import: update existing IDs, archive duplicates, add only missing words. */
export async function syncCuratedSharedWords(wordList) {
  const snapshot = await getDocs(query(collection(db, WORDS_COLLECTION), where('isGlobal', '==', true)));
  const records = snapshot.docs.map(item => ({ ...item.data(), id: item.id }));
  const plan = buildCurationPlan(records, wordList);
  for (let index = 0; index < plan.length; index += 400) {
    const batch = writeBatch(db);
    for (const change of plan.slice(index, index + 400)) {
      const ref = doc(db, WORDS_COLLECTION, change.id);
      if (change.kind === 'create') batch.set(ref, { ...change.fields, addedDate: serverTimestamp() }, { merge: true });
      else batch.update(ref, change.fields);
    }
    await batch.commit();
    invalidateWordCache();
  }
  return { totalImported: plan.filter(change => change.kind === 'create').length, totalUpdated: plan.filter(change => change.kind === 'update').length, totalArchived: plan.filter(change => change.kind === 'archive').length };
}

/**
 * Update a word
 */
export async function updateWord(wordId, updates) {
  try {
    const wordRef = doc(db, WORDS_COLLECTION, wordId);
    await updateDoc(wordRef, updates);
    return { id: wordId, ...updates };
  } catch (error) {
    console.error('Error updating word:', error);
    throw error;
  }
}

/**
 * Delete a word
 */
export async function deleteWord(wordId) {
  try {
    const wordRef = doc(db, WORDS_COLLECTION, wordId);
    await deleteDoc(wordRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting word:', error);
    throw error;
  }
}

/**
 * Increment usage count for a word
 */
export async function incrementWordUsage(wordId) {
  try {
    const wordRef = doc(db, WORDS_COLLECTION, wordId);
    const wordDoc = await getDoc(wordRef);

    if (wordDoc.exists()) {
      const currentCount = wordDoc.data().usageCount || 0;
      await updateDoc(wordRef, {
        usageCount: currentCount + 1
      });
    }
  } catch (error) {
    console.error('Error incrementing word usage:', error);
    // Don't throw error for usage count updates
  }
}
