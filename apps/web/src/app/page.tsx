import Link from "next/link";

import { AppHeader } from "@/components/app-header";
import { StatusBadge } from "@/components/status-badge";
import { MetricCard, PageIntro, SurfaceCard } from "@/components/ui-blocks";

const principles = [
  {
    title: "제출물마다 다른 검증 질문을 만듭니다.",
    body: "고정 질문 세트가 아니라 제출물, 루브릭, 위험 신호를 함께 보고 왜형, 전이형, 반례형 질문을 생성합니다.",
  },
  {
    title: "점수보다 근거를 먼저 봅니다.",
    body: "누락 개념, 충돌 문장, 재설명 포인트, 위험 신호를 구조화해 교사가 빠르게 판단하게 합니다.",
  },
  {
    title: "최종 판단은 교사가 맡습니다.",
    body: "VIVA는 자동 채점기가 아니라 검증 레이어입니다. 최종 책임과 판단은 교사에게 남깁니다.",
  },
];

const steps = [
  "교사가 과제, 루브릭, 제출물을 정리합니다.",
  "VIVA가 학생별 질문 3개를 생성합니다.",
  "학생은 짧고 명확하게 답변합니다.",
  "제출물, 질문, 답변, 루브릭을 함께 비교합니다.",
  "교사가 근거를 보고 최종 판단합니다.",
];

const roles = [
  {
    label: "교사",
    title: "질문 생성과 최종 판단을 맡습니다.",
    body: "과제 기준을 입력하고 학생별 질문을 생성한 뒤, 분석 근거와 충돌 지점을 검토해 최종 판단을 내립니다.",
    action: { href: "/login?next=/teacher", label: "교사 워크벤치" },
  },
  {
    label: "학생",
    title: "짧고 분명한 답변으로 이해를 설명합니다.",
    body: "학생 전용 화면에서 질문 3개에 답합니다. 길이보다 이유와 조건을 분명히 쓰는 것이 중요합니다.",
  },
  {
    label: "운영자",
    title: "반복되는 오개념과 패턴을 봅니다.",
    body: "분석 분포, 교사 판단, 누락 개념, 반복 오개념을 운영자 요약 화면에서 확인합니다.",
    action: { href: "/login?next=/operator", label: "운영 요약" },
  },
];

export default function Home() {
  return (
    <main className="app-shell">
      <AppHeader
        current="landing"
        utility={
          <Link href="/login" className="button button--ghost button--compact">
            워크스페이스 로그인
          </Link>
        }
      />

      <div className="page-stack">
        <PageIntro
          eyebrow="Submission Verification Layer"
          title="결과물이 아니라 이해를 다시 확인합니다"
          description="VIVA는 제출 이후 학생이 실제로 이해했는지 검증하는 교육 평가 레이어입니다. LMS도 아니고, AI 튜터도 아니고, AI 탐지기도 아닙니다."
          actions={
            <div className="button-row">
              <Link href="/login?next=/teacher" className="button button--primary">
                교사 워크벤치
              </Link>
              <Link href="/login?next=/operator" className="button button--secondary">
                운영 요약 보기
              </Link>
            </div>
          }
          meta={
            <div className="metric-grid metric-grid--compact">
              <MetricCard label="질문 구조" value="3문항" note="왜형, 전이형, 반례형" />
              <MetricCard
                label="판단 구조"
                value="AI + 교사"
                note="AI는 근거를 정리하고 교사가 최종 결정합니다."
              />
              <MetricCard
                label="결과 출력"
                value="CSV / JSON"
                note="운영 요약과 세션 export를 지원합니다."
              />
            </div>
          }
        />

        <div className="landing-grid">
          <SurfaceCard
            tone="muted"
            eyebrow="What VIVA Is Not"
            title="학습 플랫폼을 또 하나 만드는 프로젝트가 아닙니다."
            description="과제 제출 이후 학생의 진짜 이해를 보여주는 검증 레이어입니다."
          >
            <div className="token-row">
              {["LMS 아님", "AI 튜터 아님", "AI 탐지기 아님"].map((item) => (
                <span key={item} className="token-chip">
                  {item}
                </span>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard
            tone="accent"
            eyebrow="What VIVA Does"
            title="교사가 더 빠르고 더 근거 있게 판단하게 만듭니다."
            description="질문 생성, 답변 수집, 분석, 오개념 요약까지 연결해 판단 근거와 운영 인사이트를 한 흐름으로 만듭니다."
          >
            <div className="badge-row">
              <StatusBadge tone="accent">검증 질문 생성</StatusBadge>
              <StatusBadge tone="info">근거 구조화</StatusBadge>
              <StatusBadge tone="success">교사 최종 판단</StatusBadge>
            </div>
          </SurfaceCard>
        </div>

        <section className="section-stack">
          <div className="section-block__heading">
            <p className="eyebrow">Principles</p>
            <h2 className="section-headline">
              판단이 빨라지도록 구조를 먼저 보이게 합니다
            </h2>
          </div>
          <div className="landing-card-grid">
            {principles.map((item) => (
              <SurfaceCard key={item.title} title={item.title}>
                <p className="body-copy">{item.body}</p>
              </SurfaceCard>
            ))}
          </div>
        </section>

        <section className="section-stack">
          <div className="section-block__heading">
            <p className="eyebrow">Workflow</p>
            <h2 className="section-headline">
              실제 사용 흐름은 다섯 단계로 이어집니다
            </h2>
          </div>
          <div className="step-list">
            {steps.map((step, index) => (
              <div key={step} className="step-list__item">
                <span className="step-list__index">{index + 1}</span>
                <p className="body-copy">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section-stack">
          <div className="section-block__heading">
            <p className="eyebrow">Surfaces</p>
            <h2 className="section-headline">
              사용자마다 보는 화면과 목적이 다릅니다
            </h2>
          </div>
          <div className="landing-card-grid">
            {roles.map((role) => (
              <SurfaceCard
                key={role.label}
                eyebrow={role.label}
                title={role.title}
                description={role.body}
              >
                {role.action ? (
                  <Link href={role.action.href} className="button button--ghost">
                    {role.action.label}
                  </Link>
                ) : (
                  <p className="helper-text">
                    학생 화면은 교사가 생성한 세션 링크로 진입합니다.
                  </p>
                )}
              </SurfaceCard>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
