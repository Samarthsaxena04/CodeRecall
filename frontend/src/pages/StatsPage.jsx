import { useEffect, useState } from "react";
import API from "../api";

function StatsPage() {
  const [overview, setOverview] = useState({});
  const [tags, setTags] = useState({});
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [overviewRes, tagsRes, heatmapRes] = await Promise.all([
        API.get("/stats/overview"),
        API.get("/stats/tags"),
        API.get("/stats/heatmap"),
      ]);

      setOverview(overviewRes.data);
      setTags(tagsRes.data);
      setHeatmap(heatmapRes.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to fetch statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-400">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-400 text-sm">* {error}</p>
      </div>
    );
  }

  const totalAttempts = Object.values(overview).reduce((sum, count) => sum + count, 0);
  const doneCount = overview.done || 0;
  const successRate = totalAttempts > 0 ? Math.round((doneCount / totalAttempts) * 100) : 0;

  const getIntensityColor = (count) => {
    if (count === 0) return 'bg-gray-800';
    if (count === 1) return 'bg-green-900';
    if (count === 2) return 'bg-green-700';
    if (count === 3) return 'bg-green-600';
    if (count === 4) return 'bg-green-500';
    return 'bg-green-400';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Your Progress</h1>
        <p className="text-gray-400">Track your DSA learning journey</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg rounded-xl p-6 text-white">
          <p className="text-blue-100 text-sm font-medium mb-1">Total Attempts</p>
          <h3 className="text-4xl font-bold">{totalAttempts}</h3>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 shadow-lg rounded-xl p-6 text-white">
          <p className="text-green-100 text-sm font-medium mb-1">Solved</p>
          <h3 className="text-4xl font-bold">{overview.done || 0}</h3>
        </div>

        <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 shadow-lg rounded-xl p-6 text-white">
          <p className="text-yellow-100 text-sm font-medium mb-1">Need Help</p>
          <h3 className="text-4xl font-bold">{overview.help || 0}</h3>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg rounded-xl p-6 text-white">
          <p className="text-purple-100 text-sm font-medium mb-1">Success Rate</p>
          <h3 className="text-4xl font-bold">{successRate}%</h3>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 shadow-lg rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Status Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-green-900/20 rounded-lg border border-green-700">
            <span className="font-medium text-gray-300">Solved</span>
            <span className="text-2xl font-bold text-green-400">{overview.done || 0}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-yellow-900/20 rounded-lg border border-yellow-700">
            <span className="font-medium text-gray-300">Needed Help</span>
            <span className="text-2xl font-bold text-yellow-400">{overview.help || 0}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-red-900/20 rounded-lg border border-red-700">
            <span className="font-medium text-gray-300">Unsolved</span>
            <span className="text-2xl font-bold text-red-400">{overview.fail || 0}</span>
          </div>
        </div>
      </div>

      {Object.keys(tags).length > 0 && (
        <div className="bg-gray-900 border border-gray-800 shadow-lg rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            Topics Needing Practice
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Topics where you needed help or failed
          </p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(tags)
              .sort(([, a], [, b]) => b - a)
              .map(([tag, count]) => (
                <div
                  key={tag}
                  className="px-4 py-2 bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-700 rounded-lg"
                >
                  <span className="font-medium text-gray-200">{tag}</span>
                  <span className="ml-2 text-sm text-gray-400">({count})</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {heatmap.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 shadow-lg rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Activity Heatmap</h3>
          <p className="text-sm text-gray-400 mb-4">Your daily practice activity</p>
          <div className="flex flex-wrap gap-2">
            {heatmap.map((d, idx) => {
              const intensity = Math.min(d.count, 5);
              
              return (
                <div
                  key={idx}
                  className={`w-8 h-8 ${getIntensityColor(intensity)} rounded hover:ring-2 hover:ring-blue-500 transition cursor-pointer`}
                  title={`${d.date}: ${d.count} question${d.count !== 1 ? "s" : ""}`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-gray-800 rounded" />
              <div className="w-4 h-4 bg-green-900 rounded" />
              <div className="w-4 h-4 bg-green-700 rounded" />
              <div className="w-4 h-4 bg-green-500 rounded" />
            </div>
            <span>More</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatsPage;