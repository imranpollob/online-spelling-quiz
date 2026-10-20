# 📝 Spelling Quiz

A React-based spelling quiz application with Firebase backend and 850 curated default entries.

![](screenshot1.png)
![](screenshot2.png)
![](screenshot3.png)


## Features

- 🎯 Interactive spelling quizzes with multiple difficulty levels
- 🔊 Locally generated Kokoro pronunciation clips, with browser speech fallback
- 🔐 User authentication (Email, Google, or Anonymous)
- 📚 Curated library with spelling variants, difficulty levels, and practice types
- 🎨 Modern UI with dark mode support
- � Tiered access: Admin, Registered Users, and Guests

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase**
   
   Create `.env` file with your Firebase credentials:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id

   ```

3. **Start the app**
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000)

4. **Import words** (Admin only)
   - Login as admin (`polboy777@gmail.com`)
   - Go to `/admin`
   - Sync the curated word library (repeated syncs do not create duplicates)

## Local pronunciation audio (Kokoro)

The React app plays saved MP3 clips generated on your computer with
[Kokoro-82M](https://github.com/hexgrad/kokoro). The default is `af_heart`
(American English) at `0.95` speed. Visitors do not download the model or need a
GPU. Custom words without clips, or clips that fail to load, use the browser's
speech synthesis. Browser speech availability and offline support depend on the
installed browser/OS voices.

### Set up the generator

Use Python 3.12 in a separate environment:

```bash
python3 -m venv .venv-audio
.venv-audio/bin/python -m pip install -r scripts/requirements-audio.txt
```

PyTorch is installed as a Kokoro dependency. For GPU acceleration, use a PyTorch
build compatible with your NVIDIA driver. To reuse an existing working PyTorch
installation, create the environment with `python3 -m venv --system-site-packages
.venv-audio` instead. Dependencies stay inside the environment. The bundled
espeak-ng library avoids a system package installation.

### Generate or update clips

```bash
# Entire built-in library; automatically uses CUDA when available.
.venv-audio/bin/python scripts/generate-pronunciations.py

# One new word, or a UTF-8 file containing one word per line / a JSON array.
.venv-audio/bin/python scripts/generate-pronunciations.py --word serendipity
.venv-audio/bin/python scripts/generate-pronunciations.py --words-file my-words.txt

# CPU-only generation, or a different voice.
.venv-audio/bin/python scripts/generate-pronunciations.py --device cpu --limit 5
.venv-audio/bin/python scripts/generate-pronunciations.py --voice bf_emma
```

The first run downloads the model, voice, and English language resources;
generation then runs locally. Later runs reuse cached downloads and skip clips
whose settings and file hashes match. `--force` regenerates selected clips.
The model and voice are pinned to a specific Hugging Face revision.

Audio files live in `public/audio/kokoro/`; `src/data/pronunciations.json` records
their filenames, phonemes, voice, speed, model revision, duration, and checksums.
Keep both in version control and rebuild after generating clips. `npm run build`
copies the clips into the static site, including GitHub Pages deployments. There
is no speech API key or Python server needed for playback. Regenerating with new
settings leaves older files in place; only files referenced in the manifest are
used.

### Correct a pronunciation

Listen to difficult or ambiguous words before publishing. Kokoro can be weaker
on very short utterances, and words such as `lead`, `desert`, and `minute` have
multiple valid pronunciations. These clips use one pronunciation per spelling;
they do not resolve homophones or select pronunciation from a sentence.

Add explicit phonemes to `scripts/pronunciation-overrides.json`, using Kokoro's
phoneme notation (see the generated manifest for examples):

```json
{
  "lead": "lˈid"
}
```

Then rerun the generator for that word. The changed override invalidates its
cached clip. Pronunciation text is sent only to the local model.

## Curated word collection

The default bank contains 850 unique canonical entries. The live library can
also contain additional shared and personal words. Curation metadata lives in
`src/data/word-curation.json`; `src/data/wordPolicy.js` applies the same policy
to the app, imports, and the maintenance script.

- `minuscule` replaces `miniscule` as the teaching target. The latter is recorded
  as a disputed spelling/error example, not an accepted answer.
- `could of` is retired as a correct-answer target. The name `abbas` is excluded
  from the curated shared collection. Existing records are archived, not deleted.
- Standard equivalent spellings share one canonical entry. For example,
  `neighbor` accepts `neighbour`, and `canceled` accepts `cancelled`. The displayed
  form follows American English. British noun/verb distinctions such as
  `practice`/`practise` and `license`/`licence` are reserved for context practice.
- Homophones, phrases, and selected context-dependent pronunciations remain
  browseable and playable, but are excluded from audio-only quizzes. Definitions
  or sentence exercises for these entries are not implemented yet. Context
  flags are a curated safeguard, not an exhaustive pronunciation dictionary.
- Core spelling, beginner warm-up, and vocabulary challenge are separate quiz
  sets. A round uses the actual number of available questions, and result rows
  and summary scores both accept the same standard variants.
- Difficulty is an editorial learning aid based on explicit foundation and
  challenge lists, not a CEFR level or a measured misspelling-frequency rank.
- The 20 additions are accidentally, broccoli, zucchini, caffeine, refrigerator,
  spaghetti, assessment, auxiliary, cancellation, curriculum, entrepreneur,
  kindergarten, acquiesce, annihilate, discernible, exaggeration, lieutenant,
  prerogative, susceptible, and veterinarian.

The Words page can filter by word type, find accepted variants and common error
examples, and displays proper-noun capitalization. Newly added personal words
retain their selected difficulty.

### Maintain the shared library

The admin import action reconciles the current default bank with Firestore:
it preserves existing IDs, updates metadata, adds missing entries with stable
IDs, and archives duplicate variant records. It does not overwrite personal
collections. Run the tests before syncing a changed policy.

```bash
# Read-only plan, using the project configured in .env.
node scripts/curate-shared-library.cjs --dry-run

# Apply only when the configured client has permission to write.
node scripts/curate-shared-library.cjs --apply
```

The CLI saves the pre-change fields and plan to the ignored, local
`.word-curation-backups/` directory before attempting a write. Firebase rules
still apply; an unauthenticated CLI cannot replace an authenticated admin session.
Use the signed-in admin page when administrator authentication is required.

Policy references: [Merriam-Webster on miniscule](https://www.merriam-webster.com/dictionary/miniscule),
[Canada's language guidance on could of](https://our-languages.canada.ca/en/writing-tips-plus/could-have-couldve-could-of),
[Cambridge on spelling variants](https://dictionary.cambridge.org/grammar/british-grammar/spelling-and-verb-forms),
and [Scripps on definitions and sentence context](https://spellingbee.com/rules).

## User Roles

| Role           | Can Add Words             | Word Visibility | Can Delete |
| -------------- | ------------------------- | --------------- | ---------- |
| **Admin**      | Global words (all users)  | All             | Any word   |
| **Registered** | Personal words (own only) | Global + Own    | Own only   |
| **Guest**      | No (prompted to sign up)  | Global only     | None       |

## Tech Stack

- React 18
- Firebase (Firestore, Auth)
- Tailwind CSS
- React Router v6
- Kokoro-82M (local audio generation) and Web Speech API (fallback)

## Build

```bash
npm run build
```

## License

MIT
