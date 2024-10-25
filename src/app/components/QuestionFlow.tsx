import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import QuizInterface from "./QuizInterface";

interface QuestionFlowProps {
  problemFile: string;
}

const stages = [
  { name: "Understand", count: 2 },
  { name: "Implement", count: 4 },
  { name: "Review", count: 2 },
  { name: "Evaluate", count: 1 },
];

const QuestionFlow: React.FC<QuestionFlowProps> = ({ problemFile }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<any[][]>([]);
  const [loading, setLoading] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<boolean | null>(null);

  const generateQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const currentStage = stages[currentStageIndex];
      console.log(`Generating questions for stage: ${currentStage.name}`);
      const response = await axios.post("/api/generate-question", {
        problemFile,
        stage: currentStage.name,
        count: currentStage.count,
      });
      setQuestions(prevQuestions => {
        const newQuestions = [...prevQuestions];
        newQuestions[currentStageIndex] = response.data;
        return newQuestions;
      });
      setTotalQuestions(prev => prev + currentStage.count);
    } catch (error) {
      console.error("Error generating questions:", error);
    }
    setLoading(false);
  }, [problemFile, currentStageIndex]);

  const resetQuiz = useCallback(() => {
    setCurrentStageIndex(0);
    setCurrentQuestionIndex(0);
    setQuestions([]);
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setTotalQuestions(0);
    setQuizCompleted(false);
    setCurrentAnswer(null);
  }, []);

  useEffect(() => {
    resetQuiz();
    generateQuestions();
  }, [problemFile]);

  useEffect(() => {
    if (questions[currentStageIndex] === undefined) {
      generateQuestions();
    }
  }, [currentStageIndex, questions, generateQuestions]);

  const handleAnswer = (isCorrect: boolean) => {
    setCurrentAnswer(isCorrect);
  };

  const handleNext = () => {
    if (currentAnswer !== null) {
      if (currentAnswer) {
        setCorrectAnswers(prev => prev + 1);
      } else {
        setIncorrectAnswers(prev => prev + 1);
      }
    }

    setCurrentAnswer(null);

    const currentStage = stages[currentStageIndex];
    if (currentQuestionIndex + 1 < currentStage.count) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentStageIndex + 1 < stages.length) {
      setCurrentStageIndex(currentStageIndex + 1);
      setCurrentQuestionIndex(0);
    } else {
      setQuizCompleted(true);
    }
  };

  if (loading || questions.length === 0) {
    return <div>Loading...</div>;
  }

  const currentQuestions = questions[currentStageIndex] || [];

  if (quizCompleted) {
    const totalAnswered = correctAnswers + incorrectAnswers;
    const percentage = (correctAnswers / totalAnswered) * 100;
    let performance;
    if (percentage >= 90) performance = "Excellent";
    else if (percentage >= 70) performance = "Good";
    else if (percentage >= 50) performance = "Fair";
    else performance = "Needs Improvement";

    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Quiz Completed!</h2>
        <p className="text-xl mb-2">Correct Answers: {correctAnswers}</p>
        <p className="text-xl mb-2">Incorrect Answers: {incorrectAnswers}</p>
        <p className="text-xl mb-2">Total Questions Answered: {totalAnswered}</p>
        <p className="text-lg mb-4">Performance: {performance}</p>
        <p className="text-md">You answered {percentage.toFixed(2)}% of the questions correctly.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">
        {stages[currentStageIndex].name} - Question {currentQuestionIndex + 1}
      </h3>
      {currentQuestions.length > 0 && (
        <QuizInterface 
          questions={[currentQuestions[currentQuestionIndex]]} 
          onAnswer={handleAnswer}
        />
      )}
      <div className="flex justify-between items-center mt-4">
        <p className="text-lg">Correct: {correctAnswers} | Incorrect: {incorrectAnswers}</p>
        <button
          onClick={handleNext}
          className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-300 ease-in-out"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default QuestionFlow;