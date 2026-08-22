import { useEffect, useState } from "react";
import { api } from "../api/client";

interface SkillData {
  category: string;
  score: number;
  maxScore: number;
  readiness: number;
  recommendation: string;
}

export default function SkillGapAnalytics() {
  const [skills, setSkills] = useState<SkillData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSkills = async () => {
    try {
      const res = await api.get<{ success: boolean; data: SkillData[] }>("/api/analytics/skills");
      setSkills(res.data);
    } catch (err) {
      console.error("Failed to fetch skills:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const getReadinessColor = (readiness: number) => {
    if (readiness >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (readiness >= 60) return "text-blue-600 bg-blue-50 border-blue-200";
    if (readiness >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Placement Readiness Report</h1>
        <p className="mt-1 text-sm text-gray-500">A detailed analysis of your skills mapped to industry standards.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="mt-4 text-sm text-gray-500">Analyzing your performance...</p>
        </div>
      ) : skills.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-24 text-center">
          <h3 className="text-sm font-semibold text-gray-900">Not enough data</h3>
          <p className="mt-1 text-sm text-gray-500">Complete more assessments to see your readiness report.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            {skills.map((skill, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{skill.category}</h3>
                  <div className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${getReadinessColor(skill.readiness)}`}>
                    {skill.readiness}% Ready
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between text-xs font-bold text-gray-400 uppercase mb-2">
                    <span>Proficiency</span>
                    <span>{skill.score} / {skill.maxScore} pts</span>
                  </div>
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-1000" 
                      style={{ width: `${skill.readiness}%` }} 
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase mb-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Actionable Insight
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {skill.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl bg-indigo-900 p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/5 rounded-full" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-4">Target Company Match</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { name: "TCS / Infosys", match: 85, color: "bg-green-400" },
                  { name: "Product Based (FAANG)", match: 45, color: "bg-yellow-400" },
                  { name: "Startups (Unicorns)", match: 65, color: "bg-blue-400" }
                ].map((c, i) => (
                  <div key={i} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                    <p className="text-xs font-bold text-indigo-200 uppercase mb-1">{c.name}</p>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold">{c.match}%</span>
                      <span className="text-[10px] text-indigo-300 mb-1 font-medium">Match</span>
                    </div>
                    <div className="h-1 w-full bg-white/20 mt-3 rounded-full overflow-hidden">
                      <div className={`h-full ${c.color}`} style={{ width: `${c.match}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
