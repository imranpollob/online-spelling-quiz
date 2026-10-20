import React, { useEffect, useRef } from "react";
import LibraryIcon from "./LibraryIcon";

export default function WordDialog({ title, description, onClose, busy, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    dialog.querySelector("[data-dialog-initial-focus]")?.focus();
    return () => dialog.close();
  }, []);

  return (
    <dialog ref={ref} className="word-dialog" aria-labelledby="word-dialog-title" aria-describedby="word-dialog-description"
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <div className="word-dialog-inner">
        <div className="word-dialog-heading">
          <div className="word-dialog-symbol"><LibraryIcon name="book" /></div>
          <button type="button" className="library-icon-button" onClick={onClose} disabled={busy} aria-label="Close dialog"><LibraryIcon name="close" /></button>
        </div>
        <h2 id="word-dialog-title">{title}</h2>
        <p id="word-dialog-description">{description}</p>
        {children}
      </div>
    </dialog>
  );
}
