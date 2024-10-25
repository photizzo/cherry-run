import MarkdownPreview from "@uiw/react-markdown-preview";
import React, { useState, useEffect } from "react";
import Select from "react-select";
import axios from "axios";

interface ProblemStatementProps {
  onProblemFileSelect: (fileName: string) => void;
}

const ProblemStatement: React.FC<ProblemStatementProps> = ({
  onProblemFileSelect,
}) => {
  const [markdown, setMarkdown] = useState<string>("");
  const [questionOptions, setQuestionOptions] = useState<any[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);

  useEffect(() => {
    const loadQuestionOptions = async () => {
      try {
        const questionFolders = await fetch("/api/questions").then((response) =>
          response.json()
        );
        const options = questionFolders.map((folder: string) => ({
          value: folder,
          label: folder.replace(/-/g, " "),
        }));
        setQuestionOptions(options);
      } catch (error) {
        console.error("Error loading question options:", error);
      }
    };
    loadQuestionOptions();
  }, []);

  useEffect(() => {
    if (selectedQuestion) {
      fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: selectedQuestion.value }),
      })
        .then((response) => response.json())
        .then((data) => {
          setMarkdown(data.content);
          onProblemFileSelect(selectedQuestion.value);
        })
        .catch((error) =>
          console.error("Error loading markdown content:", error)
        );
    }
  }, [selectedQuestion, onProblemFileSelect]);

  const handleChange = (selectedOption: any) => {
    setSelectedQuestion(selectedOption);
  };

  return (
    <div>
      <Select
        value={selectedQuestion}
        onChange={handleChange}
        options={questionOptions}
        isSearchable
        placeholder="Select a question"
      />
      {markdown && (
        <MarkdownPreview
          source={markdown}
          style={{ padding: 16, overflowX: 'auto', maxWidth: '100%', wordWrap: 'break-word', whiteSpace: 'normal' }}
          rehypeRewrite={(node, index, parent) => {
            if (
              node.type === 'element' &&
              node.tagName === "a" &&
              parent &&
              parent.type === 'element' &&
              /^h(1|2|3|4|5|6)/.test(parent.tagName)
            ) {
              parent.children = parent.children.slice(1);
            }
          }}
        />
      )}
    </div>
  );
};

export default ProblemStatement;