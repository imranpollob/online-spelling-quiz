import React from "react";
import { Link } from "react-router-dom";
import LibraryIcon from "./LibraryIcon";
import "./QuizSetup.css";

const roundSizes = [5, 10, 15, 20, 30, 50];

export default function QuizNew({ totalQuestions, setTotalQuestions, handleStartQuiz, availableCount = 0 }) {
  const roundCount = Math.min(Number(totalQuestions), availableCount);
  return (
    <section className="quiz-setup" aria-labelledby="quiz-setup-title">
      <div className="quiz-setup-intro">
        <div>
          <p className="quiz-eyebrow">A LITTLE LEARNING, EVERY DAY</p>
          <h1 id="quiz-setup-title">Make every word count<span>.</span></h1>
          <p>Listen carefully. Trust your memory. Build your spelling confidence.</p>
        </div>
        <Link className="quiz-library-link" to="/words"><LibraryIcon name="book" /> Explore word library <LibraryIcon name="arrow" /></Link>
      </div>

      <div className="quiz-setup-layout">
        <div className="quiz-config">
          <div className="quiz-config-heading">
            <span className="quiz-config-icon"><LibraryIcon name="headphones" /></span>
            <div><h2>Your next spelling session</h2><p>A few words today. A little more confidence tomorrow.</p></div>
          </div>
          <fieldset className="quiz-round-sizes" aria-describedby="quiz-round-help">
            <legend>How many words?</legend>
            <p id="quiz-round-help">Choose a quick round or settle in for a challenge.</p>
            <div className="quiz-round-options">
              {roundSizes.map(count => <label key={count} className="quiz-round-option">
                <input type="radio" name="totalQuestions" value={count} checked={Number(totalQuestions) === count}
                  onChange={() => setTotalQuestions(count)} />
                <span className="quiz-round-tile"><span className="quiz-round-check"><LibraryIcon name="check" /></span><strong>{count}</strong><span>words</span></span>
              </label>)}
            </div>
          </fieldset>
          {!availableCount ? <p className="quiz-availability" role="status">No words are ready for an audio quiz yet. Explore the word library to find more words.</p>
            : Number(totalQuestions) > availableCount && <p className="quiz-availability" role="status">This round will use all {availableCount} available {availableCount === 1 ? "word" : "words"}.</p>}
          <div className="quiz-start-area">
            <p><strong>{roundCount} {roundCount === 1 ? "word" : "words"}</strong><span aria-hidden="true">·</span>At your own pace</p>
            <button className="quiz-start-button" onClick={handleStartQuiz} disabled={!availableCount}>Start quiz <LibraryIcon name="arrow" /></button>
            <span className="quiz-sound-note"><LibraryIcon name="speaker" /> Make sure your sound is on.</span>
          </div>
        </div>

        <aside className="quiz-guide" aria-labelledby="quiz-guide-title">
          <p className="quiz-eyebrow">SIMPLE STEPS. STRONGER SPELLING.</p>
          <h2 id="quiz-guide-title">Find your rhythm.</h2>
          <ol>
            <li><span className="quiz-step-number">01</span><div><h3>Listen closely</h3><p>Hear a word pronounced. Replay it whenever you need.</p></div></li>
            <li><span className="quiz-step-number">02</span><div><h3>Make it yours</h3><p>Type what you hear, then press <kbd>Enter</kbd> to move on.</p></div></li>
            <li><span className="quiz-step-number">03</span><div><h3>Learn as you go</h3><p>Review your score and spellings at the end of your round.</p></div></li>
          </ol>
          <div className="quiz-guide-footer"><LibraryIcon name="check" /><p>No timer. No rush.<br /><strong>Just a little progress.</strong></p></div>
        </aside>
      </div>
      <p className="quiz-setup-footer">Progress starts with one word. You’ve got this.</p>
    </section>
  );
}
