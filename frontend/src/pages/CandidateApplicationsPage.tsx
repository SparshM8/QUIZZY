import { useEffect, useState } from "react";
import { api } from "../api/client";

type Application = { id: string; status: string; score?: number; campaignId: { title: string; roleTitle: string; status: string } };

export default function CandidateApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  async function load() {
    const result = await api.get<{ data: Application[] }>("/api/recruitment/applications/me");
    setApplications(result.data);
  }
  useEffect(() => { load().catch((err) => setMessage(err instanceof Error ? err.message : "Unable to load applications")); }, []);
  async function accept() {
    try { await api.post("/api/recruitment/invitations/accept", { token }); setToken(""); setMessage("Invitation accepted. Your application is now started."); await load(); }
    catch (err) { setMessage(err instanceof Error ? err.message : "Could not accept invitation"); }
  }
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold">Recruitment applications</h1><p className="mt-1 text-sm text-slate-500">Track invited assessments and application progress.</p></div>{message && <p className="rounded-md bg-indigo-50 px-4 py-3 text-sm text-indigo-700">{message}</p>}<div className="rounded-lg border bg-white p-5"><h2 className="font-semibold">Accept an invitation</h2><div className="mt-3 flex gap-2"><input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste invitation token" className="flex-1 rounded-md border px-3 py-2 text-sm" /><button onClick={accept} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Accept</button></div></div><div className="rounded-lg border bg-white p-5"><h2 className="font-semibold">Your applications</h2><div className="mt-3 space-y-3">{applications.length === 0 && <p className="text-sm text-slate-500">No recruitment applications yet.</p>}{applications.map((application) => <div key={application.id} className="flex items-center justify-between rounded-md border p-4"><div><p className="font-medium">{application.campaignId?.title}</p><p className="text-sm text-slate-500">{application.campaignId?.roleTitle}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize">{application.status} {application.score !== undefined ? `· ${application.score}` : ""}</span></div>)}</div></div></div>;
}
