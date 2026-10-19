import { useQuery } from "@tanstack/react-query";
import { Archive, CheckCircle2, Database, FileWarning, Leaf, PencilLine } from "lucide-react";
import { Link } from "react-router-dom";
import { getAdminSummary } from "../../api/adminApi.js";
import { queryKeys } from "../../api/queryKeys.js";
import { Card } from "../../components/common/Card.jsx";
import { ErrorState, LoadingState } from "../../components/common/StatusStates.jsx";

const labels = {
  letters: "Chu cai",
  tones: "Dau thanh",
  vocabulary: "Tu vung",
  "spelling-entries": "Ghep van",
  lessons: "Bai hoc",
  exercises: "Bai tap",
  stories: "Truyen",
  resources: "Tai nguyen",
  assets: "Asset",
  rewards: "Qua tang",
  "reward-catalog": "Catalog qua",
  badges: "Huy hieu",
  missions: "Nhiem vu"
};

export function AdminDashboardPage() {
  const summary = useQuery({ queryKey: queryKeys.adminSummary(), queryFn: getAdminSummary, retry: false });

  if (summary.isLoading) return <LoadingState label="Dang tai bang quan tri noi dung..." />;
  if (summary.isError) return <ErrorState title="Khong tai duoc admin dashboard" message={summary.error.message} onRetry={() => summary.refetch()} />;

  const counts = summary.data?.counts ?? [];
  const totals = counts.reduce(
    (acc, item) => ({
      total: acc.total + item.total,
      draft: acc.draft + item.draft,
      published: acc.published + item.published,
      needsReview: acc.needsReview + item.needsReview,
      missing: acc.missing + item.missing
    }),
    { total: 0, draft: 0, published: 0, needsReview: 0, missing: 0 }
  );

  return (
    <div className="grid gap-6">
      <header className="rounded-[32px] bg-white p-6 shadow-soft">
        <p className="inline-flex items-center gap-2 rounded-full bg-[#d8fff0] px-4 py-2 text-sm font-black text-[var(--vc-primary)]">
          <Leaf className="h-4 w-4" /> Admin content only
        </p>
        <h1 className="mt-4 font-display text-4xl font-black text-[var(--vc-primary)]">Quan tri hoc lieu va vong duyet</h1>
        <p className="mt-3 max-w-3xl font-semibold leading-7 text-[var(--vc-muted)]">
          Dashboard nay chi quan tri content namespace. Khong mo ho so tre toan he thong, khong tao audio/PDF gia, va learner preview khong lo dap an.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-5">
        <Metric icon={Database} label="Tong ban ghi" value={totals.total} />
        <Metric icon={PencilLine} label="Draft" value={totals.draft} />
        <Metric icon={CheckCircle2} label="Published" value={totals.published} />
        <Metric icon={FileWarning} label="Can duyet" value={totals.needsReview} />
        <Metric icon={Archive} label="Missing/resource" value={totals.missing} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-black">Registry noi dung</h2>
              <p className="mt-1 text-sm font-semibold text-[var(--vc-muted)]">Counts doc truc tiep tu MongoDB qua `/api/v1/admin/summary`.</p>
            </div>
            <Link className="rounded-full bg-[var(--vc-primary)] px-4 py-2 font-display text-sm font-black text-white shadow-button" to="/admin/bien-tap">
              Mo bang bien tap
            </Link>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[var(--vc-muted)]">
                <tr>
                  <th className="py-3">Loai</th>
                  <th className="py-3">Tong</th>
                  <th className="py-3">Draft</th>
                  <th className="py-3">Published</th>
                  <th className="py-3">Needs review</th>
                  <th className="py-3">Missing</th>
                </tr>
              </thead>
              <tbody>
                {counts.map((item) => (
                  <tr className="border-t border-[#e0f2e9]" key={item.resourceType}>
                    <td className="py-3 font-black text-[var(--vc-primary)]">{labels[item.resourceType] ?? item.resourceType}</td>
                    <td>{item.total}</td>
                    <td>{item.draft}</td>
                    <td>{item.published}</td>
                    <td>{item.needsReview}</td>
                    <td>{item.missing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-2xl font-black">Audit gan day</h2>
          <div className="mt-4 grid gap-3">
            {(summary.data?.recentAudit ?? []).map((item) => (
              <article className="rounded-2xl bg-[#e9fff5] p-3" key={item.id}>
                <p className="font-black text-[var(--vc-primary)]">
                  {item.action} - {labels[item.resourceType] ?? item.resourceType}
                </p>
                <p className="mt-1 text-xs font-bold text-[var(--vc-muted)]">
                  version {item.contentVersion ?? "-"} - {new Date(item.createdAt).toLocaleString("vi-VN")}
                </p>
              </article>
            ))}
            {!(summary.data?.recentAudit ?? []).length ? <p className="rounded-2xl bg-[#fff4cf] p-3 font-bold text-[#9a5b00]">Chua co audit thao tac content.</p> : null}
          </div>
        </Card>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <article className="rounded-[28px] bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-[var(--vc-muted)]">{label}</p>
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#c9ffe9] text-[var(--vc-primary)]">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 font-display text-4xl font-black text-[var(--vc-primary)]">{value}</p>
    </article>
  );
}
