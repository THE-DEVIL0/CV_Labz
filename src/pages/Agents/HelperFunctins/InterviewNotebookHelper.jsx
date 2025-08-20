import React, { useMemo } from "react";

export default function InterviewNotebookHelper({ generatedNotes }) {
  // Split the text into sections
  const sections = useMemo(() => {
    const regex = /^([A-Za-z &]+):\s*([\s\S]*?)(?=\n[A-Za-z &]+:|$)/gm;
    let match;
    const result = {};
    while ((match = regex.exec(generatedNotes)) !== null) {
      result[match[1].trim()] = match[2].trim();
    }
    return result;
  }, [generatedNotes]);

  const getQuestions = (text) =>
    text
      ?.split("\n")
      .map((q) => q.trim())
      .filter((q) => q);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Object.entries(sections).map(([title, content]) => {
        const isQuestionSection = title.toLowerCase().includes("question");
        const isStarSection = title.toLowerCase().includes("star answer");

        return (
          <div
            key={title}
            className={`bg-white p-6 rounded-xl shadow ${
              isQuestionSection || isStarSection ? "md:col-span-2" : ""
            }`}
          >
            <h2 className="text-2xl font-bold text-indigo-600 mb-4">{title}</h2>

            {isQuestionSection ? (
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {getQuestions(content)?.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            ) : isStarSection ? (
              content.split(/\n\n+/).map((block, i) => (
                <div key={i} className="mb-6">
                  {block.split("\n").map((line, j) => {
                    const [key, value] = line.split(":");
                    return (
                      <p key={j} className="text-gray-700">
                        <strong>{key}:</strong> {value}
                      </p>
                    );
                  })}
                </div>
              ))
            ) : (
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {content}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
