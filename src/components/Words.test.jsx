import React from "react";
import { fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Words from "./Words";
import { useWords } from "../hooks/useWords";
import { useAuth } from "../contexts/AuthContext";
import { addWord, deleteWord } from "../services/wordService";
import say from "../helper-functions/say";

jest.mock("../hooks/useWords", () => ({ useWords: jest.fn() }));
jest.mock("../contexts/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("../services/wordService", () => ({ addWord: jest.fn(), deleteWord: jest.fn() }));
jest.mock("../helper-functions/say", () => ({ __esModule: true, default: jest.fn(), stopSpeaking: jest.fn() }));
jest.mock("../helper-components/Toast", () => () => null);
jest.mock("../helper-functions/toast", () => ({ successToast: jest.fn(), dangerToast: jest.fn() }));

const fixtures = [
  { id: "1", word: "absence", difficulty: "beginner", isGlobal: true },
  { id: "2", word: "accommodation", difficulty: "advanced", isGlobal: true },
  { id: "3", word: "rhythm", difficulty: "intermediate", isGlobal: true },
  { id: "4", word: "zephyr", difficulty: "advanced", isGlobal: false, userId: "reader" },
];
const refreshWords = jest.fn().mockResolvedValue(undefined);
const login = jest.fn();

function setup() {
  return render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Words onRequestLogin={login} /></MemoryRouter>);
}

function displayedWords() {
  return within(screen.getByRole("list", { name: "Words" })).getAllByRole("heading").map((heading) => heading.textContent);
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ user: { uid: "reader", email: "reader@example.com" }, isAuthenticated: true });
  useWords.mockReturnValue({ words: fixtures, loading: false, error: null, refreshWords });
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

test("combines search, collection, difficulty and letter filters and clears them", () => {
  setup();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "ACCOM" } });
  expect(displayedWords()).toEqual(["accommodation"]);
  fireEvent.click(screen.getByRole("button", { name: "Words beginning with A" }));
  fireEvent.click(screen.getByRole("button", { name: /advanced 2/i }));
  expect(displayedWords()).toEqual(["accommodation"]);
  fireEvent.click(screen.getByRole("button", { name: /My words 1/ }));
  expect(screen.getByText("No words found.")).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
  expect(displayedWords()).toEqual(["absence", "accommodation", "rhythm", "zephyr"]);
});

test("sorts words and paginates without rendering the full library", () => {
  useWords.mockReturnValue({ words: Array.from({ length: 52 }, (_, index) => ({ id: String(index), word: `word${String(index).padStart(2, "0")}`, isGlobal: true })), loading: false, refreshWords });
  setup();
  expect(displayedWords()).toHaveLength(24);
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  expect(displayedWords()[0]).toBe("word24");
  fireEvent.change(screen.getByRole("combobox", { name: "Sort words" }), { target: { value: "za" } });
  expect(displayedWords()[0]).toBe("word51");
  expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
});

test("pronounces words and only offers removal for owned words", () => {
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Listen to rhythm" }));
  expect(say).toHaveBeenCalledWith("rhythm");
  expect(screen.queryByRole("button", { name: "Remove absence" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Remove zephyr" })).toBeInTheDocument();
});

test("guests cannot remove shared words and can open sign-in", () => {
  useAuth.mockReturnValue({ user: null, isAuthenticated: false });
  setup();
  expect(screen.queryByRole("button", { name: /Remove / })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Add a word" }));
  expect(login).toHaveBeenCalledTimes(1);
  expect(addWord).not.toHaveBeenCalled();
});

test("validates duplicates and adds a word with the selected difficulty", async () => {
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Add a word" }));
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByLabelText("Word or phrase")).toHaveFocus();
  fireEvent.change(within(dialog).getByLabelText("Word or phrase"), { target: { value: " ABSENCE " } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Add word" }));
  expect(within(dialog).getByRole("alert")).toHaveTextContent("already in your library");
  expect(addWord).not.toHaveBeenCalled();
  fireEvent.change(within(dialog).getByLabelText("Word or phrase"), { target: { value: " Serendipity " } });
  fireEvent.change(within(dialog).getByLabelText("Difficulty"), { target: { value: "advanced" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Add word" }));
  await waitFor(() => expect(addWord).toHaveBeenCalledWith({ word: "serendipity", difficulty: "advanced", category: "custom" }, "reader", "reader@example.com"));
  expect(refreshWords).toHaveBeenCalledTimes(1);
});

test("removal needs confirmation and can be cancelled", async () => {
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Remove zephyr" }));
  expect(screen.getByRole("button", { name: "Keep word" })).toHaveFocus();
  expect(deleteWord).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Keep word" }));
  expect(deleteWord).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Remove zephyr" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove word", exact: true }));
  await waitFor(() => expect(deleteWord).toHaveBeenCalledWith("4"));
});

test("displays load errors with a retry action", () => {
  useWords.mockReturnValue({ words: [], loading: false, error: "offline", refreshWords });
  setup();
  expect(screen.getByRole("alert")).toHaveTextContent("couldn’t load");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(refreshWords).toHaveBeenCalledTimes(1);
});

test("finds standard variants and filters context-only phrases", () => {
  useWords.mockReturnValue({ words: [
    { id: "neighbor", word: "neighbor", acceptedSpellings: ["neighbor", "neighbour"], difficulty: "beginner", practiceType: "spelling", isGlobal: true },
    { id: "phrase", word: "all ready", difficulty: "beginner", practiceType: "phrase", requiresContext: true, isGlobal: true },
    { id: "holiday", word: "christmas", displayWord: "Christmas", difficulty: "intermediate", practiceType: "proper-noun", isGlobal: true },
  ], loading: false, refreshWords });
  setup();
  expect(screen.getByRole("heading", { name: "Christmas" })).toBeInTheDocument();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "neighbour" } });
  expect(displayedWords()).toEqual(["neighbor"]);
  fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
  fireEvent.change(screen.getByLabelText("Word type"), { target: { value: "phrase" } });
  expect(displayedWords()).toEqual(["all ready"]);
  expect(screen.getByText("Context needed")).toBeInTheDocument();
});
