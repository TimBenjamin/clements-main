"use client";

import { useState, useMemo } from "react";
import { submitAndNext, moveToPrevious, finishTest, exitTest } from "@/app/actions/practice";
import type { QuestionWithRelations } from "@/types/practice";
import { QuestionText } from "./QuestionText";

interface PracticeTestQuestionProps {
  question: QuestionWithRelations & {
    studyArea: { id: number; name: string };
  };
  questionIndex: number;
  totalQuestions: number;
  existingAnswer: number | null;
}

interface McqOption {
  id: number;
  text: string | null;
  imageUrl: string | null;
}

export function PracticeTestQuestion({
  question,
  questionIndex,
  existingAnswer,
}: PracticeTestQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(existingAnswer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Convert inline MCQ options to array and shuffle them
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

    // Shuffle options (same as old site)
    return options.sort(() => Math.random() - 0.5);
  }, [question]);

  const handleSubmitAndNext = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedOption === null) {
      setValidationError("Please select an answer");
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("questionId", question.id.toString());
    formData.append("selectedAnswer", selectedOption.toString());

    await submitAndNext(formData);
  };

  const handlePrevious = async () => {
    setIsSubmitting(true);
    await moveToPrevious();
  };

  const handleFinish = () => {
    const dialog = document.getElementById("finish-dialog") as HTMLDialogElement;
    dialog?.showModal();
  };

  const handleExit = () => {
    const dialog = document.getElementById("exit-dialog") as HTMLDialogElement;
    dialog?.showModal();
  };

  const confirmFinish = async () => {
    setIsSubmitting(true);
    await finishTest();
  };

  const confirmExit = async () => {
    setIsSubmitting(true);
    await exitTest();
  };

  // For DDI questions, we need different UI (not implemented yet)
  if (question.type === "DDI") {
    return (
      <div role="alert">
        <p>
          Drag-and-drop questions are not yet supported in the new interface.
        </p>
        <form action={submitAndNext}>
          <input type="hidden" name="questionId" value={question.id} />
          <input type="hidden" name="selectedAnswer" value="1" />
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
        <form action={submitAndNext}>
          <input type="hidden" name="questionId" value={question.id} />
          <input type="hidden" name="selectedAnswer" value="1" />
          <button type="submit">Skip Question</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <section>
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

        <form onSubmit={handleSubmitAndNext}>
          {validationError && (
            <p style={{ color: "var(--del-color)", marginBottom: "1rem" }}>
              {validationError}
            </p>
          )}

          <fieldset>
            <legend>Select your answer:</legend>

            {mcqOptions.map((option) => (
              <label key={option.id}>
                <input
                  type="radio"
                  name="answer"
                  value={option.id}
                  checked={selectedOption === option.id}
                  onChange={() => {
                    setSelectedOption(option.id);
                    setValidationError(null);
                  }}
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

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <button type="submit" disabled={isSubmitting || selectedOption === null}>
              {isSubmitting ? "Submitting..." : "Next"}
            </button>

            {questionIndex > 0 && (
              <button
                type="button"
                className="secondary"
                onClick={handlePrevious}
                disabled={isSubmitting}
              >
                Previous
              </button>
            )}

            <button
              type="button"
              className="secondary"
              onClick={handleFinish}
              disabled={isSubmitting}
            >
              Finish
            </button>

            <button
              type="button"
              className="secondary outline"
              onClick={handleExit}
              disabled={isSubmitting}
            >
              Exit
            </button>
          </div>
        </form>
      </section>

      {/* Finish Test Dialog */}
      <dialog id="finish-dialog">
        <article>
          <header>
            <button
              aria-label="Close"
              rel="prev"
              onClick={() => {
                const dialog = document.getElementById("finish-dialog") as HTMLDialogElement;
                dialog?.close();
              }}
            ></button>
            <h3>Finish Test</h3>
          </header>
          <p>Are you sure you want to finish this test and save your answers?</p>
          <footer>
            <button
              className="secondary"
              onClick={() => {
                const dialog = document.getElementById("finish-dialog") as HTMLDialogElement;
                dialog?.close();
              }}
            >
              Cancel
            </button>
            <form action={finishTest} style={{ display: "inline", margin: 0 }}>
              <button type="submit" onClick={confirmFinish} disabled={isSubmitting}>
                {isSubmitting ? "Finishing..." : "Finish Test"}
              </button>
            </form>
          </footer>
        </article>
      </dialog>

      {/* Exit Test Dialog */}
      <dialog id="exit-dialog">
        <article>
          <header>
            <button
              aria-label="Close"
              rel="prev"
              onClick={() => {
                const dialog = document.getElementById("exit-dialog") as HTMLDialogElement;
                dialog?.close();
              }}
            ></button>
            <h3>Exit Without Saving</h3>
          </header>
          <p>Are you sure you want to exit without saving your answers?</p>
          <footer>
            <button
              className="secondary"
              onClick={() => {
                const dialog = document.getElementById("exit-dialog") as HTMLDialogElement;
                dialog?.close();
              }}
            >
              Cancel
            </button>
            <form action={exitTest} style={{ display: "inline", margin: 0 }}>
              <button
                type="submit"
                className="secondary"
                onClick={confirmExit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Exiting..." : "Exit Without Saving"}
              </button>
            </form>
          </footer>
        </article>
      </dialog>
    </div>
  );
}
