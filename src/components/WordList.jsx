import React from "react";
import say from "../helper-functions/say";
import LibraryIcon from "./LibraryIcon";

const LEVELS = ["beginner", "intermediate", "advanced"];

export default function WordList({ words, view = "grid", handleDeleteWord, currentUserId, isAdmin = false }) {
  return (
    <ul className={`library-word-grid library-word-grid-${view}`} aria-label="Words">
      {words.map((word) => {
        const isOwnWord = !!currentUserId && !word.isGlobal && word.userId === currentUserId;
        const canDelete = isAdmin || isOwnWord;
        const difficulty = LEVELS.includes(word.difficulty) ? word.difficulty : null;
        const letters = word.word.replace(/[^a-z]/gi, "").length;
        const displayWord = word.displayWord || word.word;
        const variants = (word.acceptedSpellings || []).filter((spelling) => spelling !== word.word);
        return (
          <li className="library-word-card" key={word.id || word.word}>
            <div className="library-card-topline">
              <span className={`library-difficulty ${difficulty ? `library-difficulty-${difficulty}` : ""}`}><span className={`level-dot ${difficulty ? `level-dot-${difficulty}` : ""}`} />{difficulty || "Uncategorized"}</span>
              {word.requiresContext ? <span className="library-context-note" title={word.usageNote}>Context needed</span> : <span className="library-letter-count">{letters} {letters === 1 ? "letter" : "letters"}</span>}
            </div>
            <div className="library-card-word">
              <div className="library-word-label"><h3>{displayWord}</h3>{!!variants.length && <p className="library-word-alias">Also: {variants.join(", ")}</p>}</div>
              <button type="button" className="library-pronounce" onClick={() => say(word.word)} aria-label={`Listen to ${displayWord}`} title={`Listen to ${displayWord}`}><LibraryIcon name="speaker" /></button>
            </div>
            <div className="library-card-bottomline">
              <span className={`library-word-source ${word.isGlobal ? "" : "library-word-source-personal"}`}><LibraryIcon name={word.isGlobal ? "globe" : "personal"} />{word.isGlobal ? "Shared word" : "My word"}</span>
              <div className="library-card-actions">
                <a href={`https://www.vocabulary.com/dictionary/${encodeURIComponent(word.word)}`} target="_blank" rel="noopener noreferrer" aria-label={`Look up ${word.word} (opens in a new tab)`} title="Look up definition"><LibraryIcon name="book" /><span>Definition</span><LibraryIcon name="external" /></a>
                {canDelete && <button type="button" className="library-delete" onClick={() => handleDeleteWord(word)} aria-label={`Remove ${word.word}`} title="Remove word"><LibraryIcon name="trash" /></button>}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
