"use client";

import { useState, useMemo } from "react";
import { submitTestAnswer } from "@/app/actions/tests";
import type { QuestionWithRelations } from "@/types/practice";
import { QuestionText } from "./QuestionText";

interface TestQuestionProps {
  question: QuestionWithRelations & {
    studyArea: { id: number; name: string };
  };
  testId: number;
  questionIndex: number;
  totalQuestions: number;
}

interface McqOption {
  id: number;
  text: string | null;
  imageUrl: string | null;
}

export function TestQuestion({
  question,
  testId,
  questionIndex,
  totalQuestions,
}: TestQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convert inline MCQ options to array
  const mcqOptions: McqOption[] = useMemo(() => {
    if (question.type === "DDI") {
      return [];
    }

    const options: McqOption[] = [];

    // Option 1
    if (question.mcqOption1Text || question.mcqOption1S3Url) {
      options.push({
        id: 1,
        text: question.mcqOption1Text,
        imageUrl: question.mcqOption1S3Url,
      });
    }

    // Option 2
    if (question.mcqOption2Text || question.mcqOption2S3Url) {
      options.push({
        id: 2,
        text: question.mcqOption2Text,
        imageUrl: question.mcqOption2S3Url,
      });
    }

    // Option 3
    if (question.mcqOption3Text || question.mcqOption3S3Url) {
      options.push({
        id: 3,
        text: question.mcqOption3Text,
        imageUrl: question.mcqOption3S3Url,
      });
    }

    // Option 4
    if (question.mcqOption4Text || question.mcqOption4S3Url) {
      options.push({
        id: 4,
        text: question.mcqOption4Text,
        imageUrl: question.mcqOption4S3Url,
      });
    }

    // Option 5
    if (question.mcqOption5Text || question.mcqOption5S3Url) {
      options.push({
        id: 5,
        text: question.mcqOption5Text,
        imageUrl: question.mcqOption5S3Url,
      });
    }

    return options;
  }, [question]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedOption === null) {
      alert("Please select an answer");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("testId", testId.toString());
      formData.append("selectedAnswer", selectedOption.toString());

      await submitTestAnswer(formData);
    } catch (error) {
      console.error("Error submitting answer:", error);
      alert("Failed to submit answer. Please try again.");
      setIsSubmitting(false);
    }
  };

  // For DDI questions, we need different UI (not implemented yet)
  if (question.type === "DDI") {
    return (
      <div role="alert">
        <p>
          Drag-and-drop questions are not yet supported in the new interface.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = `/tests/${testId}?q=${questionIndex + 1}`;
          }}
        >
          <button type="submit">Skip Question</button>
        </form>
      </div>
    );
  }

  // For GMCQ with no options (images not yet migrated to S3)
  if (question.type === "GMCQ" && mcqOptions.length === 0) {
    return (
      <div role="alert">
        <p>
          This graphical question requires images that haven't been migrated to S3 yet.
        </p>
        <p><small>Question ID: {question.id}</small></p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = `/tests/${testId}?q=${questionIndex + 1}`;
          }}
        >
          <button type="submit">Skip Question</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <section>
        <h2>Question {questionIndex + 1} of {totalQuestions}</h2>

        {/* Question text */}
        {question.questionText && (
          <div style={{ marginBottom: "1rem" }}>
            <QuestionText text={question.questionText} />
          </div>
        )}

        {/* Custom image */}
        {question.customImgS3Url && (
          <div style={{ marginBottom: "1rem", textAlign: "center" }}>
            <img
              src={question.customImgS3Url}
              alt={question.customImgTitle || "Question image"}
              style={{ maxWidth: "100%", height: "auto" }}
            />
          </div>
        )}

        {/* Extract audio */}
        {question.extract?.audioS3Url && (
          <div style={{ marginBottom: "1rem" }}>
            <strong>
              {question.extract.title && `${question.extract.title} `}
              {question.extract.composer && `by ${question.extract.composer}`}
            </strong>
            <audio controls style={{ width: "100%", marginTop: "0.5rem" }}>
              <source src={question.extract.audioS3Url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <fieldset>
            <legend>Select your answer:</legend>

            {mcqOptions.map((option) => (
              <label key={option.id}>
                <input
                  type="radio"
                  name="answer"
                  value={option.id}
                  checked={selectedOption === option.id}
                  onChange={() => setSelectedOption(option.id)}
                  disabled={isSubmitting}
                />
                {option.text && <span>{option.text}</span>}
                {option.imageUrl && (
                  <img
                    src={option.imageUrl}
                    alt={`Option ${option.id}`}
                    style={{
                      maxWidth: "200px",
                      height: "auto",
                      display: "block",
                      marginTop: "0.5rem",
                    }}
                  />
                )}
              </label>
            ))}
          </fieldset>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button type="submit" disabled={isSubmitting || selectedOption === null}>
              {isSubmitting
                ? "Submitting..."
                : questionIndex === totalQuestions - 1
                  ? "Submit & Finish Test"
                  : "Submit Answer"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
