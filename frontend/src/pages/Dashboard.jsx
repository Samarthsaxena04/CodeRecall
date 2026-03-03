import { useState, useEffect } from "react";
import API from "../api";
import { Plus, CheckCircle, HelpCircle, XCircle } from 'lucide-react';

import { useNavigate } from "react-router-dom";

function Dashboard({ userName }) {
  const navigate = useNavigate();
  const [revisions, setRevisions] = useState([]);
  const [weakTopics, setWeakTopics] = useState([]);
  const [platformStats, setPlatformStats] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const revisionsRes = await API.get("/questions/revise");
      setRevisions(revisionsRes.data.slice(0, 5));

      const [overviewRes, tagsRes, heatmapRes, questionsRes, weakTopicsRes] = await Promise.all([
        API.get("/stats/overview"),
        API.get("/stats/tags"),
        API.get("/stats/heatmap"),
        API.get("/questions/all"),
        API.get("/stats/weak-topics")
      ]);

      const weakTopicsData = weakTopicsRes.data.map(t => ({
        name: t.name,
        successRate: t.success_rate,
        totalAttempts: t.total_attempts,
        failedAttempts: t.failed_attempts
      }));
      
      setWeakTopics(weakTopicsData);

      const platformCounts = {
        'LeetCode': 0,
        'Codeforces': 0,
        'HackerRank': 0,
        'GeeksForGeeks': 0,
        'Other': 0
      };

      questionsRes.data.forEach(q => {
        const platform = q.platform.trim();
        if (platform === 'LeetCode') {
          platformCounts.LeetCode++;
        } else if (platform === 'Codeforces' || platform === 'CodeForces') {
          platformCounts.Codeforces++;
        } else if (platform === 'HackerRank') {
          platformCounts.HackerRank++;
        } else if (platform === 'GeeksForGeeks' || platform === 'GFG') {
          platformCounts.GeeksForGeeks++;
        } else {
          platformCounts.Other++;
        }
      });

      const platformStatsData = [
        { name: "LeetCode", count: platformCounts.LeetCode, color: "orange" },
        { name: "Codeforces", count: platformCounts.Codeforces, color: "blue" },
        { name: "HackerRank", count: platformCounts.HackerRank, color: "green" },
        { name: "GeeksForGeeks", count: platformCounts.GeeksForGeeks, color: "teal" },
        { name: "Other", count: platformCounts.Other, color: "gray" }
      ].filter(p => p.count > 0);

      setPlatformStats(platformStatsData);
      setHeatmapData(heatmapRes.data);

      const total = Object.values(overviewRes.data).reduce((sum, count) => sum + count, 0);
      const solved = overviewRes.data.done || 0;
      const needHelp = overviewRes.data.help || 0;
      const failed = overviewRes.data.fail || 0;
      
      setStats({
        total,
        solved,
        needHelp,
        failed,
      });

    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevision = async (id, status) => {
    try {
      await API.post(`/questions/${id}/revise`, { status });
      setRevisions(prev => prev.filter(r => r.question_id !== id));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to record revision");
    }
  };

  const platformColors = {
    orange: 'bg-orange-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    teal: 'bg-teal-500',
    gray: 'bg-gray-500'
  };

  const getIntensityColor = (count) => {
    if (count === 0) return 'bg-gray-800';
    if (count === 1) return 'bg-green-900';
    if (count === 2) return 'bg-green-700';
    if (count === 3) return 'bg-green-600';
    if (count === 4) return 'bg-green-500';
    return 'bg-green-400';
  };

  const getMonthLabels = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels = [];
    const heatmapWeeks = generateHeatmap();
    const MIN_SPACING = 4; // minimum weeks between labels
    
    let lastMonth = -1;
    let lastWeekIndex = -MIN_SPACING;
    
    heatmapWeeks.forEach((week, weekIndex) => {
      if (week.length > 0) {
        const firstDay = week[0];
        const currentMonth = firstDay.month;
        
        if (currentMonth !== lastMonth && weekIndex - lastWeekIndex >= MIN_SPACING) {
          labels.push({
            name: months[currentMonth],
            weekIndex: weekIndex
          });
          lastMonth = currentMonth;
          lastWeekIndex = weekIndex;
        }
      }
    });
    
    return labels;
  };

  const generateHeatmap = () => {
    const weeks = [];
    const dataMap = new Map();
    
    heatmapData.forEach(d => {
      dataMap.set(d.date, d.count);
    });
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    startDate.setHours(0, 0, 0, 0);
    
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= today) {
      const weekData = [];
      
      for (let day = 0; day < 7; day++) {
        const cellDate = new Date(currentDate);
        cellDate.setDate(currentDate.getDate() + day);
        cellDate.setHours(0, 0, 0, 0);
        
        if (cellDate <= today) {
          const year = cellDate.getFullYear();
          const month = String(cellDate.getMonth() + 1).padStart(2, '0');
          const dayNum = String(cellDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${dayNum}`;
          
          weekData.push({
            date: dateStr,
            count: dataMap.get(dateStr) || 0,
            day: day,
            month: cellDate.getMonth(),
            dayOfMonth: cellDate.getDate(),
            year: cellDate.getFullYear()
          });
        }
      }
      
      if (weekData.length > 0) {
        weeks.push(weekData);
      }
      
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return weeks;
  };



  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  const totalQuestions = platformStats.reduce((sum, p) => sum + p.count, 0);
  const heatmapWeeks = generateHeatmap();
  const monthLabels = getMonthLabels();

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome back, {userName} 👋</h1>
          <p className="text-gray-400 text-sm sm:text-base">Track your DSA progress and master algorithms with spaced repetition</p>
        </div>
        <button 
          onClick={() => navigate('/add')}
          className="px-3 py-2 sm:px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition flex-shrink-0 text-sm sm:text-base"
        >
          <Plus size={20} />
          Quick Add
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex justify-between items-start sm:items-center mb-4 gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-white">Active Revisions</h2>
              <p className="text-sm text-gray-400">Questions due for spaced repetition</p>
            </div>
            <span className="px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0">
              {revisions.length} Pending
            </span>
          </div>

          {revisions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
              <p className="text-gray-400">No questions to revise today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {revisions.map((question) => (
                <div key={question.question_id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 text-xs rounded border bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {question.platform}
                        </span>
                      </div>
                      <h3 className="text-white font-semibold mb-2">{question.title}</h3>
                      
                      <a
                        href={question.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition mb-2"
                      >
                        <span>View Problem</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      
                      {question.tags && question.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {question.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {question.notes && (
                        <p className="text-sm text-gray-400 mt-2">{question.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button 
                        onClick={() => handleRevision(question.question_id, 'done')}
                        className="p-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition"
                        title="Solved"
                      >
                        <CheckCircle size={20} />
                      </button>
                      <button 
                        onClick={() => handleRevision(question.question_id, 'help')}
                        className="p-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg transition"
                        title="Needed Help"
                      >
                        <HelpCircle size={20} />
                      </button>
                      <button 
                        onClick={() => handleRevision(question.question_id, 'fail')}
                        className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition"
                        title="Unsolved"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Weak Topics</h2>
            {weakTopics.length === 0 ? (
              <p className="text-gray-400 text-sm">No data yet</p>
            ) : (
              <div className="space-y-3">
                {weakTopics.map((topic, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{topic.name}</span>
                      <span className="text-red-400">{topic.successRate}% success</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                        style={{ width: `${topic.successRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Platform Breakdown</h2>
            {platformStats.length === 0 ? (
              <p className="text-gray-400 text-sm">No questions added yet</p>
            ) : (
              <div className="space-y-4">
                {platformStats.map((platform, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">{platform.name}</span>
                      <span className="text-white font-semibold">{platform.count} questions</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${platformColors[platform.color]}`}
                        style={{ width: `${(platform.count / totalQuestions) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {stats ? `${stats.total} submissions in the last year` : 'Activity Heatmap'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">Your coding consistency over the past year</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-sm text-gray-400">
            <span>Less</span>
            <div className="flex gap-1.5 sm:gap-2">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border border-gray-700 bg-gray-800" />
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-green-900/60" />
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-green-700/80" />
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-green-600" />
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-green-500" />
            </div>
            <span>More</span>
          </div>
        </div>
        
        <div className="overflow-x-auto no-scrollbar">
          <div className="inline-flex flex-col gap-4 min-w-full">
            <div className="flex relative pl-12" style={{ height: '10px' }}>
              {monthLabels.map((label, idx) => (
                <span
                  key={idx} 
                  className="text-sm font-medium text-gray-400 absolute"
                  style={{ left: `${48 + (label.weekIndex * 16)}px` }}
                >
                  {label.name}
                </span>
              ))}
            </div>
            
            <div className="flex gap-0 mt-0">
              <div className="flex flex-col justify-around text-xs text-gray-400 w-10 text-center pr-2">
                <div className="h-3 leading-3"></div>
                <div className="h-3 leading-3">Mon</div>
                <div className="h-3 leading-3"></div>
                <div className="h-3 leading-3">Wed</div>
                <div className="h-3 leading-3"></div>
                <div className="h-3 leading-3">Fri</div>
                <div className="h-3 leading-3"></div>
              </div>
              
              <div className="flex gap-1">
                {heatmapWeeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-1">
                    {week.map((day, dayIdx) => (
                      <div
                        key={`${weekIdx}-${dayIdx}`}
                        className={`w-[12px] h-[12px] rounded-sm ${getIntensityColor(day.count)} hover:ring-2 hover:ring-blue-400 hover:scale-125 transition-all cursor-pointer`}
                        title={`${day.date}: ${day.count} submission${day.count !== 1 ? 's' : ''}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;