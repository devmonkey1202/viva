import Link from "next/link";

import { AppHeader } from "@/components/app-header";
import { AuthUtility } from "@/components/auth-utility";
import { CoachTour } from "@/components/coach-tour";
import { StatusBadge } from "@/components/status-badge";
import { MetricCard, PageIntro, SurfaceCard } from "@/components/ui-blocks";
import {
  analysisClassificationMeta,
  formatDateTime,
  teacherDecisionMeta,
} from "@/lib/presentation";
import { requirePageRole } from "@/lib/server-auth";
import { getRuntimeStatus } from "@/lib/runtime-config";
import { getOperatorSummary } from "@/lib/verification-store";

export const dynamic = "force-dynamic";

export default async function OperatorPage() {
  const session = await requirePageRole("/operator", "operator");
  const summary = await getOperatorSummary();
  const runtime = getRuntimeStatus();

  return (
    <main className="app-shell app-shell--operator">
      <AppHeader
        current="operator"
        utility={
          <div className="button-row">
            <Link href="/api/export?format=csv" className="button button--ghost button--compact">
              CSV 내보내기
            </Link>
            <Link href="/api/export?format=json" className="button button--ghost button--compact">
              JSON 내보내기
            </Link>
            <AuthUtility role={session.role} />
          </div>
        }
      />

      <div className="page-stack page-stack--operator">
        <div data-tour="operator-intro">
          <PageIntro
            variant="operator"
            eyebrow="운영 대시보드"
            title="반복 오개념과 누락 지점을 먼저 봅니다"
            description="개별 세션보다 패턴 해석에 집중하는 화면입니다."
            actions={
              <div className="button-row">
                <Link href="/teacher" className="button button--primary">
                  교사 화면으로 이동
                </Link>
              </div>
            }
            meta={
              <div className="badge-row">
                <StatusBadge tone={runtime.managedDatabase ? "success" : "warning"}>
                  {runtime.managedDatabase ? "관리형 DB" : "로컬 저장소"}
                </StatusBadge>
                <StatusBadge tone="neutral">
                  갱신 {formatDateTime(summary.generatedAt)}
                </StatusBadge>
              </div>
            }
          />
        </div>

        <CoachTour
          storageKey="viva:onboarding:operator"
          tone="operator"
          steps={[
            {
              selector: '[data-tour="operator-intro"]',
              title: "운영 화면은 패턴부터 읽습니다",
              description: "개별 세션보다 분포와 변화가 먼저 보이도록 구성했습니다.",
              placement: "bottom",
            },
            {
              selector: '[data-tour="operator-metrics"]',
              title: "먼저 전체 규모를 확인합니다",
              description: "총 세션 수, 분석 완료 수, 교사 판단 완료 수로 현재 진행량을 봅니다.",
              placement: "bottom",
            },
            {
              selector: '[data-tour="operator-distribution"]',
              title: "다음은 AI 분포를 읽습니다",
              description: "uncertain과 misconception이 몰린 구간부터 먼저 해석하면 됩니다.",
              placement: "right",
            },
            {
              selector: '[data-tour="operator-recent"]',
              title: "마지막으로 최근 세션을 확인합니다",
              description: "이상 징후가 보이면 최신 세션 상세로 내려가 근거를 다시 확인합니다.",
              placement: "top",
            },
          ]}
        />

        <div className="metric-grid" data-tour="operator-metrics">
          <MetricCard
            label="총 검증 세션"
            value={summary.totalVerifications}
            note="질문이 생성된 전체 세션 수"
          />
          <MetricCard
            label="분석 완료"
            value={summary.analyzedVerifications}
            note="학생 답변과 분석이 저장된 세션 수"
          />
          <MetricCard
            label="교사 판단 완료"
            value={summary.teacherDecisions}
            note="최종 판단까지 저장된 세션 수"
          />
        </div>

        <div className="operator-grid">
          <SurfaceCard
            eyebrow="AI 분포"
            title="AI 분류 분포"
            description="현재 세션의 이해 상태 분포입니다."
          >
            <div data-tour="operator-distribution">
              {summary.classificationCounts.length > 0 ? (
                <div className="stack-grid">
                  {summary.classificationCounts.map((item) => {
                    const meta =
                      analysisClassificationMeta[
                        item.label as keyof typeof analysisClassificationMeta
                      ];

                    return (
                      <div key={item.label} className="list-row">
                        <div className="list-row__copy">
                          <p className="list-row__title">{meta?.label ?? item.label}</p>
                          <p className="list-row__body">
                            {meta?.note ?? "분류 설명이 아직 없습니다."}
                          </p>
                        </div>
                        <strong className="list-row__value">{item.count}</strong>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="table-empty">아직 분석 결과가 없습니다.</div>
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard
            eyebrow="교사 판단"
            title="교사 최종 판단 분포"
            description="AI 결과와 별개로 교사 판단만 모아 봅니다."
          >
            {summary.teacherDecisionCounts.length > 0 ? (
              <div className="stack-grid">
                {summary.teacherDecisionCounts.map((item) => {
                  const meta =
                    teacherDecisionMeta[item.label as keyof typeof teacherDecisionMeta];

                  return (
                    <div key={item.label} className="list-row">
                      <div className="list-row__copy">
                        <p className="list-row__title">{meta?.label ?? item.label}</p>
                      </div>
                      <strong className="list-row__value">{item.count}</strong>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="table-empty">아직 교사 판단 기록이 없습니다.</div>
            )}
          </SurfaceCard>
        </div>

        <div className="operator-grid">
          <SurfaceCard
            eyebrow="누락 개념"
            title="자주 비는 핵심 개념"
            description="학생 답변에서 반복적으로 빠지는 개념입니다."
          >
            {summary.topMissingConcepts.length > 0 ? (
              <div className="stack-grid">
                {summary.topMissingConcepts.map((item) => (
                  <div key={item.label} className="list-row">
                    <div className="list-row__copy">
                      <p className="list-row__title">{item.label}</p>
                    </div>
                    <strong className="list-row__value">{item.count}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="table-empty">집계된 누락 개념이 없습니다.</div>
            )}
          </SurfaceCard>

          <SurfaceCard
            eyebrow="오개념"
            title="반복되는 오개념"
            description="수업 보완 우선순위를 정할 때 보는 목록입니다."
          >
            {summary.topMisconceptions.length > 0 ? (
              <div className="stack-grid">
                {summary.topMisconceptions.map((item) => (
                  <div key={item.label} className="list-row">
                    <div className="list-row__copy">
                      <p className="list-row__title">{item.label}</p>
                    </div>
                    <strong className="list-row__value">{item.count}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="table-empty">반복 오개념 데이터가 없습니다.</div>
            )}
          </SurfaceCard>
        </div>

        <SurfaceCard
          eyebrow="최근 세션"
          title="최신 검증 세션"
          description="최신 업데이트 순서로 확인합니다."
        >
          <div data-tour="operator-recent">
            {summary.recentVerifications.length > 0 ? (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>과제</th>
                      <th>AI 분류</th>
                      <th>교사 판단</th>
                      <th>업데이트</th>
                      <th>세션 ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentVerifications.map((item) => (
                      <tr key={item.verificationId}>
                        <td>
                          <Link
                            href={`/teacher/verifications/${item.verificationId}`}
                            className="table-primary"
                          >
                            {item.assignmentTitle}
                          </Link>
                        </td>
                        <td>
                          {item.classification ? (
                            <StatusBadge
                              tone={analysisClassificationMeta[item.classification].tone}
                            >
                              {analysisClassificationMeta[item.classification].label}
                            </StatusBadge>
                          ) : (
                            <span className="table-muted">분석 전</span>
                          )}
                        </td>
                        <td>
                          {item.teacherDecision ? (
                            <StatusBadge tone={teacherDecisionMeta[item.teacherDecision].tone}>
                              {teacherDecisionMeta[item.teacherDecision].label}
                            </StatusBadge>
                          ) : (
                            <span className="table-muted">판단 전</span>
                          )}
                        </td>
                        <td>{formatDateTime(item.updatedAt)}</td>
                        <td className="mono-text">{item.verificationId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="table-empty">
                아직 기록된 검증 세션이 없습니다. 교사 화면에서 질문을 생성하면
                여기로 이어집니다.
              </div>
            )}
          </div>
        </SurfaceCard>
      </div>
    </main>
  );
}
