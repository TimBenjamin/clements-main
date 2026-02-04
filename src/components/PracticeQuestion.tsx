"use client";

import { useState, useMemo } from "react";
import { submitAnswer } from "@/app/actions/practice";
import type { UserQuestion } from "@prisma/client";
import type { QuestionWithRelations } from "@/types/practice";

type QuestionWithDdiOptions = QuestionWithRelations;

interface PracticeQuestionProps {
  question: QuestionWithDdiOptions;
  userAnswer: UserQuestion | null;
  studyAreaId: number;
  studyAreaName: string;
}

interface McqOption {
  id: number;
  text: string | null;
  imageUrl: string | null;
  correct: boolean;
}

export function PracticeQuestion({
  question,
  userAnswer,
  studyAreaId,
  studyAreaName,
}: PracticeQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(!!userAnswer);
  const [isCorrect, setIsCorrect] = useState(userAnswer?.correct || false);

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
        correct: question.mcqCorrectAnswer === 1,
      });
    }

    // Option 2
    if (question.mcqOption2Text || question.mcqOption2S3Url) {
      options.push({
        id: 2,
        text: question.mcqOption2Text,
        imageUrl: question.mcqOption2S3Url,
        correct: question.mcqCorrectAnswer === 2,
      });
    }

    // Option 3
    if (question.mcqOption3Text || question.mcqOption3S3Url) {
      options.push({
        id: 3,
        text: question.mcqOption3Text,
        imageUrl: question.mcqOption3S3Url,
        correct: question.mcqCorrectAnswer === 3,
      });
    }

    // Option 4
    if (question.mcqOption4Text || question.mcqOption4S3Url) {
      options.push({
        id: 4,
        text: question.mcqOption4Text,
        imageUrl: question.mcqOption4S3Url,
        correct: question.mcqCorrectAnswer === 4,
      });
    }

    // Option 5
    if (question.mcqOption5Text || question.mcqOption5S3Url) {
      options.push({
        id: 5,
        text: question.mcqOption5Text,
        imageUrl: question.mcqOption5S3Url,
        correct: question.mcqCorrectAnswer === 5,
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
      formData.append("questionId", question.id.toString());
      formData.append("selectedAnswer", selectedOption.toString());

      await submitAnswer(formData);

      // Check if answer is correct
      const correct = selectedOption === question.mcqCorrectAnswer;

      setIsCorrect(correct);
      setShowFeedback(true);
    } catch (error) {
      console.error("Error submitting answer:", error);
      alert("Failed to submit answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    // Reload to get a new question
    window.location.href = `/practice/topic/${studyAreaId}`;
  };

  // For DDI questions, we need different UI (not implemented yet)
  if (question.type === "DDI") {
    return (
      <div role="alert">
        <p>
          Drag-and-drop questions are not yet supported in the new interface.
        </p>
        <button onClick={handleNextQuestion}>Skip to Next Question</button>
      </div>
    );
  }

  return (
    <div>
      <section>
        <h2>Question</h2>

        {/* Question text */}
        {question.questionText && (
          <div style={{ marginBottom: "1rem" }}>
            <p style={{ fontSize: "1.1rem", fontWeight: 500 }}>
              {question.questionText}
            </p>
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

        {!showFeedback ? (
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

            <button
              type="submit"
              disabled={isSubmitting || selectedOption === null}
            >
              {isSubmitting ? "Submitting..." : "Submit Answer"}
            </button>
          </form>
        ) : (
          <div>
            <div
              role="alert"
              style={{
                backgroundColor: isCorrect
                  ? "var(--ins-color)"
                  : "var(--del-color)",
              }}
            >
              <strong>{isCorrect ? "Correct!" : "Incorrect"}</strong>
              {!isCorrect && (
                <p>
                  The correct answer is:{" "}
                  {mcqOptions.find((opt) => opt.correct)?.text ||
                    `Option ${question.mcqCorrectAnswer}`}
                </p>
              )}
            </div>

            {question.studyNotes && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  backgroundColor: "var(--card-background-color)",
                  borderRadius: "var(--border-radius)",
                }}
              >
                <h3>Study Notes</h3>
                <p>{question.studyNotes}</p>
              </div>
            )}

            <button onClick={handleNextQuestion} style={{ marginTop: "1rem" }}>
              Next Question
            </button>
          </div>
        )}
      </section>

      {/* Progress indicator */}
      <section>
        <details>
          <summary>Question Details</summary>
          <dl>
            <dt>Type</dt>
            <dd>{question.type}</dd>

            <dt>Topic</dt>
            <dd>{studyAreaName}</dd>

            <dt>Difficulty</dt>
            <dd>{question.difficulty} / 5</dd>

            {userAnswer && (
              <>
                <dt>Your Previous Attempts</dt>
                <dd>
                  {userAnswer.correct ? "Answered correctly" : "Needs review"}
                </dd>
              </>
            )}
          </dl>
        </details>
      </section>
    </div>
  );
}
