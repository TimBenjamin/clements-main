"use client";

import { useState } from "react";
import { startPracticeTest } from "@/app/actions/practice";

interface StudyArea {
  id: number;
  name: string;
}

interface PracticeSetupFormProps {
  studyAreas: StudyArea[];
}

export function PracticeSetupForm({ studyAreas }: PracticeSetupFormProps) {
  const [selectedTopics, setSelectedTopics] = useState<Set<number>>(
    new Set(studyAreas.map((sa) => sa.id))
  );
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<number>>(
    new Set([1, 2, 3, 4, 5])
  );
  const [numQuestions, setNumQuestions] = useState(10);
  const [timeLimit, setTimeLimit] = useState(false);
  const [repeatPrevious, setRepeatPrevious] = useState<"incorrect" | "all" | "none">("incorrect");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTopic = (id: number) => {
    const newSet = new Set(selectedTopics);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTopics(newSet);
  };

  const toggleDifficulty = (level: number) => {
    const newSet = new Set(selectedDifficulties);
    if (newSet.has(level)) {
      newSet.delete(level);
    } else {
      newSet.add(level);
    }
    setSelectedDifficulties(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedTopics.size === 0) {
      alert("Please select at least one topic");
      return;
    }

    if (selectedDifficulties.size === 0) {
      alert("Please select at least one difficulty level");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("topics", Array.from(selectedTopics).join(","));
      formData.append("difficulties", Array.from(selectedDifficulties).join("|"));
      formData.append("numQuestions", numQuestions.toString());
      formData.append("timeLimit", timeLimit ? "1" : "0");
      formData.append("repeatPrevious", repeatPrevious);

      await startPracticeTest(formData);
    } catch (error) {
      console.error("Error starting practice test:", error);
      alert("Failed to start practice test. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Topics */}
      <fieldset>
        <legend>Include which topics?</legend>
        {studyAreas.map((area) => (
          <label key={area.id}>
            <input
              type="checkbox"
              checked={selectedTopics.has(area.id)}
              onChange={() => toggleTopic(area.id)}
              disabled={isSubmitting}
            />
            {area.name}
          </label>
        ))}
      </fieldset>

      {/* Difficulty levels */}
      <fieldset>
        <legend>Which difficulty levels?</legend>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5].map((level) => (
            <label key={level} style={{ display: "inline-flex", gap: "0.5rem" }}>
              <input
                type="checkbox"
                checked={selectedDifficulties.has(level)}
                onChange={() => toggleDifficulty(level)}
                disabled={isSubmitting}
              />
              {level}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Number of questions */}
      <label>
        How many questions?
        <select
          value={numQuestions}
          onChange={(e) => setNumQuestions(parseInt(e.target.value))}
          disabled={isSubmitting}
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="15">15</option>
          <option value="20">20</option>
          <option value="25">25</option>
        </select>
      </label>

      {/* Time limit */}
      <fieldset>
        <legend>Time limit?</legend>
        <label>
          <input
            type="radio"
            name="timeLimit"
            checked={timeLimit}
            onChange={() => setTimeLimit(true)}
            disabled={isSubmitting}
          />
          Yes
        </label>
        <label>
          <input
            type="radio"
            name="timeLimit"
            checked={!timeLimit}
            onChange={() => setTimeLimit(false)}
            disabled={isSubmitting}
          />
          No
        </label>
        {timeLimit && (
          <small>Be ready - the timer will begin immediately!</small>
        )}
      </fieldset>

      {/* Repeat previously seen questions */}
      <fieldset>
        <legend>Repeat previously seen questions?</legend>
        <label>
          <input
            type="radio"
            name="repeatPrevious"
            checked={repeatPrevious === "incorrect"}
            onChange={() => setRepeatPrevious("incorrect")}
            disabled={isSubmitting}
          />
          Yes - incorrectly answered questions
        </label>
        <label>
          <input
            type="radio"
            name="repeatPrevious"
            checked={repeatPrevious === "all"}
            onChange={() => setRepeatPrevious("all")}
            disabled={isSubmitting}
          />
          Yes - correctly <i>and</i> incorrectly answered questions
        </label>
        <label>
          <input
            type="radio"
            name="repeatPrevious"
            checked={repeatPrevious === "none"}
            onChange={() => setRepeatPrevious("none")}
            disabled={isSubmitting}
          />
          No - unanswered questions only
        </label>
        <small>
          Selecting one of these options applies only to questions you've seen during
          the past 3 months
        </small>
      </fieldset>

      {/* Submit button */}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Starting..." : "Begin!"}
      </button>
    </form>
  );
}
