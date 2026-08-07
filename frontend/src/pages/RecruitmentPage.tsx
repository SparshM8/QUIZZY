import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/auth";

type Organization = { id: string; name: string; slug: string };
type Campaign = { id: string; title: string; roleTitle: string; status: string; skills: string[]; organizationId: Organization | string };
type RankingRow = { rank: number; id: string; status: string; score?: number; notes: string; candidateId: { name: string; email: string } };

export default function RecruitmentPage() {
  const { session } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [orgName, setOrgName] = useState("");
  const [campaignTitle, setCampaignTitle] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [skills, setSkills] = useState("");
  const [emails, setEmails] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const [orgs, campaignList] = await Promise.all([
      api.get<{ data: Organization[] }>("/api/recruitment/organizations"),
      api.get<{ data: Campaign[] }>("/api/recruitment/campaigns"),
    ]);
    setOrganizations(orgs.data);
    setCampaigns(campaignList.data);
    if (selectedCampaign) {
      const result = await api.get<{ data: RankingRow[] }>(`/api/recruitment/campaigns/${selectedCampaign.id}/ranking`);
      setRanking(result.data);
    }
  }
  useEffect(() => { load().catch((err) => setMessage(err instanceof Error ? err.message : "Unable to load recruitment workspace")); }, [selectedCampaign]);

  async function createOrganization(event: FormEvent) {
    event.preventDefault();
    try { await api.post("/api/recruitment/organizations", { name: orgName }); setOrgName(""); setMessage("Organization created."); await load(); }
    catch (err) { setMessage(err instanceof Error ? err.message : "Could not create organization"); }
  }
  async function createCampaign(event: FormEvent) {
    event.preventDefault();
    if (!organizations[0]) { setMessage("Create an organization first."); return; }
    try {
      await api.post("/api/recruitment/campaigns", { organizationId: organizations[0].id, title: campaignTitle, roleTitle, skills: skills.split(",").map((item) => item.trim()).filter(Boolean) });
      setCampaignTitle(""); setRoleTitle(""); setSkills(""); setMessage("Campaign created as a draft."); await load();
    } catch (err) { setMessage(err instanceof Error ? err.message : "Could not create campaign"); }
  }
  async function invite(event: FormEvent) {
    event.preventDefault();
    if (!selectedCampaign) return;
    try { await api.post(`/api/recruitment/campaigns/${selectedCampaign.id}/invitations`, { emails: emails.split(",").map((item) => item.trim()).filter(Boolean) }); setEmails(""); setMessage("Invitations sent and candidate applications created."); await load(); }
    catch (err) { setMessage(err instanceof Error ? err.message : "Could not send invitations"); }
  }
  async function updateStatus(applicationId: string, status: string) {
    try { await api.patch(`/api/recruitment/applications/${applicationId}`, { status }); setMessage(`Application marked ${status}.`); await load(); }
    catch (err) { setMessage(err instanceof Error ? err.message : "Could not update application"); }
  }

  if (session?.user.role !== "recruiter" && session?.user.role !== "admin") {
    return <div className="rounded-lg border bg-white p-6"><h1 className="text-xl font-bold">Recruitment</h1><p className="mt-2 text-slate-600">Recruiter access is required for this workspace.</p></div>;
  }
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Recruitment workspace</h1><p className="mt-1 text-sm text-slate-500">Create campaigns, invite candidates, and shortlist the strongest applicants.</p></div>
      {message && <p className="rounded-md bg-indigo-50 px-4 py-3 text-sm text-indigo-700">{message}</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={createOrganization} className="rounded-lg border bg-white p-5 space-y-3">
          <h2 className="font-semibold">Create organization</h2>
          <input required value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Organization name" className="w-full rounded-md border px-3 py-2 text-sm" />
          <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Add organization</button>
        </form>
        <form onSubmit={createCampaign} className="rounded-lg border bg-white p-5 space-y-3">
          <h2 className="font-semibold">Create hiring campaign</h2>
          <input required value={campaignTitle} onChange={(e) => setCampaignTitle(e.target.value)} placeholder="Campaign title" className="w-full rounded-md border px-3 py-2 text-sm" />
          <input required value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="Role title" className="w-full rounded-md border px-3 py-2 text-sm" />
          <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Skills, comma separated" className="w-full rounded-md border px-3 py-2 text-sm" />
          <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Create campaign</button>
        </form>
      </div>
      <div className="rounded-lg border bg-white p-5">
        <h2 className="font-semibold">Campaigns</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">{campaigns.map((campaign) => <button key={campaign.id} onClick={() => setSelectedCampaign(campaign)} className={`rounded-md border p-4 text-left ${selectedCampaign?.id === campaign.id ? "border-indigo-500 bg-indigo-50" : "hover:border-indigo-300"}`}><p className="font-medium">{campaign.title}</p><p className="text-sm text-slate-500">{campaign.roleTitle} · {campaign.status}</p><p className="mt-1 text-xs text-slate-400">{campaign.skills.join(" · ") || "No skills listed"}</p></button>)}</div>
      </div>
      {selectedCampaign && <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <form onSubmit={invite} className="rounded-lg border bg-white p-5 space-y-3"><h2 className="font-semibold">Invite candidates</h2><p className="text-sm text-slate-500">{selectedCampaign.title}</p><textarea required value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="candidate@example.com, another@example.com" className="min-h-28 w-full rounded-md border px-3 py-2 text-sm" /><button className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white">Send invitations</button></form>
        <div className="rounded-lg border bg-white p-5"><h2 className="font-semibold">Candidate ranking</h2><div className="mt-3 space-y-3">{ranking.length === 0 && <p className="text-sm text-slate-500">No applications yet.</p>}{ranking.map((row) => <div key={row.id} className="flex items-center justify-between gap-3 rounded-md border p-3"><div><p className="font-medium">#{row.rank} {row.candidateId?.name ?? "Candidate"}</p><p className="text-xs text-slate-500">{row.candidateId?.email} · score {row.score ?? "pending"}</p></div><select value={row.status} onChange={(e) => updateStatus(row.id, e.target.value)} className="rounded border px-2 py-1 text-xs"><option value="invited">Invited</option><option value="started">Started</option><option value="completed">Completed</option><option value="shortlisted">Shortlisted</option><option value="rejected">Rejected</option></select></div>)}</div></div>
      </div>}
    </div>
  );
}
