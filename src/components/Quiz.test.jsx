import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Quiz from "./Quiz";
import { useWords } from "../hooks/useWords";
import { useAuth } from "../contexts/AuthContext";
import say from "../helper-functions/say";

jest.mock("../hooks/useWords", () => ({ useWords: jest.fn() }));
jest.mock("../contexts/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("../helper-functions/array_shuffle", () => ({ __esModule: true, default: (words) => words }));
jest.mock("../helper-functions/say", () => ({ __esModule: true, default: jest.fn(), stopSpeaking: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ user: null });
  useWords.mockReturnValue({ words: ["neighbor", "neighbour", "bare", "bear", "all ready", "could of", "money", "bourgeois"].map((word) => ({ word, id: word, isGlobal: true })), loading: false });
});

test("scores a standard variant consistently in the summary and result row using actual question count", () => {
  render(<Quiz />);
  fireEvent.click(screen.getByRole("button", { name: "Start Quiz Now" }));
  expect(screen.getByText("Question 1 of 1")).toBeInTheDocument();
  expect(say).toHaveBeenCalledWith("neighbor");
  fireEvent.change(screen.getByRole("textbox", { name: "Your spelling" }), { target: { value: "neighbour" } });
  fireEvent.click(screen.getByRole("button", { name: /Finish Quiz/ }));
  expect(screen.getByText("100%")).toBeInTheDocument();
  expect(screen.getByText("1 out of 1 correct")).toBeInTheDocument();
  expect(screen.getByText("Correct", { selector: "span" })).toBeInTheDocument();
});

test("warm-up mode is separate and spelling mistakes still fail", () => {
  render(<Quiz />);
  fireEvent.change(screen.getByLabelText("Practice set"), { target: { value: "warmup" } });
  fireEvent.click(screen.getByRole("button", { name: "Start Quiz Now" }));
  expect(say).toHaveBeenCalledWith("money");
  fireEvent.change(screen.getByRole("textbox", { name: "Your spelling" }), { target: { value: "muney" } });
  fireEvent.click(screen.getByRole("button", { name: /Finish Quiz/ }));
  expect(screen.getByText("0%")).toBeInTheDocument();
  expect(screen.getByText("0 out of 1 correct")).toBeInTheDocument();
});

test("disables a quiz when every available word needs context", () => {
  useWords.mockReturnValue({ words: [{ word: "bear" }, { word: "all together" }], loading: false });
  render(<Quiz />);
  expect(screen.getByRole("button", { name: "Start Quiz Now" })).toBeDisabled();
});
