import { useState } from "react";
import API from "../api";

const ALLOWED_DOMAINS = [
  { pattern: /^(www\.)?leetcode\.com$/, name: "LeetCode" },
  { pattern: /^(www\.)?codeforces\.com$/, name: "Codeforces" },
  { pattern: /^(www\.)?codechef\.com$/, name: "CodeChef" },
  { pattern: /^(www\.)?hackerrank\.com$/, name: "HackerRank" },
  { pattern: /^(www\.)?hackerearth\.com$/, name: "HackerEarth" },
  { pattern: /^(www\.)?(geeksforgeeks\.org|practice\.geeksforgeeks\.org)$/, name: "GeeksforGeeks" },
  { pattern: /^(www\.)?atcoder\.jp$/, name: "AtCoder" },
  { pattern: /^(www\.)?topcoder\.com$/, name: "TopCoder" },
];

function isValidPlatformLink(url) {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some(d => d.pattern.test(parsed.hostname));
  } catch {
    return false;
  }
}

function AddQuestion() {
  const [formData, setFormData] = useState({
    title: "",
    link: "",
    platform: "LeetCode",
    notes: "",
    tags: "",
    status: "done",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [linkError, setLinkError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "link") {
      if (value && !isValidPlatformLink(value)) {
        setLinkError(
          "Only links from LeetCode, Codeforces, CodeChef, HackerRank, HackerEarth, GeeksforGeeks, AtCoder, or TopCoder are allowed"
        );
      } else {
        setLinkError("");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    if (!formData.title || !formData.link || !formData.platform) {
      setError("Please fill all required fields");
      setLoading(false);
      return;
    }

    if (!isValidPlatformLink(formData.link)) {
      setError(
        "Invalid link. Only links from LeetCode, Codeforces, CodeChef, HackerRank, HackerEarth, GeeksforGeeks, AtCoder, or TopCoder are allowed"
      );
      setLoading(false);
      return;
    }

    try {
      await API.post("/questions", {
        title: formData.title,
        link: formData.link,
        platform: formData.platform,
        notes: formData.notes,
        tags: formData.tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean),
        status: formData.status,
      });

      setSuccess(true);
      setFormData({
        title: "",
        link: "",
        platform: "LeetCode",
        notes: "",
        tags: "",
        status: "done",
      });

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add question");
    } finally {
      setLoading(false);
    }
  };

  const platforms = ["LeetCode", "Codeforces", "CodeChef", "HackerRank", "HackerEarth", "GeeksforGeeks", "AtCoder", "TopCoder"];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-8">
        <h2 className="text-3xl font-bold mb-2 text-white">
          Add New Question
        </h2>
        <p className="text-gray-400 mb-8">Track your coding practice and revisions</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Question Title *
            </label>
            <input
              name="title"
              required
              placeholder="e.g., Two Sum, Binary Search"
              value={formData.title}
              onChange={handleChange}
              className="w-full border border-gray-700 bg-gray-800 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Question Link *
            </label>
            <input
              name="link"
              type="url"
              required
              placeholder="https://leetcode.com/problems/..."
              value={formData.link}
              onChange={handleChange}
              className={`w-full border ${linkError ? 'border-red-500' : 'border-gray-700'} bg-gray-800 text-white p-3 rounded-lg focus:outline-none focus:ring-2 ${linkError ? 'focus:ring-red-500' : 'focus:ring-blue-500'} placeholder-gray-500`}
            />
            {linkError && (
              <p className="text-red-400 text-xs mt-1">{linkError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Platform *
            </label>
            <select
              name="platform"
              value={formData.platform}
              onChange={handleChange}
              className="w-full border border-gray-700 bg-gray-800 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {platforms.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Tags
            </label>
            <input
              name="tags"
              placeholder="array, dp, binary-search (comma separated)"
              value={formData.tags}
              onChange={handleChange}
              className="w-full border border-gray-700 bg-gray-800 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              rows="3"
              placeholder="Key insights, approach, time complexity..."
              value={formData.notes}
              onChange={handleChange}
              className="w-full border border-gray-700 bg-gray-800 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Current Status *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "done", label: "Solved", color: "border-green-600 bg-green-900/20 hover:bg-green-900/30" },
                { value: "help", label: "Needed Help", color: "border-yellow-600 bg-yellow-900/20 hover:bg-yellow-900/30" },
                { value: "fail", label: "Unsolved", color: "border-red-600 bg-red-900/20 hover:bg-red-900/30" },
              ].map(({ value, label, color }) => (
                <label
                  key={value}
                  className={`border-2 p-3 rounded-lg cursor-pointer transition ${
                    formData.status === value
                      ? color
                      : "border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={value}
                    checked={formData.status === value}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-gray-200">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">* {error}</p>
          )}

          {success && (
            <p className="text-green-400 text-sm">Question added successfully!</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Adding Question..." : "Add Question"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddQuestion;