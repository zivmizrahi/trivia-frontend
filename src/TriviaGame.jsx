import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import Confetti from "react-confetti";

const socket = io("https://trivia-oepz.onrender.com");

const Button = ({ children, className = "", ...props }) => (
  <button
    className={`bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-6 text-xl font-semibold rounded-xl shadow-md transition duration-300 ease-in-out disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Card = ({ children }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">{children}</div>
);

const CardContent = ({ children }) => <div>{children}</div>;

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
  const [showConfetti, setShowConfetti] = useState(false);

  const isAnswerCorrectRef = useRef(null);
  const clickSound = useRef(new Audio("/sounds/click.mp3"));
  const correctSound = useRef(new Audio("/sounds/correct.mp3"));
  const wrongSound = useRef(new Audio("/sounds/wrong.mp3"));
  const timerRef = useRef(null);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Connected to backend");
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Connection error:", err.message);
    });

    socket.on("players", (updatedPlayers) => setPlayers(updatedPlayers));
    socket.on("scores", (updatedScores) => setScores(updatedScores));
    socket.on("newQuestion", (newQ) => {
      setQuestion(newQ);
      setSelectedAnswer(null);
      isAnswerCorrectRef.current = null;
      setAnswers({});
      setShowCorrect(false);
      setCountdown(null);
      setShowConfetti(false);
      setQuestionTimer(15);

      clearInterval(timerRef.current);
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
    });

    socket.on("answerSubmitted", (data) => {
      setAnswers((prev) => ({ ...prev, [data.player]: data.answer }));
    });

    socket.on("showCorrectAnswer", () => {
      setShowCorrect(true);
      clearInterval(timerRef.current);
      if (selectedAnswer !== null && selectedAnswer !== "Timed out") {
        if (isAnswerCorrectRef.current) {
          correctSound.current.play();
          setShowConfetti(true);
        } else {
          wrongSound.current.play();
        }
      }
    });

    socket.on("countdown", (time) => {
      setCountdown(time);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
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
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
      {showConfetti && <Confetti recycle={false} numberOfPieces={300} />}
      <div className="p-6 max-w-2xl w-full text-center">
        <h1 className="text-3xl font-extrabold mb-6 text-indigo-700">Multiplayer Trivia Game</h1>
        <Card>
          <CardContent>
            <p className="text-xl font-semibold mb-2 text-gray-800">{question.question}</p>
            <p className="text-sm text-gray-500 mb-6">⏳ Time left: {questionTimer}s</p>
            <div className="grid grid-cols-2 gap-4">
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
              <p className="mt-6 text-green-700 font-bold text-lg">
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
        <div className="mb-6">
          <h2 className="font-bold text-xl text-blue-800 mb-2">Players</h2>
          <ul className="space-y-1">
            {players.map((player) => (
              <li key={player.id} className="text-gray-700">
                {player.name} - {scores[player.id] || 0} points
                {answers[player.id] && ` (answered)`}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
