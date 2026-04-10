import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { getOperatorSummary } from "@/lib/verification-store";

export const dynamic = "force-dynamic";

const decisionLabels: Record<string, string> = {
  approved_understanding: "이해 승인",
  needs_followup: "후속 확인 필요",
  manual_review_required: "수동 검토 필요",
};

const classificationLabels: Record<string, string> = {
  sufficient_understanding: "이해 충분",
  surface_memorization: "표면 암기",
  submission_dependency: "제출물 의존",
  core_misconception: "핵심 오개념",
  uncertain: "불확실",
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default async function OperatorPage() {
  const summary = await getOperatorSummary();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-6 rounded-[32px] border border-white/70 bg-white/82 p-6 shadow-[0_30px_80px_rgba(36,48,64,0.08)] backdrop-blur xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge tone="accent">Operator Dashboard</StatusBadge>
            <StatusBadge tone="neutral">
              {formatDateTime(summary.generatedAt)} 기준
            </StatusBadge>
          </div>
          <div className="space-y-3">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              반과 과정 단위의 이해 검증 흐름을 요약합니다.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
              운영자는 VIVA의 누적 분석 결과를 통해 어떤 개념에서 반복적으로
              이해가 무너지는지, 교사의 최종 판단이 어디에 몰리는지, 어떤 과제가
              후속 조치가 필요한지 빠르게 파악할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="grid gap-4 rounded-[28px] bg-[linear-gradient(180deg,rgba(255,248,240,0.92),rgba(246,250,255,0.92))] p-5">
          <div className="grid gap-2 rounded-3xl border border-orange-200/70 bg-white/75 p-4">
            <p className="text-xs font-semibold tracking-[0.2em] text-orange-700 uppercase">
              Export
            </p>
            <div className="mt-1 flex flex-wrap gap-3">
              <Link
                href="/api/export?format=json"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
              >
                JSON 내보내기
              </Link>
              <Link
                href="/api/export?format=csv"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
              >
                CSV 내보내기
              </Link>
              <Link
                href="/teacher"
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                교사 워크벤치로 이동
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "총 검증 세션",
                value: summary.totalVerifications,
              },
              {
                label: "분석 완료",
                value: summary.analyzedVerifications,
              },
              {
                label: "교사 판단 저장",
                value: summary.teacherDecisions,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border border-white/90 bg-white/80 px-4 py-4"
              >
                <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                  {item.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                Analysis Distribution
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                분류 분포
              </h2>
            </div>
            <StatusBadge tone="neutral">AI 결과</StatusBadge>
          </div>
          <div className="mt-5 grid gap-3">
            {summary.classificationCounts.length > 0 ? (
              summary.classificationCounts.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm font-medium text-slate-700">
                    {classificationLabels[item.label] ?? item.label}
                  </span>
                  <span className="text-sm font-semibold text-slate-950">
                    {item.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                아직 저장된 분석 결과가 없습니다.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                Teacher Decisions
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                교사 최종 판단 분포
              </h2>
            </div>
            <StatusBadge tone="neutral">Human Override</StatusBadge>
          </div>
          <div className="mt-5 grid gap-3">
            {summary.teacherDecisionCounts.length > 0 ? (
              summary.teacherDecisionCounts.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm font-medium text-slate-700">
                    {decisionLabels[item.label] ?? item.label}
                  </span>
                  <span className="text-sm font-semibold text-slate-950">
                    {item.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                아직 저장된 교사 판단이 없습니다.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                Missing Concepts
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                자주 빠지는 개념
              </h2>
            </div>
            <StatusBadge tone="neutral">Top 6</StatusBadge>
          </div>
          <div className="mt-5 grid gap-3">
            {summary.topMissingConcepts.length > 0 ? (
              summary.topMissingConcepts.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm font-medium text-slate-700">
                    {item.label}
                  </span>
                  <span className="text-sm font-semibold text-slate-950">
                    {item.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                아직 누락 개념 집계가 없습니다.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                Misconceptions
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                반복 오개념
              </h2>
            </div>
            <StatusBadge tone="neutral">Top 6</StatusBadge>
          </div>
          <div className="mt-5 grid gap-3">
            {summary.topMisconceptions.length > 0 ? (
              summary.topMisconceptions.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm font-medium text-slate-700">
                    {item.label}
                  </span>
                  <span className="text-sm font-semibold text-slate-950">
                    {item.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                아직 오개념 집계가 없습니다.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
              Recent Activity
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              최근 검증 세션
            </h2>
          </div>
          <StatusBadge tone="neutral">Latest 8</StatusBadge>
        </div>

        <div className="mt-5 grid gap-3">
          {summary.recentVerifications.length > 0 ? (
            summary.recentVerifications.map((item) => (
              <div
                key={item.verificationId}
                className="grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 md:grid-cols-[1fr_auto_auto]"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {item.assignmentTitle}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.verificationId}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={item.classification ? "accent" : "neutral"}>
                    {item.classification
                      ? classificationLabels[item.classification] ?? item.classification
                      : "분석 전"}
                  </StatusBadge>
                  <StatusBadge tone={item.teacherDecision ? "success" : "warning"}>
                    {item.teacherDecision
                      ? decisionLabels[item.teacherDecision] ?? item.teacherDecision
                      : "교사 판단 전"}
                  </StatusBadge>
                </div>
                <div className="text-sm text-slate-600">
                  {formatDateTime(item.updatedAt)}
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              아직 저장된 검증 세션이 없습니다. 교사 워크벤치에서 질문을 생성하면
              이곳에 최근 활동이 표시됩니다.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
