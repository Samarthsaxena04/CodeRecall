import { useEffect, useState } from "react";
import API from "../api";

function History() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await API.get("/questions/all");
      setQuestions(res.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center p-6">
        <div className="text-xl text-gray-600 dark:text-gray-400">Loading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-red-400 text-sm">* {error}</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-12 text-center transition-colors duration-300">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 ">
            No Questions Yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Start by adding your first question!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Question History</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {questions.length} total question{questions.length !== 1 ? "s" : ""} tracked
        </p>
      </div>

      <div className="grid gap-6">
        {questions.map((q) => (
          <div
            key={q.id}
            className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 hover:shadow-xl transition border border-gray-100 dark:border-gray-700"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex-1">
                {q.title}
              </h3>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium ml-4">
                {q.platform}
              </span>
            </div>

            <a
              href={q.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium mb-3"
            >
              <span>View Question</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            {q.notes && (
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mt-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Notes:</span> {q.notes}
                </p>
              </div>
            )}

            {q.tags && q.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {q.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {q.created_at && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                Added on {new Date(q.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default History;