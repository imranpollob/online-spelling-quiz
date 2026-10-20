import say, { stopSpeaking } from "./say";

jest.mock("../data/pronunciations.json", () => ({
  entries: {
    necessary: { file: "audio/kokoro/necessary.mp3" },
    neighbor: { file: "audio/kokoro/neighbor.mp3" },
    "all ready": { file: "audio/kokoro/all-ready.mp3" },
  },
}));

let clips;
const originalPublicUrl = process.env.PUBLIC_URL;

beforeEach(() => {
  clips = [];
  window.speechSynthesis = { cancel: jest.fn(), speak: jest.fn() };
  window.SpeechSynthesisUtterance = jest.fn(function (text) { this.text = text; });
  window.Audio = jest.fn(function (src) {
    this.src = src;
    this.play = jest.fn().mockResolvedValue(undefined);
    this.pause = jest.fn();
    clips.push(this);
  });
  process.env.PUBLIC_URL = "/online-spelling-quiz/";
});

afterEach(() => {
  stopSpeaking();
  if (originalPublicUrl === undefined) delete process.env.PUBLIC_URL;
  else process.env.PUBLIC_URL = originalPublicUrl;
});

test("plays a normalized word from the deployment subdirectory", () => {
  say("  NECESSARY ");
  expect(clips[0].src).toBe("/online-spelling-quiz/audio/kokoro/necessary.mp3");
  expect(clips[0].play).toHaveBeenCalledTimes(1);
  expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
});

test("normalizes whitespace in multiword entries", () => {
  say("all   ready");
  expect(clips[0].src).toContain("all-ready.mp3");
});

test("uses the canonical saved clip for a standard spelling variant", () => {
  say("neighbour");
  expect(clips[0].src).toContain("audio/kokoro/neighbor.mp3");
  expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
});

test("uses browser speech for custom words without a saved clip", () => {
  say(" NewWord ");
  expect(clips).toHaveLength(0);
  expect(window.speechSynthesis.speak).toHaveBeenCalledWith(
    expect.objectContaining({ text: "newword", lang: "en-US" })
  );
});

test("falls back only once when both media error and play rejection occur", async () => {
  let reject;
  window.Audio.mockImplementationOnce(function () {
    this.pause = jest.fn();
    this.play = () => new Promise((resolve, fail) => { reject = fail; });
    clips.push(this);
  });
  say("necessary");
  const onerror = clips[0].onerror;
  onerror();
  reject(new Error("same media failed"));
  await Promise.resolve();
  expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
  expect(clips[0].pause).toHaveBeenCalled();
});

test("cancels the previous clip and ignores its late failure", async () => {
  let reject;
  window.Audio.mockImplementationOnce(function () {
    this.pause = jest.fn();
    this.play = () => new Promise((resolve, fail) => { reject = fail; });
    clips.push(this);
  });
  say("necessary");
  const onerror = clips[0].onerror;
  say("all ready");
  onerror();
  reject(new Error("old request failed"));
  await Promise.resolve();
  expect(clips[0].pause).toHaveBeenCalled();
  expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
  expect(clips[1].play).toHaveBeenCalledTimes(1);
});

test("falls back when a saved clip cannot be played", async () => {
  window.Audio.mockImplementationOnce(function () {
    this.pause = jest.fn();
    this.play = () => Promise.reject(new Error("decode failed"));
  });
  say("necessary");
  await Promise.resolve();
  expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
});

test("does not fall back when autoplay needs a user gesture", async () => {
  window.Audio.mockImplementationOnce(function () {
    this.pause = jest.fn();
    this.play = () => Promise.reject({ name: "NotAllowedError" });
  });
  say("necessary");
  await Promise.resolve();
  expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
});

test("handles missing browser speech and empty input", () => {
  delete window.speechSynthesis;
  expect(() => { say("custom"); say(undefined); say(" "); }).not.toThrow();
  expect(clips).toHaveLength(0);
});
