import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("https://trivia-oepz.onrender.com");

const Button = ({ children, className = "", ...props }) => (
  <button
    className={`bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-8 text-2xl font-semibold rounded-2xl shadow-md transition duration-300 ease-in-out disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Card = ({ children }) => (
  <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-gray-200 flex flex-col items-center text-center w-full max-w-2xl mx-auto">{children}</div>
);

const CardContent = ({ children }) => <div className="w-full">{children}</div>;

export default function TriviaGame() {
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [scores, setScores] = useState({});
  const [answers, setAnswers] = useState({});
  const [showCorrect, setShowCorrect] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [questionTimer, setQuestionTimer] = useState(15);
  const [name, setName] = useState("");
  const [submittedName, setSubmittedName] = useState(false);
  const [newQuestionTrigger, setNewQuestionTrigger] = useState(0);

  const isAnswerCorrectRef = useRef(null);
  const clickSound = useRef(new Audio("/sounds/click.mp3"));
  const correctSound = useRef(new Audio("/sounds/correct.mp3"));
  const wrongSound = useRef(new Audio("/sounds/wrong.mp3"));
  const timerRef = useRef(null);

  const startQuestionTimer = () => {
    clearInterval(timerRef.current);
    setQuestionTimer(15);
    timerRef.current = setInterval(() => {
      setQuestionTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!selectedAnswer) {
            setSelectedAnswer("Timed out");
            socket.emit("submitAnswer", { answer: null });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startQuestionTimer();
  }, [newQuestionTrigger]);

  useEffect(() => {
    socket.on("connect", () => console.log("✅ Connected"));
    socket.on("players", setPlayers);
    socket.on("scores", setScores);

    socket.on("newQuestion", (newQ) => {
      setQuestion(newQ);
      setSelectedAnswer(null);
      isAnswerCorrectRef.current = null;
      setAnswers({});
      setShowCorrect(false);
      setCountdown(null);
      setNewQuestionTrigger((prev) => prev + 1);
    });

    socket.on("answerSubmitted", (data) => {
      setAnswers((prev) => ({ ...prev, [data.player]: data.answer }));
    });

    socket.on("showCorrectAnswer", () => {
      setShowCorrect(true);
      clearInterval(timerRef.current);
      if (selectedAnswer && selectedAnswer !== "Timed out") {
        if (isAnswerCorrectRef.current) correctSound.current.play();
        else wrongSound.current.play();
      }
    });

    socket.on("countdown", setCountdown);

    return () => {
      socket.off("connect");
      socket.off("players");
      socket.off("scores");
      socket.off("newQuestion");
      socket.off("answerSubmitted");
      socket.off("showCorrectAnswer");
      socket.off("countdown");
      clearInterval(timerRef.current);
    };
  }, [selectedAnswer]);

  useEffect(() => {
    if (submittedName) {
      socket.emit("join", name);
      setTimeout(() => socket.emit("getQuestion"), 100);
    }
  }, [submittedName, name]);

  const submitAnswer = (option) => {
    if (!selectedAnswer) {
      clickSound.current.play();
      setSelectedAnswer(option);
      isAnswerCorrectRef.current = option === question.answer;
      socket.emit("submitAnswer", { answer: option });
      clearInterval(timerRef.current);
    }
  };

  const progressPercentage = (questionTimer / 15) * 100;

  if (!submittedName) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="p-4 max-w-xl w-full text-center">
          <h1 className="text-3xl font-extrabold mb-4 text-blue-700">Enter Your Name</h1>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-blue-300 px-4 py-3 rounded-xl mb-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={() => name && setSubmittedName(true)}>Start Game</Button>
        </div>
      </div>
    );
  }

  if (!question) return <div className="text-center mt-10 text-lg">Loading question...</div>;

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-center px-4">
      <h1 className="text-4xl font-extrabold mb-6 text-indigo-700">Multiplayer Trivia Game</h1>
      <Card>
        <CardContent>
          <p className="text-2xl font-semibold mb-4 text-gray-800">{question.question}</p>
          <p className="text-base text-gray-500 mb-2">⏳ Time left: {questionTimer}s</p>
          <div className="w-full h-4 bg-gray-300 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-indigo-500 transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-center">
            {question.options.map((option) => {
              const highlight = showCorrect && option === question.answer ? "bg-green-600" : "";
              return (
                <Button
                  key={option}
                  onClick={() => submitAnswer(option)}
                  disabled={!!selectedAnswer}
                  className={highlight}
                >
                  {option}
                </Button>
              );
            })}
          </div>
          {showCorrect && (
            <p className="mt-8 text-green-700 font-bold text-xl">
              ✅ Correct Answer: {question.answer}
            </p>
          )}
          {countdown !== null && (
            <p className="mt-4 text-base text-indigo-600">
              Next question in {countdown}...
            </p>
          )}
        </CardContent>
      </Card>
      <div className="mb-6 w-full max-w-2xl">
        <h2 className="font-bold text-2xl text-blue-800 mb-2">Players</h2>
        <ul className="space-y-2">
          {players.map((player) => (
            <li key={player.id} className="text-lg text-gray-700">
              {player.name} - {scores[player.id] || 0} points
              {answers[player.id] && ` (answered)`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
