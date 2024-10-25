"use client";
import React, { useState } from "react";
import ProblemStatement from "./ProblemStatement";
import QuestionFlow from "./QuestionFlow";

const SplitLayout = () => {
  const [selectedProblemFile, setSelectedProblemFile] = useState("");

  const handleProblemFileSelect = (fileName: string) => {
    setSelectedProblemFile(fileName);
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/2 overflow-auto p-4">
      <ProblemStatement onProblemFileSelect={handleProblemFileSelect} />
      </div>
      <div className="w-1/2 overflow-auto p-4 border-l border-gray-300">
        {selectedProblemFile ? (
          <QuestionFlow problemFile={selectedProblemFile} />
        ) : (
          <div>Select a problem statement to start the quiz</div>
        )}
      </div>
    </div>
  );
};

export default SplitLayout;