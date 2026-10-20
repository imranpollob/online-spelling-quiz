#!/usr/bin/env python3
"""Generate deployable Kokoro clips; no speech service is needed at runtime."""

import argparse
import hashlib
import importlib.metadata
import json
import math
import os
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "src/data/pronunciations.json"
AUDIO_DIR = ROOT / "public/audio/kokoro"
REPO = "hexgrad/Kokoro-82M"
REVISION = "f3ff3571791e39611d31c381e3a41a3af07b4987"
SAMPLE_RATE = 24000


def normalize(word):
    return " ".join(word.strip().lower().split())


def read_words(path):
    text = path.read_text(encoding="utf-8")
    if path.suffix == ".js":
        # The repository word list is a JSON-compatible array, not executed JS.
        return json.loads(text[text.index("["):text.rindex("]") + 1])
    if path.suffix == ".json":
        return json.loads(text)
    return text.splitlines()


def write_manifest(manifest):
    manifest["entries"] = dict(sorted(manifest["entries"].items()))
    temporary = MANIFEST.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(MANIFEST)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--word", action="append", help="Generate one word (repeatable).")
    parser.add_argument("--words-file", type=Path, help="JSON array or one word per line; default: built-in list.")
    parser.add_argument("--voice", default="af_heart", help="American or British English Kokoro voice.")
    parser.add_argument("--speed", type=float, default=0.95)
    parser.add_argument("--device", choices=["auto", "cpu", "cuda"], default="auto")
    parser.add_argument("--limit", type=int, help="Generate just the first N selected words.")
    parser.add_argument("--force", action="store_true", help="Regenerate matching clips too.")
    parser.add_argument("--overrides", type=Path, default=ROOT / "scripts/pronunciation-overrides.json")
    args = parser.parse_args()
    if not math.isfinite(args.speed) or not 0.5 <= args.speed <= 2:
        parser.error("--speed must be between 0.5 and 2")
    if not args.voice.startswith(("af_", "am_", "bf_", "bm_")):
        parser.error("Choose an American (af_/am_) or British (bf_/bm_) English voice")
    if args.limit is not None and args.limit < 1:
        parser.error("--limit must be positive")

    words = args.word or read_words(args.words_file or ROOT / "src/data/words.js")
    if not isinstance(words, list) or not all(isinstance(w, str) for w in words):
        parser.error("Word input must be an array of strings")
    words = list(dict.fromkeys(normalize(w) for w in words if w.strip()))
    if args.limit:
        words = words[:args.limit]
    overrides = json.loads(args.overrides.read_text(encoding="utf-8"))
    if not isinstance(overrides, dict) or not all(
        isinstance(k, str) and isinstance(v, str) and v.strip() for k, v in overrides.items()
    ):
        parser.error("Overrides must map words to nonempty Kokoro phoneme strings")
    overrides = {normalize(k): v for k, v in overrides.items()}

    os.environ.setdefault("USE_TF", "0")
    os.environ.setdefault("USE_FLAX", "0")
    import numpy as np
    import soundfile as sf
    import torch
    from huggingface_hub import hf_hub_download
    from phonemizer.backend.espeak.wrapper import EspeakWrapper
    import espeakng_loader
    from kokoro import KModel, KPipeline

    # Bundled espeak-ng avoids requiring a system package or sudo.
    EspeakWrapper.set_library(espeakng_loader.get_library_path())
    os.environ["ESPEAK_DATA_PATH"] = espeakng_loader.get_data_path()
    torch.set_num_threads(min(4, os.cpu_count() or 1))
    device = ("cuda" if torch.cuda.is_available() else "cpu") if args.device == "auto" else args.device
    settings = {
        "model": REPO, "revision": REVISION, "voice": args.voice,
        "speed": args.speed, "sampleRate": SAMPLE_RATE,
        "kokoroVersion": importlib.metadata.version("kokoro"),
        "misakiVersion": importlib.metadata.version("misaki"),
        "silenceTrim": {"threshold": 0.001, "leadingMs": 80, "trailingMs": 150},
    }
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    pipeline = None
    generated = skipped = 0
    failures = []
    for index, word in enumerate(words, 1):
        try:
            recipe = {**settings, "word": word, "phonemeOverride": overrides.get(word)}
            signature = hashlib.sha256(json.dumps(recipe, sort_keys=True).encode()).hexdigest()
            previous = manifest["entries"].get(word, {})
            previous_path = AUDIO_DIR / Path(previous.get("file", "missing")).name
            if not args.force and previous.get("signature") == signature and previous_path.is_file():
                if hashlib.sha256(previous_path.read_bytes()).hexdigest() == previous.get("sha256"):
                    skipped += 1
                    continue
            if pipeline is None:
                print(f"Loading {REPO} on {device}; first run downloads model and language data.", flush=True)
                def download(filename):
                    return hf_hub_download(REPO, filename=filename, revision=REVISION)
                model = KModel(repo_id=REPO, config=download("config.json"), model=download("kokoro-v1_0.pth"))
                model = model.to(device).eval()
                pipeline = KPipeline(lang_code=args.voice[0], repo_id=REPO, model=model)
                # Pin the voice download to the same model revision.
                pipeline.voices[args.voice] = torch.load(download(f"voices/{args.voice}.pt"), weights_only=True)

            with torch.inference_mode():
                if word in overrides:
                    phonemes = overrides[word]
                else:
                    phonemes, tokens = pipeline.g2p(word)
                    if any(token.phonemes is None for token in tokens):
                        raise ValueError("Unrecognized word; add a phoneme override")
                if not phonemes.strip() or len(phonemes) > 510:
                    raise ValueError("Empty or overlong pronunciation")
                unknown = set(phonemes) - set(pipeline.model.vocab)
                if unknown:
                    raise ValueError(f"Unsupported phoneme symbols: {sorted(unknown)}")
                results = list(pipeline.generate_from_tokens(phonemes, voice=args.voice, speed=args.speed))
                audio = np.concatenate([result.audio.cpu().numpy() for result in results])
            if not np.isfinite(audio).all() or len(audio) < SAMPLE_RATE * 0.1 or np.max(np.abs(audio)) < 0.001:
                raise ValueError("Generated audio is empty, invalid, or silent")
            # Remove model padding while keeping margins around quiet consonants.
            active = np.flatnonzero(np.abs(audio) >= settings["silenceTrim"]["threshold"])
            start = max(0, int(active[0]) - int(SAMPLE_RATE * 0.08))
            end = min(len(audio), int(active[-1]) + 1 + int(SAMPLE_RATE * 0.15))
            audio = audio[start:end]
            # libsndfile encodes MP3 locally, without ffmpeg or an external API.
            filename = f"{signature[:24]}.mp3"
            target = AUDIO_DIR / filename
            temporary = target.with_suffix(".tmp")
            sf.write(temporary, audio, SAMPLE_RATE, format="MP3", subtype="MPEG_LAYER_III")
            decoded, rate = sf.read(temporary)
            if rate != SAMPLE_RATE or not np.isfinite(decoded).all() or np.max(np.abs(decoded)) < 0.001:
                raise ValueError("Encoded audio failed validation")
            temporary.replace(target)
            manifest["entries"][word] = {
                **recipe, "signature": signature, "phonemes": phonemes,
                "file": f"audio/kokoro/{filename}", "duration": round(len(decoded) / rate, 3),
                "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
            }
            write_manifest(manifest)
            generated += 1
            print(f"[{index}/{len(words)}] {word}: {len(decoded) / rate:.2f}s ({phonemes})", flush=True)
        except Exception as error:
            failures.append(word)
            print(f"FAILED {word}: {error}", file=sys.stderr, flush=True)
            # A model/setup failure will affect every word; fail early.
            if pipeline is None:
                break
    print(f"Generated {generated}; unchanged {skipped}; failed {len(failures)}.", flush=True)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
