"use client";

import { useState } from "react";
import Link from "next/link";
import { removeStudent } from "@/app/actions/students";

interface StudentTableRowProps {
  student: {
    id: number;
    name: string;
    displayname: string;
    email: string;
    _count: {
      tests: number;
      userQuestions: number;
    };
  };
}

export function StudentTableRow({ student }: StudentTableRowProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDialogOpen(true);
  };

  const handleConfirmRemove = async () => {
    setIsRemoving(true);
    const formData = new FormData();
    formData.append("studentId", student.id.toString());
    await removeStudent(formData);
  };

  const handleCloseDialog = () => {
    if (!isRemoving) {
      setIsDialogOpen(false);
    }
  };

  return (
    <>
      <tr>
        <td>{student.name}</td>
        <td>
          <code>{student.displayname}</code>
        </td>
        <td>
          <small>{student.email}</small>
        </td>
        <td>{student._count.tests}</td>
        <td>{student._count.userQuestions}</td>
        <td>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link
              href={`/students/${student.id}`}
              role="button"
              className="outline"
              style={{
                padding: "0.25rem 0.5rem",
                fontSize: "0.875rem",
              }}
            >
              View
            </Link>
            <button
              type="button"
              className="secondary"
              onClick={handleRemoveClick}
              disabled={isRemoving}
              style={{
                padding: "0.25rem 0.5rem",
                fontSize: "0.875rem",
              }}
            >
              Remove
            </button>
          </div>
        </td>
      </tr>

      {isDialogOpen && (
        <dialog open>
          <article>
            <header>
              <button
                aria-label="Close"
                rel="prev"
                onClick={handleCloseDialog}
                disabled={isRemoving}
              ></button>
              <h3>Remove Student</h3>
            </header>
            <p>
              Remove <strong>{student.name}</strong>? They will lose access to your
              organization.
            </p>
            <footer>
              <button
                className="secondary"
                onClick={handleCloseDialog}
                disabled={isRemoving}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                disabled={isRemoving}
                className="secondary"
              >
                {isRemoving ? "Removing..." : "Remove Student"}
              </button>
            </footer>
          </article>
        </dialog>
      )}
    </>
  );
}
