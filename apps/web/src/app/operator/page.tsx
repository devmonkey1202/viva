import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { getOperatorSummary, usingManagedDatabase } from "@/lib/verification-store";

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
  const managedDatabase = usingManagedDatabase();

  return (
    <main className="viva-page py-4 sm:py-6">
      <section className="viva-panel viva-reveal-1 rounded-[2rem] px-6 py-6 sm:px-8 sm:py-8">
        <div className="grid gap-8 xl:grid-cols-[1.12fr_0.88fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="viva-kicker">operator oversight</span>
              <StatusBadge tone={managedDatabase ? "success" : "warning"}>
                {managedDatabase ? "Managed DB mode" : "Local store mode"}
              </StatusBadge>
            </div>
            <div className="space-y-4">
              <p className="viva-caption">Process Evidence</p>
              <h1 className="viva-display max-w-4xl text-[2.8rem] text-[var(--foreground)] sm:text-[4rem]">
                한 번의 결과보다
                <br />
                <span className="text-[var(--accent)]">반복 패턴</span>을 봅니다.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-[rgba(24,20,17,0.72)]">
                운영자 대시보드는 VIVA의 검증 결과를 누적해, 어떤 과제와 개념이
                지속적으로 무너지는지, 교사 판단이 어디에 몰리는지, 리메디얼이
                필요한 지점을 빠르게 요약합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/teacher" className="viva-button-primary">
                교사 워크벤치로 이동
              </Link>
              <Link href="/api/export?format=csv" className="viva-button-secondary">
                CSV export
              </Link>
              <Link href="/api/export?format=json" className="viva-button-ghost">
                JSON export
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="viva-grid-rule rounded-[1.8rem] px-5 py-5">
              <p className="viva-caption">Current Counters</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                {[
                  ["총 검증 세션", summary.totalVerifications],
                  ["분석 완료", summary.analyzedVerifications],
                  ["교사 판단 저장", summary.teacherDecisions],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="viva-stat rounded-[1.45rem] px-4 py-4"
                  >
                    <p className="text-[11px] font-extrabold tracking-[0.18em] uppercase text-[rgba(24,20,17,0.52)]">
                      {label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="viva-panel-soft rounded-[1.8rem] px-5 py-5">
              <p className="viva-caption">Last Refresh</p>
              <p className="mt-4 text-sm leading-7 text-[rgba(24,20,17,0.72)]">
                {formatDateTime(summary.generatedAt)} 기준으로 최신 검증 세션을
                반영했습니다. export 결과와 화면 집계는 같은 저장소를 기준으로
                계산됩니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="viva-panel viva-reveal-2 rounded-[1.85rem] px-5 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="viva-caption">Analysis Distribution</p>
              <h2 className="mt-2 text-[1.8rem] font-semibold text-[var(--foreground)]">
                AI 분류 분포
              </h2>
            </div>
            <StatusBadge tone="accent">Classification</StatusBadge>
          </div>
          <div className="mt-5 grid gap-3">
            {summary.classificationCounts.length > 0 ? (
              summary.classificationCounts.map((item) => (
                <div
                  key={item.label}
                  className="viva-stat flex items-center justify-between rounded-[1.35rem] px-4 py-3"
                >
                  <span className="text-sm font-semibold text-[rgba(24,20,17,0.76)]">
                    {classificationLabels[item.label] ?? item.label}
                  </span>
                  <span className="text-lg font-semibold text-[var(--foreground)]">
                    {item.count}
                  </span>
                </div>
              ))
            ) : (
              <div className="viva-grid-rule rounded-[1.45rem] px-4 py-6 text-sm leading-7 text-[rgba(24,20,17,0.62)]">
                아직 저장된 분석 결과가 없습니다.
              </div>
            )}
          </div>
        </article>

        <article className="viva-panel viva-reveal-3 rounded-[1.85rem] px-5 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="viva-caption">Teacher Override</p>
              <h2 className="mt-2 text-[1.8rem] font-semibold text-[var(--foreground)]">
                교사 최종 판단 분포
              </h2>
            </div>
            <StatusBadge tone="success">Human Decision</StatusBadge>
          </div>
          <div className="mt-5 grid gap-3">
            {summary.teacherDecisionCounts.length > 0 ? (
              summary.teacherDecisionCounts.map((item) => (
                <div
                  key={item.label}
                  className="viva-stat flex items-center justify-between rounded-[1.35rem] px-4 py-3"
                >
                  <span className="text-sm font-semibold text-[rgba(24,20,17,0.76)]">
                    {decisionLabels[item.label] ?? item.label}
                  </span>
                  <span className="text-lg font-semibold text-[var(--foreground)]">
                    {item.count}
                  </span>
                </div>
              ))
            ) : (
              <div className="viva-grid-rule rounded-[1.45rem] px-4 py-6 text-sm leading-7 text-[rgba(24,20,17,0.62)]">
                아직 저장된 교사 판단이 없습니다.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="viva-panel rounded-[1.85rem] px-5 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="viva-caption">Missing Concepts</p>
              <h2 className="mt-2 text-[1.8rem] font-semibold text-[var(--foreground)]">
                자주 빠지는 개념
              </h2>
            </div>
            <StatusBadge tone="warning">Top 6</StatusBadge>
          </div>
          <div className="mt-5 grid gap-3">
            {summary.topMissingConcepts.length > 0 ? (
              summary.topMissingConcepts.map((item) => (
                <div
                  key={item.label}
                  className="viva-stat flex items-center justify-between rounded-[1.35rem] px-4 py-3"
                >
                  <span className="text-sm font-semibold text-[rgba(24,20,17,0.76)]">
                    {item.label}
                  </span>
                  <span className="text-lg font-semibold text-[var(--foreground)]">
                    {item.count}
                  </span>
                </div>
              ))
            ) : (
              <div className="viva-grid-rule rounded-[1.45rem] px-4 py-6 text-sm leading-7 text-[rgba(24,20,17,0.62)]">
                아직 누락 개념 집계가 없습니다.
              </div>
            )}
          </div>
        </article>

        <article className="viva-panel rounded-[1.85rem] px-5 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="viva-caption">Misconception Clusters</p>
              <h2 className="mt-2 text-[1.8rem] font-semibold text-[var(--foreground)]">
                반복 오개념
              </h2>
            </div>
            <StatusBadge tone="danger">Top 6</StatusBadge>
          </div>
          <div className="mt-5 grid gap-3">
            {summary.topMisconceptions.length > 0 ? (
              summary.topMisconceptions.map((item) => (
                <div
                  key={item.label}
                  className="viva-stat flex items-center justify-between rounded-[1.35rem] px-4 py-3"
                >
                  <span className="text-sm font-semibold text-[rgba(24,20,17,0.76)]">
                    {item.label}
                  </span>
                  <span className="text-lg font-semibold text-[var(--foreground)]">
                    {item.count}
                  </span>
                </div>
              ))
            ) : (
              <div className="viva-grid-rule rounded-[1.45rem] px-4 py-6 text-sm leading-7 text-[rgba(24,20,17,0.62)]">
                아직 오개념 집계가 없습니다.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="viva-panel rounded-[1.9rem] px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="viva-caption">Recent Verifications</p>
            <h2 className="mt-2 text-[1.8rem] font-semibold text-[var(--foreground)]">
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
                className="viva-grid-rule grid gap-4 rounded-[1.45rem] px-4 py-4 md:grid-cols-[1fr_auto_auto]"
              >
                <div>
                  <p className="text-base font-semibold text-[var(--foreground)]">
                    {item.assignmentTitle}
                  </p>
                  <p className="mt-2 text-xs tracking-[0.08em] text-[rgba(24,20,17,0.46)]">
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
                <p className="text-sm text-[rgba(24,20,17,0.66)]">
                  {formatDateTime(item.updatedAt)}
                </p>
              </div>
            ))
          ) : (
            <div className="viva-grid-rule rounded-[1.45rem] px-4 py-6 text-sm leading-7 text-[rgba(24,20,17,0.62)]">
              아직 저장된 검증 세션이 없습니다. 교사 워크벤치에서 질문을 생성하면
              이곳에 최근 활동이 표시됩니다.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
