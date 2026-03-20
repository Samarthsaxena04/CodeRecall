import { useEffect, useMemo, useState } from "react";
import API from "../api";

function StatsPage() {
  const [overview, setOverview] = useState({});
  const [tags, setTags] = useState({});
  const [heatmap, setHeatmap] = useState([]);
  const [hoveredPoint, setHoveredPoint] = useState(null);
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

  const totalAttempts = Object.values(overview).reduce((sum, count) => sum + count, 0);
  const doneCount = overview.done || 0;
  const successRate = totalAttempts > 0 ? Math.round((doneCount / totalAttempts) * 100) : 0;
  const retentionRate = successRate;

  const monthlyActivity = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const points = [];
    const monthIndexByKey = new Map();

    for (let i = 0; i < 12; i += 1) {
      const monthDate = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, "0")}`;

      points.push({
        key,
        label: monthDate.toLocaleString("en-US", { month: "short" }),
        value: 0,
      });

      monthIndexByKey.set(key, i);
    }

    heatmap.forEach((item) => {
      const dt = new Date(item.date);
      if (Number.isNaN(dt.getTime())) return;

      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      const idx = monthIndexByKey.get(key);
      if (idx !== undefined) {
        points[idx].value += item.count;
      }
    });

    return points;
  }, [heatmap]);

  const maxMonthlyValue = Math.max(...monthlyActivity.map((m) => m.value), 1);
  const yAxisMax = Math.max(10, Math.ceil(maxMonthlyValue / 10) * 10);
  const yAxisStep = Math.max(1, yAxisMax / 5);
  const yAxisTicks = [0, 1, 2, 3, 4, 5].map((i) => i * yAxisStep).reverse();

  const chartWidth = 920;
  const chartHeight = 220;
  const chartPadding = 30;
  const chartLeftPadding = 44;
  const chartRightPadding = chartPadding;
  const stepX = (chartWidth - chartLeftPadding - chartRightPadding) / Math.max(monthlyActivity.length - 1, 1);
  const getXForIndex = (index) => chartLeftPadding + index * stepX;
  const getYForValue = (value) => chartHeight - chartPadding - (value / yAxisMax) * (chartHeight - chartPadding * 2);

  const chartPoints = monthlyActivity.map((point, index) => ({
    ...point,
    x: getXForIndex(index),
    y: getYForValue(point.value),
  }));

  const linePath = chartPoints
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");

  const areaPath = chartPoints.length
    ? `${linePath} L${chartPoints[chartPoints.length - 1].x},${getYForValue(0)} L${chartPoints[0].x},${getYForValue(0)} Z`
    : "";

  const ringRadius = 34;
  const ringStroke = 8;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringProgress = (Math.max(0, Math.min(100, retentionRate)) / 100) * ringCircumference;

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

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Your Progress</h1>
        <p className="text-gray-400">Track your DSA learning journey</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-gradient-to-br from-gray-900 to-blue-950 border border-blue-900/60 rounded-xl p-4 sm:p-5 min-h-[130px] shadow-lg">
          <p className="text-gray-300 text-xs sm:text-sm font-medium mb-1.5">Total Attempted</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-white">{totalAttempts} Questions</h3>
          <p className="text-gray-400 mt-2">All time</p>
        </div>

        <div className="lg:col-span-6 bg-gradient-to-br from-gray-900 to-blue-950 border border-blue-900/60 rounded-xl p-4 sm:p-5 min-h-[130px] shadow-lg flex items-center justify-between gap-3">
          <div>
            <p className="text-gray-300 text-xs sm:text-sm font-medium mb-1.5">Average Retention Rate</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-white">{retentionRate}%</h3>
            <p className="text-gray-400 mt-1.5 text-xs sm:text-sm">Based on solved vs total attempts</p>
          </div>

          <div className="relative w-20 h-20 sm:w-24 sm:h-24">
            <svg viewBox="0 0 100 100" className="w-20 h-20 sm:w-24 sm:h-24 -rotate-90">
              <circle cx="50" cy="50" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={ringStroke} />
              <circle
                cx="50"
                cy="50"
                r={ringRadius}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={ringStroke}
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringCircumference - ringProgress}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-white font-semibold text-sm sm:text-base">
              {retentionRate}%
            </div>
          </div>
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

      <div className="bg-gray-900 border border-gray-800 shadow-lg rounded-xl p-6">
        <h3 className="text-2xl font-semibold text-white mb-1">Learning Streaks</h3>
        <p className="text-sm text-gray-400 mb-5">Your monthly attempt trend for the last 12 months</p>

        <div className="overflow-x-auto">
          <div className="min-w-[780px]">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-56"
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
                </linearGradient>
              </defs>

              {yAxisTicks.map((tick) => {
                const y = getYForValue(tick);
                return (
                  <g key={tick}>
                    <line
                      x1={chartLeftPadding}
                      y1={y}
                      x2={chartWidth - chartRightPadding}
                      y2={y}
                      stroke="rgba(148, 163, 184, 0.15)"
                      strokeWidth="1"
                    />
                    <text
                      x={chartLeftPadding - 8}
                      y={y + 4}
                      textAnchor="end"
                      fill="#94a3b8"
                      fontSize="12"
                    >
                      {Math.round(tick)}
                    </text>
                  </g>
                );
              })}

              <path d={areaPath} fill="url(#trendFill)" />
              <path d={linePath} fill="none" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />

              {chartPoints.map((point) => {
                return (
                  <g key={point.key}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="11"
                      fill="transparent"
                      onMouseEnter={() => setHoveredPoint(point)}
                    />
                    <circle cx={point.x} cy={point.y} r="4.5" fill="#60a5fa" />
                    <text x={point.x} y={chartHeight - 4} textAnchor="middle" fill="#9ca3af" fontSize="12">
                      {point.label}
                    </text>
                  </g>
                );
              })}

              {hoveredPoint && (
                <g pointerEvents="none">
                  <rect
                    x={Math.max(chartLeftPadding, Math.min(hoveredPoint.x - 58, chartWidth - chartRightPadding - 116))}
                    y={Math.max(8, hoveredPoint.y - 40)}
                    rx="8"
                    ry="8"
                    width="116"
                    height="30"
                    fill="rgba(15, 23, 42, 0.95)"
                    stroke="rgba(96, 165, 250, 0.45)"
                  />
                  <text
                    x={Math.max(chartLeftPadding, Math.min(hoveredPoint.x - 58, chartWidth - chartRightPadding - 116)) + 58}
                    y={Math.max(8, hoveredPoint.y - 40) + 20}
                    textAnchor="middle"
                    fill="#e5e7eb"
                    fontSize="12"
                    fontWeight="600"
                  >
                    {`${hoveredPoint.value} question${hoveredPoint.value === 1 ? "" : "s"}`}
                  </text>
                </g>
              )}
            </svg>
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
    </div>
  );
}

export default StatsPage;