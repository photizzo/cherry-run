"use client";
import { useState } from "react";
import { CodeBlock, dracula } from "react-code-blocks";

interface Question {
  question: string;
  options: Option[];
  multiSelect?: boolean;
}

interface QuizInterfaceProps {
  questions: Question[];
  onAnswer: (isCorrect: boolean) => void;
}

interface Option {
  option: string;
  isCorrect: boolean;
}

interface SelectedOptions {
  [key: number]: boolean;
}

export default function QuizInterface({ questions, onAnswer }: QuizInterfaceProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});

  const handleOptionClick = (index: number) => {
    const question = questions[currentQuestion];
    if (question?.multiSelect) {
      setSelectedOptions(prev => ({
        ...prev,
        [index]: !prev[index]
      }));
    } else {
      setSelectedOptions({ [index]: true });
      // Check if the answer is correct and call onAnswer
      const isCorrect = question?.options[index]?.isCorrect ?? false;
      onAnswer(isCorrect);
    }
  };

  const renderOptions = (options: Option[] = []) => {
    return options.map((option, index) => (
      <li key={index} className="mb-2 w-full">
        <button
          className={`border p-2 w-full text-left overflow-hidden ${
            selectedOptions[index]
              ? "bg-blue-500 text-white"
              : "bg-white text-black"
          }`}
          onClick={() => handleOptionClick(index)}
        >
          <CodeBlock
            text={option.option}
            language="java"
            showLineNumbers={false}
            theme={dracula}
          />
        </button>
      </li>
    ));
  };

  if (!questions || questions.length === 0 || currentQuestion >= questions.length) {
    return <div>No questions available. Please try again later.</div>;
  }

  const currentQuestionData = questions[currentQuestion];

  return (
    <div>
      <h1 className="text-xl font-bold mb-4"></h1>
      <div>
        <CodeBlock
          text={currentQuestionData?.question ?? "Question not available"}
          language="java"
          showLineNumbers={false}
          theme={dracula}
        />
        <ul className="my-4 w-full">
          {renderOptions(currentQuestionData?.options)}
        </ul>
      </div>
    </div>
  );
}