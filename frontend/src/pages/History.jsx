import { useEffect, useMemo, useState } from "react";
import API from "../api";
import { ChevronDown } from "lucide-react";

function History() {
  const [questions, setQuestions] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [masteryLevel, setMasteryLevel] = useState("all");
  const [tag, setTag] = useState("all");
  const [sort, setSort] = useState("last_reviewed_desc");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedNotes, setExpandedNotes] = useState({});

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchQuestions();
    }, 250);

    return () => clearTimeout(timeout);
  }, [search, masteryLevel, tag, sort, page]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);

      const res = await API.get("/questions/history", {
        params: {
          search,
          mastery_level: masteryLevel,
          tag,
          sort,
          page,
          page_size: pageSize,
        },
      });

      setQuestions(res.data.items || []);
      setAvailableTags(res.data.available_tags || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
      setPage(res.data.page || 1);
      setExpandedNotes({});
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  };

  const pageNumbers = useMemo(() => {
    const pages = [];
    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages, page + 1);
    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }
    return pages;
  }, [page, totalPages]);

  const getMasteryBarColor = (value) => {
    if (value >= 80) return "bg-green-500";
    if (value >= 40) return "bg-yellow-400";
    return "bg-orange-500";
  };

  const formatLastReviewed = (value, fallback) => {
    if (!value && !fallback) return "-";
    const dt = value || fallback;
    return new Date(dt).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto text-center p-6">
        <div className="text-xl text-gray-600 dark:text-gray-400">Loading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p className="text-red-400 text-sm">* {error}</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-12 text-center transition-colors duration-300 border border-gray-100 dark:border-gray-700">
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Question History &amp; Library</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {total} total question{total !== 1 ? "s" : ""} tracked
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search questions..."
              className="w-full rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="relative">
              <select
                value={masteryLevel}
                onChange={(e) => {
                  setPage(1);
                  setMasteryLevel(e.target.value);
                }}
                className="w-full rounded-lg px-3 py-2 pr-10 appearance-none bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Mastery Level</option>
                <option value="high">High (80-100%)</option>
                <option value="medium">Medium (40-79%)</option>
                <option value="low">Low (0-39%)</option>
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
              />
            </div>

            <div className="relative">
              <select
                value={tag}
                onChange={(e) => {
                  setPage(1);
                  setTag(e.target.value);
                }}
                className="w-full rounded-lg px-3 py-2 pr-10 appearance-none bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tag</option>
                {availableTags.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
              />
            </div>

            <div className="relative">
              <select
                value={sort}
                onChange={(e) => {
                  setPage(1);
                  setSort(e.target.value);
                }}
                className="w-full rounded-lg px-3 py-2 pr-10 appearance-none bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="last_reviewed_desc">Sort: Last Reviewed (Newest)</option>
                <option value="last_reviewed_asc">Sort: Last Reviewed (Oldest)</option>
                <option value="mastery_desc">Sort: Mastery (High to Low)</option>
                <option value="mastery_asc">Sort: Mastery (Low to High)</option>
                <option value="created_desc">Sort: Created (Newest)</option>
                <option value="created_asc">Sort: Created (Oldest)</option>
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden md:overflow-x-auto dark-scrollbar">
          <table className="w-full text-sm block md:table">
            <thead className="bg-gray-50 dark:bg-gray-900/60 hidden md:table-header-group border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Title &amp; Preview</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 w-56">Mastery</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 w-48">Last Reviewed</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Tags</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group">
              {questions.map((q) => (
                <tr key={q.id} className="block md:table-row border-b md:border-b-0 border-gray-100 dark:border-gray-700/70 md:border-t p-4 md:p-0">
                  <td className="block md:table-cell px-1 py-1.5 md:px-4 md:py-4 align-top">
                    <a
                      href={q.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-base md:text-sm text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {q.title}
                    </a>

                    {q.notes ? (
                      <div className="mt-1">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedNotes((prev) => ({
                              ...prev,
                              [q.id]: !prev[q.id],
                            }))
                          }
                          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          {expandedNotes[q.id] ? "Hide notes" : "Notes"}
                        </button>

                        {expandedNotes[q.id] ? (
                          <div className="mt-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/70 max-w-xl max-h-40 overflow-auto">
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                              {q.notes}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </td>
                  <td className="block md:table-cell px-1 py-1.5 md:px-4 md:py-4 align-top">
                    <div className="flex items-center gap-3">
                      <span className="md:hidden text-xs font-semibold text-gray-500 dark:text-gray-400 w-24">Mastery:</span>
                      <div className="w-28 flex-1 md:flex-none h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${getMasteryBarColor(q.mastery_percent)}`}
                          style={{ width: `${Math.max(0, Math.min(100, q.mastery_percent || 0))}%` }}
                        />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {q.mastery_percent || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="block md:table-cell px-1 py-1.5 md:px-4 md:py-4 align-top text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-3">
                      <span className="md:hidden text-xs font-semibold text-gray-500 dark:text-gray-400 w-24">Reviewed:</span>
                      <span>{formatLastReviewed(q.last_reviewed_at, q.created_at)}</span>
                    </div>
                  </td>
                  <td className="block md:table-cell px-1 py-1.5 md:px-4 md:py-4 align-top">
                    <div className="flex items-start gap-3">
                      <span className="md:hidden text-xs font-semibold text-gray-500 dark:text-gray-400 w-24 pt-1">Tags:</span>
                      <div className="flex flex-wrap gap-2 flex-1">
                        {(q.tags || []).slice(0, 4).map((entry) => (
                          <span
                            key={`${q.id}-${entry}`}
                            className="px-2.5 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                          >
                            {entry}
                          </span>
                        ))}
                        {(q.tags || []).length === 0 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 pt-0.5">No tags</span>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 disabled:opacity-40"
          >
            Previous
          </button>

          {pageNumbers.map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setPage(num)}
              className={`px-3 py-1.5 rounded-md border ${
                num === page
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-gray-900 dark:border-white"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
              }`}
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default History;