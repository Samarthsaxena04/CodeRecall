// import { useEffect, useState } from "react";
// import API from "../api";

// function Revise() {
//   const [questions, setQuestions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const fetchQuestions = async () => {
//     try {
//       setLoading(true);
//       const res = await API.get("/questions/revise");
//       setQuestions(res.data);
//       setError("");
//     } catch (err) {
//       setError(err.response?.data?.detail || "Failed to fetch questions");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchQuestions();
//   }, []);

//   const handleRevision = async (id, status) => {
//     try {
//       await API.post(`/questions/${id}/revise`, { status });
//       await fetchQuestions();
//     } catch (err) {
//       alert(err.response?.data?.detail || "Failed to record revision");
//     }
//   };

//   if (loading) {
//     return (
//       <div className="max-w-3xl mx-auto text-center">
//         <div className="text-xl text-gray-600 dark:text-gray-400">Loading questions...</div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="max-w-3xl mx-auto">
//         <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 p-4 rounded-lg">
//           {error}
//         </div>
//       </div>
//     );
//   }

//   if (questions.length === 0) {
//     return (
//       <div className="max-w-3xl mx-auto">
//         <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-12 text-center transition-colors duration-300">
//           <div className="text-6xl mb-4">🎉</div>
//           <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
//             No Questions to Revise Today!
//           </h2>
//           <p className="text-gray-600 dark:text-gray-400">
//             You're all caught up. Come back later or add more questions.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-3xl mx-auto">
//       <div className="mb-8">
//         <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Questions To Revise</h2>
//         <p className="text-gray-600 dark:text-gray-400 mt-2">
//           {questions.length} question{questions.length !== 1 ? "s" : ""} waiting for revision
//         </p>
//       </div>

//       <div className="space-y-6">
//         {questions.map((q) => (
//           <div
//             key={q.question_id}
//             className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 hover:shadow-2xl transition-all border border-gray-100 dark:border-gray-700"
//           >
//             <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
//               {q.title}
//             </h3>

//             <div className="flex items-center gap-4 mb-4">
//               <a
//                 href={q.link}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
//               >
//                 <span>Open Question</span>
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
//                 </svg>
//               </a>
              
//               <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
//                 {q.platform}
//               </span>
//             </div>

//             {q.notes && (
//               <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg mb-4">
//                 <p className="text-sm text-gray-700 dark:text-gray-300">
//                   <span className="font-semibold">Notes:</span> {q.notes}
//                 </p>
//               </div>
//             )}

//             <div className="flex gap-3">
//               <button
//                 onClick={() => handleRevision(q.question_id, "done")}
//                 className="flex-1 px-4 py-3 bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition font-medium"
//               >
//                 ✅ Done
//               </button>

//               <button
//                 onClick={() => handleRevision(q.question_id, "help")}
//                 className="flex-1 px-4 py-3 bg-yellow-500 dark:bg-yellow-600 text-white rounded-lg hover:bg-yellow-600 dark:hover:bg-yellow-700 transition font-medium"
//               >
//                 🆘 Need Help
//               </button>

//               <button
//                 onClick={() => handleRevision(q.question_id, "fail")}
//                 className="flex-1 px-4 py-3 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition font-medium"
//               >
//                 ❌ Failed
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default Revise;