import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { AnalysisEvidenceReview } from "@/components/analysis-evidence-review";
import { AppHeader } from "@/components/app-header";
import { AuthUtility } from "@/components/auth-utility";
import { QuestionSetPreview } from "@/components/question-set-preview";
import { SessionTimeline } from "@/components/session-timeline";
import { StatusBadge } from "@/components/status-badge";
import { StudentAnswerReview } from "@/components/student-answer-review";
import { MetricCard, PageIntro, SurfaceCard } from "@/components/ui-blocks";
import {
  analysisClassificationMeta,
  buildStudentVerificationPath,
  formatDateTime,
  teacherDecisionMeta,
} from "@/lib/presentation";
import { readVivaRoleFromCookies } from "@/lib/auth";
import { getVerificationRecord } from "@/lib/verification-store";

export const dynamic = "force-dynamic";

type TeacherVerificationDetailPageProps = {
  params: Promise<{
    verificationId: string;
  }>;
};

export default async function TeacherVerificationDetailPage({
  params,
}: TeacherVerificationDetailPageProps) {
  const { verificationId } = await params;
  const verification = await getVerificationRecord(verificationId);

  if (!verification) {
    notFound();
  }

  const role = readVivaRoleFromCookies(await cookies());
  const preferredFormat = verification.sessionPreferences.preferredExportFormat;
  const exportHref = `/api/export?format=${preferredFormat}&verificationId=${verification.verificationId}`;

  return (
    <main className="app-shell app-shell--teacher">
      <AppHeader
        current="teacher"
        utility={role ? <AuthUtility role={role} /> : undefined}
      />
      <div className="page-stack page-stack--teacher">
        <PageIntro
          eyebrow="Verification Detail"
          title={verification.assignmentTitle}
          description="세션 상세, 학생 답변, 분석 근거, 교사 판단, export를 한 화면에서 확인합니다."
          actions={
            <div className="button-row">
              <Link href="/teacher" className="button button--ghost">
                교사 워크벤치
              </Link>
              <Link
                href={buildStudentVerificationPath(verification.verificationId)}
                target="_blank"
                className="button button--secondary"
              >
                학생 화면 열기
              </Link>
              <Link href={exportHref} className="button button--primary">
                세션 export
              </Link>
            </div>
          }
          meta={
            <div className="badge-row">
              <StatusBadge tone="neutral">{verification.verificationId}</StatusBadge>
              <StatusBadge tone="info">
                업데이트 {formatDateTime(verification.updatedAt)}
              </StatusBadge>
              <StatusBadge tone="neutral">
                {verification.sessionPreferences.studentResponseMode === "voice_or_text"
                  ? "텍스트 + 음성 응답"
                  : "텍스트 응답만"}
              </StatusBadge>
              {verification.analysisReport ? (
                <StatusBadge
                  tone={
                    analysisClassificationMeta[
                      verification.analysisReport.classification
                    ].tone
                  }
                >
                  {
                    analysisClassificationMeta[
                      verification.analysisReport.classification
                    ].label
                  }
                </StatusBadge>
              ) : null}
              {verification.teacherDecision ? (
                <StatusBadge
                  tone={teacherDecisionMeta[verification.teacherDecision.decision].tone}
                >
                  {teacherDecisionMeta[verification.teacherDecision.decision].label}
                </StatusBadge>
              ) : null}
            </div>
          }
        />

        <div className="metric-grid">
          <MetricCard
            label="생성 시각"
            value={formatDateTime(verification.createdAt)}
            note="세션이 처음 만들어진 시점"
          />
          <MetricCard
            label="질문 모델"
            value={verification.questionSet.modelVersion}
            note="질문 생성에 사용한 모델"
          />
          <MetricCard
            label="분석 모델"
            value={verification.analysisReport?.modelVersion ?? "없음"}
            note="아직 분석 전이면 비어 있습니다."
          />
          <MetricCard
            label="기본 export"
            value={verification.sessionPreferences.preferredExportFormat.toUpperCase()}
            note="이 세션의 기본 export 형식"
          />
        </div>

        <div className="teacher-layout">
          <div className="teacher-layout__main">
            <SurfaceCard
              eyebrow="Question Set"
              title="질문 세트"
              description="이 세션에 저장된 학생 검증 질문입니다."
            >
              <QuestionSetPreview questionSet={verification.questionSet} />
            </SurfaceCard>

            <SurfaceCard
              eyebrow="Student Answers"
              title="학생 답변"
              description="서면 답변과 음성 전사 메타를 함께 확인합니다."
            >
              <StudentAnswerReview
                questionSet={verification.questionSet}
                studentAnswers={verification.studentAnswers ?? []}
              />
            </SurfaceCard>

            <SurfaceCard
              eyebrow="Analysis"
              title="분석 근거"
              description="AI 분류, 근거, 누락 개념, 충돌 지점을 검토합니다."
            >
              <AnalysisEvidenceReview analysisReport={verification.analysisReport ?? null} />
            </SurfaceCard>
          </div>

          <div className="teacher-layout__side">
            <SurfaceCard
              eyebrow="Teacher Decision"
              title="교사 최종 판단"
              description="이 세션에 저장된 최종 판단 기록입니다."
            >
              {verification.teacherDecision ? (
                <div className="summary-box">
                  <div className="badge-row">
                    <StatusBadge
                      tone={teacherDecisionMeta[verification.teacherDecision.decision].tone}
                    >
                      {teacherDecisionMeta[verification.teacherDecision.decision].label}
                    </StatusBadge>
                    <StatusBadge tone="neutral">
                      {formatDateTime(verification.teacherDecision.decidedAt)}
                    </StatusBadge>
                  </div>
                  <p className="summary-box__body">{verification.teacherDecision.notes}</p>
                </div>
              ) : (
                <p className="helper-text">아직 저장된 교사 판단이 없습니다.</p>
              )}
            </SurfaceCard>

            <SurfaceCard
              eyebrow="Assignment Summary"
              title="과제와 루브릭"
              description="검증의 기준이 되는 과제 정보입니다."
            >
              <div className="detail-list">
                <p className="detail-list__title">과제 설명</p>
                <p className="body-copy">{verification.assignmentDescription}</p>
              </div>
              <div className="detail-list">
                <p className="detail-list__title">핵심 개념</p>
                <ul className="detail-list__items">
                  {verification.rubricCoreConcepts.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="detail-list">
                <p className="detail-list__title">위험 신호</p>
                {verification.rubricRiskPoints.length > 0 ? (
                  <ul className="detail-list__items">
                    {verification.rubricRiskPoints.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="helper-text">추가 위험 신호는 기록하지 않았습니다.</p>
                )}
              </div>
            </SurfaceCard>

            <SurfaceCard
              eyebrow="Activity"
              title="세션 기록"
              description="질문 생성, 분석, 판단 흐름을 시간순으로 봅니다."
            >
              <SessionTimeline
                verificationId={verification.verificationId}
                activity={verification.activity}
              />
            </SurfaceCard>
          </div>
        </div>
      </div>
    </main>
  );
}
