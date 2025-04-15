import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("https://trivia-oepz.onrender.com");

const Button = ({ children, className = "", ...props }) => (
  <button
    className={`bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-10 py-6 text-xl font-bold rounded-2xl shadow-lg transition duration-300 ease-in-out disabled:opacity-50 w-full ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Card = ({ children }) => (
  <div className="bg-white rounded-3xl shadow-xl p-10 mb-8 border border-gray-100 flex flex-col items-center text-center w-full max-w-3xl mx-auto">
    {children}
  </div>
);

const CardContent = ({ children }) => <div className="w-full">{children}</div>;

export default function TriviaGame() {
  // ...rest of the component logic stays unchanged

  const progressPercentage = (questionTimer / 15) * 100;

  if (!submittedName) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-tr from-indigo-100 via-purple-100 to-indigo-100">
        <div className="p-6 max-w-xl w-full text-center bg-white rounded-2xl shadow-xl">
          <h1 className="text-3xl font-extrabold mb-6 text-purple-700">Enter Your Name</h1>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-purple-300 px-4 py-3 rounded-xl mb-4 w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Button onClick={() => name && setSubmittedName(true)}>Start Game</Button>
        </div>
      </div>
    );
  }

  if (!question) return <div className="text-center mt-10 text-lg text-purple-700">Loading question...</div>;

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-indigo-100 px-4 text-center">
      <h1 className="text-5xl font-extrabold mb-10 text-purple-700 drop-shadow">🎉 Trivia Challenge</h1>
      <Card>
        <CardContent>
          <p className="text-2xl font-semibold mb-4 text-gray-800">{question.question}</p>
          <p className="text-base text-gray-500 mb-2">⏳ Time left: {questionTimer}s</p>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-purple-500 transition-all duration-1000 ease-linear"
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
            <p className="mt-4 text-base text-purple-600">
              Next question in {countdown}...
            </p>
          )}
        </CardContent>
      </Card>
      <div className="mb-6 w-full max-w-2xl">
        <h2 className="font-bold text-2xl text-purple-800 mb-4">Players</h2>
        <ul className="space-y-2">
          {players.map((player) => (
            <li key={player.id} className="text-lg text-gray-800">
              {player.name} - {scores[player.id] || 0} points
              {answers[player.id] && ` (answered)`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
