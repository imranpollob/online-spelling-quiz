import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { addWord, deleteWord } from "../services/wordService";
import { useWords } from "../hooks/useWords";
import { useAuth } from "../contexts/AuthContext";
import { successToast, dangerToast } from "../helper-functions/toast";
import { stopSpeaking } from "../helper-functions/say";
import Toast from "../helper-components/Toast";
import WordList from "./WordList";
import WordDialog from "./WordDialog";
import LibraryIcon from "./LibraryIcon";
import "./Words.css";
import wordPolicy from "../data/wordPolicy.js";

const { canonicalSpelling, policy } = wordPolicy;

const ADMIN_EMAIL = "polboy777@gmail.com";
const PAGE_SIZE = 24;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const LEVELS = ["beginner", "intermediate", "advanced"];
const INITIAL_FILTERS = { query: "", collection: "all", difficulty: "all", letter: "all", sort: "az", type: "all" };
const WORD_TYPES = [["spelling", "Core spelling"], ["context", "Needs context"], ["phrase", "Phrases"], ["vocabulary", "Vocabulary challenge"], ["warmup", "Warm-up"], ["proper-noun", "Proper nouns"], ["name", "Names"]];
const number = (value) => value.toLocaleString();

export default function Words({ onRequestLogin }) {
  const { user, isAuthenticated } = useAuth();
  const { words, loading, error, refreshWords } = useWords(user?.uid);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [view, setView] = useState("grid");
  const [showAdd, setShowAdd] = useState(false);
  const [currentValue, setCurrentValue] = useState("");
  const [newDifficulty, setNewDifficulty] = useState("intermediate");
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const searchRef = useRef(null);
  const contentRef = useRef(null);
  const isAdmin = user?.email === ADMIN_EMAIL;
  const canAdd = isAuthenticated && !user?.isAnonymous;

  useEffect(() => {
    const focusSearch = (event) => {
      const target = event.target;
      if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) && !target.isContentEditable &&
        !document.querySelector("dialog[open]")) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => { window.removeEventListener("keydown", focusSearch); stopSpeaking(); };
  }, []);

  function changeFilter(key, value) {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPage(1);
  }

  function resetFilters() {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  }

  function goToPage(value) {
    setPage(value);
    contentRef.current?.scrollIntoView?.({ block: "start", behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? "instant" : "smooth" });
  }

  const ownWords = words.filter((word) => !word.isGlobal && user?.uid && word.userId === user.uid);
  const sharedWords = words.filter((word) => word.isGlobal);
  const collections = [
    { value: "all", label: "All words", icon: "library", count: words.length },
    { value: "shared", label: "Shared library", icon: "globe", count: sharedWords.length },
    { value: "mine", label: "My words", icon: "personal", count: ownWords.length },
  ];
  const collectionWords = useMemo(() => words.filter((word) =>
    filters.collection === "all" || (filters.collection === "shared" ? word.isGlobal : (!word.isGlobal && user?.uid && word.userId === user.uid))
  ), [words, filters.collection, user?.uid]);
  const levelCounts = LEVELS.reduce((counts, level) => ({ ...counts, [level]: collectionWords.filter((word) => word.difficulty === level).length }), {});
  const matchingWords = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return collectionWords.filter((word) =>
      [word.word, ...(word.acceptedSpellings || []), ...(word.commonMistakes || [])].some((spelling) => spelling.toLowerCase().includes(query)) &&
      (filters.difficulty === "all" || word.difficulty === filters.difficulty) &&
      (filters.type === "all" || word.practiceType === filters.type)
    );
  }, [collectionWords, filters.query, filters.difficulty, filters.type]);
  const availableLetters = new Set(matchingWords.map((word) => word.word[0]?.toUpperCase()));
  const filteredWords = useMemo(() => {
    const result = matchingWords.filter((word) => filters.letter === "all" || word.word[0]?.toUpperCase() === filters.letter);
    return result.sort((a, b) => {
      if (filters.sort === "shortest") return a.word.length - b.word.length || a.word.localeCompare(b.word);
      return (filters.sort === "za" ? -1 : 1) * a.word.localeCompare(b.word);
    });
  }, [matchingWords, filters.letter, filters.sort]);
  const totalPages = Math.max(1, Math.ceil(filteredWords.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageWords = filteredWords.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hasFilters = filters.query || filters.collection !== "all" || filters.difficulty !== "all" || filters.letter !== "all" || filters.type !== "all";
  const visiblePages = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((value) => value === 1 || value === totalPages || Math.abs(value - currentPage) <= 1);

  async function handleAddWord(event) {
    event.preventDefault();
    if (adding || !canAdd) return;
    const cleanWord = currentValue.trim().toLowerCase().replace(/\s+/g, " ");
    if (!cleanWord || !/^[a-z]+(?:[ '-][a-z]+)*$/.test(cleanWord)) {
      setFormError("Enter an English word. Spaces, hyphens, and apostrophes are welcome.");
      return;
    }
    if (Object.prototype.hasOwnProperty.call(policy.retired, cleanWord) && (isAdmin || cleanWord !== "abbas")) {
      setFormError(policy.retired[cleanWord]);
      return;
    }
    if (words.some((word) => canonicalSpelling(word.word) === canonicalSpelling(cleanWord))) {
      setFormError(`“${cleanWord}” is already in your library. Try searching for it instead.`);
      return;
    }
    setAdding(true);
    setFormError("");
    try {
      await addWord({ word: cleanWord, difficulty: newDifficulty, category: "custom" }, user.uid, user.email);
      setCurrentValue("");
      setShowAdd(false);
      setFilters({ ...INITIAL_FILTERS, query: cleanWord, collection: isAdmin ? "shared" : "mine" });
      setPage(1);
      successToast(isAdmin ? `“${cleanWord}” added to the shared library.` : `“${cleanWord}” added to your words.`);
      await refreshWords();
    } catch (addError) {
      setFormError(`Couldn't add this word. ${addError.message}`);
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteWord() {
    if (deleting || !deleteTarget || !isAuthenticated || (!isAdmin && (deleteTarget.isGlobal || deleteTarget.userId !== user?.uid))) return;
    setDeleting(true);
    try {
      await deleteWord(deleteTarget.id);
      successToast(`“${deleteTarget.word}” removed from the library.`);
      setDeleteTarget(null);
      await refreshWords();
    } catch (deleteError) {
      dangerToast(`Couldn't remove this word. ${deleteError.message}`);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="word-library">
      <Toast />
      <div className="library-shell">
        <header className="library-header">
          <div>
            <div className="library-eyebrow"><span /> A LITTLE LEARNING, EVERY DAY</div>
            <h1>Word library<span className="library-title-dot">.</span></h1>
            <p>Discover new words. Listen closely. Make them yours.</p>
          </div>
          <div className="library-header-actions">
            <Link to="/quiz" className="library-button library-button-secondary"><LibraryIcon name="headphones" /> Practice spelling</Link>
            <button type="button" className="library-button library-button-primary" onClick={() => {
              if (!canAdd) { onRequestLogin?.(); return; }
              setFormError(""); setShowAdd(true);
            }}><LibraryIcon name="plus" /> Add a word</button>
          </div>
        </header>

        <div className="library-layout">
          <aside className="library-sidebar" aria-label="Library filters">
            <section className="library-collections">
              <h2 className="library-section-label">YOUR LIBRARY</h2>
              <div className="library-collection-buttons">
                {collections.map((collection) => <button type="button" key={collection.value}
                  className={`library-collection ${filters.collection === collection.value ? "is-selected" : ""}`}
                  aria-pressed={filters.collection === collection.value} onClick={() => changeFilter("collection", collection.value)}>
                  <LibraryIcon name={collection.icon} /><span>{collection.label}</span><span className="library-collection-count">{loading && !words.length ? "—" : number(collection.count)}</span>
                </button>)}
              </div>
            </section>

            <section className="library-levels">
              <h2 className="library-section-label">DIFFICULTY</h2>
              <button type="button" className={`library-level-option ${filters.difficulty === "all" ? "is-selected" : ""}`} aria-pressed={filters.difficulty === "all"} onClick={() => changeFilter("difficulty", "all")}>
                <span className="library-radio">{filters.difficulty === "all" && <span />}</span><span>All levels</span><span className="library-level-count">{number(collectionWords.length)}</span>
              </button>
              {LEVELS.map((level) => <button type="button" key={level} className={`library-level-option ${filters.difficulty === level ? "is-selected" : ""}`} aria-pressed={filters.difficulty === level} onClick={() => changeFilter("difficulty", level)}>
                <span className="library-radio">{filters.difficulty === level && <span />}</span><span className={`level-dot level-dot-${level}`} /><span className="library-capitalize">{level}</span><span className="library-level-count">{number(levelCounts[level])}</span>
              </button>)}
            </section>

            <div className="library-note">
              <div className="library-note-art" aria-hidden="true"><span>Aa</span><LibraryIcon name="speaker" /></div>
              <h3>Hear it. Say it. Spell it.</h3>
              <p>Listen to a word, say it out loud, then put your memory to the test.</p>
              <Link to="/quiz">Take a quick quiz <LibraryIcon name="arrow" /></Link>
            </div>
            <p className="library-sidebar-footnote"><LibraryIcon name={isAdmin ? "globe" : "personal"} />{isAdmin ? "You’re managing the shared library." : "A few words today. A little more confidence tomorrow."}</p>
          </aside>

          <section ref={contentRef} className="library-content" aria-label="Browse words" aria-busy={loading}>
            <div className="library-toolbar">
              <form className="library-search" role="search" onSubmit={(event) => event.preventDefault()}>
                <LibraryIcon name="search" />
                <input ref={searchRef} type="search" aria-label="Search words" placeholder="Search for a word…" value={filters.query} onChange={(event) => changeFilter("query", event.target.value)} />
                {filters.query ? <button type="button" className="library-icon-button" aria-label="Clear search" onClick={() => { changeFilter("query", ""); searchRef.current?.focus(); }}><LibraryIcon name="close" /></button> : <kbd>/</kbd>}
              </form>
              <label className="library-mobile-level"><span className="sr-only">Difficulty</span><select value={filters.difficulty} onChange={(event) => changeFilter("difficulty", event.target.value)}><option value="all">All levels</option>{LEVELS.map((level) => <option key={level} value={level}>{level[0].toUpperCase() + level.slice(1)}</option>)}</select></label>
              <label className="library-sort"><span className="sr-only">Sort words</span><select value={filters.sort} onChange={(event) => changeFilter("sort", event.target.value)}><option value="az">Alphabetical: A–Z</option><option value="za">Alphabetical: Z–A</option><option value="shortest">Shortest first</option></select></label>
              <div className="library-view-toggle" role="group" aria-label="Word layout">
                <button type="button" aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")}><LibraryIcon name="grid" /></button>
                <button type="button" aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")}><LibraryIcon name="list" /></button>
              </div>
            </div>

            <div className="library-alphabet" role="group" aria-label="Filter by first letter">
              <button type="button" className={filters.letter === "all" ? "is-selected" : ""} aria-pressed={filters.letter === "all"} onClick={() => changeFilter("letter", "all")}>All</button>
              <span className="library-alphabet-divider" />
              {ALPHABET.map((letter) => <button type="button" key={letter} className={filters.letter === letter ? "is-selected" : ""} aria-label={`Words beginning with ${letter}`} aria-pressed={filters.letter === letter} disabled={!availableLetters.has(letter)} onClick={() => changeFilter("letter", letter)}>{letter}</button>)}
            </div>

            <div className="library-results-heading">
              <div className="library-results-title"><h2>{collections.find((collection) => collection.value === filters.collection).label}</h2><span aria-live="polite" aria-atomic="true">{loading && !words.length ? "Loading…" : `${number(filteredWords.length)} ${filteredWords.length === 1 ? "word" : "words"}`}</span></div>
              <label className="library-type-filter"><span className="sr-only">Word type</span><select value={filters.type} onChange={(event) => changeFilter("type", event.target.value)}><option value="all">All word types</option>{WORD_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              {hasFilters ? <button type="button" className="library-text-button" onClick={resetFilters}><LibraryIcon name="close" /> Clear filters</button> : <span className="library-listen-hint"><LibraryIcon name="speaker" /> Click to hear a word</span>}
            </div>

            {error ? <div className="library-empty" role="alert"><LibraryIcon name="book" /><h3>We couldn’t load your words.</h3><p>Check your connection and give it another try.</p><button type="button" className="library-button library-button-primary" onClick={refreshWords}>Try again</button></div> : loading && !words.length ?
              <div className="library-word-grid library-skeleton" aria-label="Loading word library">{Array.from({ length: 9 }, (_, index) => <div key={index} className="library-skeleton-card"><span /><span /><span /></div>)}</div> : pageWords.length ?
                <WordList words={pageWords} view={view} currentUserId={user?.uid} isAdmin={isAdmin} handleDeleteWord={setDeleteTarget} /> :
                <div className="library-empty"><div className="library-empty-symbol"><LibraryIcon name={filters.collection === "mine" && !filters.query ? "personal" : "search"} /></div><h3>{filters.collection === "mine" && !hasFiltersExceptCollection(filters) ? "Your words start here." : "No words found."}</h3><p>{filters.collection === "mine" && !hasFiltersExceptCollection(filters) ? (canAdd ? "Keep the words you want to work on in your own collection." : "Sign in to build a collection of words you want to master.") : "Try another search or clear your filters to explore the library."}</p><button type="button" className="library-button library-button-primary" onClick={() => {
                  if (filters.collection === "mine" && !hasFiltersExceptCollection(filters)) {
                    if (canAdd) { setFormError(""); setShowAdd(true); } else onRequestLogin?.();
                  } else resetFilters();
                }}>{filters.collection === "mine" && !hasFiltersExceptCollection(filters) ? (canAdd ? "Add your first word" : "Sign in to get started") : "Clear filters"}</button></div>}

            {!!filteredWords.length && !error && <footer className="library-pagination">
              <p>Showing <strong>{number((currentPage - 1) * PAGE_SIZE + 1)}–{number(Math.min(currentPage * PAGE_SIZE, filteredWords.length))}</strong> of {number(filteredWords.length)} {filteredWords.length === 1 ? "word" : "words"}</p>
              <nav aria-label="Word pages">
                <button type="button" className="library-page-arrow" aria-label="Previous page" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}><LibraryIcon name="chevron" className="library-chevron-back" /></button>
                {visiblePages.map((value, index) => <React.Fragment key={value}>{index > 0 && value - visiblePages[index - 1] > 1 && <span className="library-page-ellipsis">…</span>}<button type="button" aria-label={`Page ${value}`} aria-current={value === currentPage ? "page" : undefined} onClick={() => goToPage(value)}>{value}</button></React.Fragment>)}
                <button type="button" className="library-page-arrow" aria-label="Next page" disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}><LibraryIcon name="chevron" /></button>
              </nav>
            </footer>}
            <div className="library-bottom-note"><LibraryIcon name="headphones" /><span>A stronger vocabulary starts with a little curiosity.</span></div>
          </section>
        </div>
      </div>

      {showAdd && <WordDialog title={isAdmin ? "Add to the shared library" : "Add a word to your collection"} description={isAdmin ? "A new word for everyone to discover and practice." : "Save a word you’d like to get more confident spelling."} onClose={() => setShowAdd(false)} busy={adding}>
        <form className="library-word-form" onSubmit={handleAddWord}>
          <label htmlFor="new-library-word">Word or phrase</label>
          <input id="new-library-word" type="text" data-dialog-initial-focus autoComplete="off" maxLength={100} placeholder="e.g. serendipity" value={currentValue} onChange={(event) => { setCurrentValue(event.target.value); setFormError(""); }} disabled={adding} aria-invalid={!!formError} aria-describedby={formError ? "library-form-error" : undefined} required />
          <label htmlFor="new-word-difficulty">Difficulty</label>
          <select id="new-word-difficulty" value={newDifficulty} onChange={(event) => setNewDifficulty(event.target.value)} disabled={adding}>{LEVELS.map((level) => <option key={level} value={level}>{level[0].toUpperCase() + level.slice(1)}</option>)}</select>
          <div className="library-form-notice"><LibraryIcon name={isAdmin ? "globe" : "personal"} /><span>{isAdmin ? "Visible to everyone in the shared library." : "Only you can see your personal words."}</span></div>
          {formError && <p id="library-form-error" className="library-form-error" role="alert">{formError}</p>}
          <div className="word-dialog-actions"><button type="button" className="library-button library-button-secondary" onClick={() => setShowAdd(false)} disabled={adding}>Cancel</button><button type="submit" className="library-button library-button-primary" disabled={adding || !currentValue.trim()}><LibraryIcon name="plus" />{adding ? "Adding…" : "Add word"}</button></div>
        </form>
      </WordDialog>}
      {deleteTarget && <WordDialog title={`Remove “${deleteTarget.word}”?`} description={deleteTarget.isGlobal ? "This word will be removed from the shared library for everyone." : "This word will be removed from your personal collection."} onClose={() => setDeleteTarget(null)} busy={deleting}>
        <div className="word-dialog-actions"><button type="button" data-dialog-initial-focus className="library-button library-button-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Keep word</button><button type="button" className="library-button library-button-danger" onClick={handleDeleteWord} disabled={deleting}><LibraryIcon name="trash" />{deleting ? "Removing…" : "Remove word"}</button></div>
      </WordDialog>}
    </div>
  );
}

function hasFiltersExceptCollection(filters) {
  return filters.query || filters.difficulty !== "all" || filters.letter !== "all" || filters.type !== "all";
}
