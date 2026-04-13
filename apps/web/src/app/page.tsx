import Link from "next/link";

import { AppHeader } from "@/components/app-header";
import { StatusBadge } from "@/components/status-badge";
import { MetricCard, PageIntro, SurfaceCard } from "@/components/ui-blocks";

const principles = [
  {
    title: "제출물마다 다른 질문을 만듭니다.",
    body: "고정 질문지가 아니라 제출물, 루브릭, 위험 신호를 함께 보고 학생별 검증 질문 3개를 만듭니다.",
  },
  {
    title: "점수보다 근거를 먼저 보여줍니다.",
    body: "빠진 개념, 충돌 문장, 설명 실패 지점을 구조화해서 교사가 빠르게 읽고 결정할 수 있게 만듭니다.",
  },
  {
    title: "최종 판단은 교사가 맡습니다.",
    body: "VIVA는 자동 채점기가 아니라 검증 인프라입니다. 판단의 책임과 맥락은 교사에게 남겨둡니다.",
  },
];

const steps = [
  "교사가 과제, 루브릭, 제출물을 입력합니다.",
  "VIVA가 학생별 검증 질문 3개를 만듭니다.",
  "학생이 짧고 분명하게 답합니다.",
  "제출물, 질문, 답변, 루브릭을 함께 비교합니다.",
  "교사가 근거를 보고 최종 판단합니다.",
];

const roles = [
  {
    label: "교사",
    title: "질문 생성부터 최종 판단까지 관리합니다.",
    body: "과제 기준을 입력하고, 학생별 질문을 생성하고, 분석 근거를 확인해 최종 판단을 남깁니다.",
    action: { href: "/login?next=/teacher", label: "교사 워크벤치" },
  },
  {
    label: "학생",
    title: "짧고 분명한 답으로 이해를 설명합니다.",
    body: "질문 3개에 텍스트 또는 음성으로 답하고, 필요한 경우 이유와 조건을 짧게 덧붙입니다.",
  },
  {
    label: "운영자",
    title: "반복되는 오개념과 패턴을 확인합니다.",
    body: "분류 분포, 교사 판단, 누락 개념, 반복 오개념을 한 화면에서 요약해 봅니다.",
    action: { href: "/login?next=/operator", label: "운영 요약" },
  },
];

export default function Home() {
  return (
    <main className="app-shell app-shell--landing">
      <AppHeader
        current="landing"
        utility={
          <Link href="/login" className="button button--ghost button--compact">
            워크스페이스 로그인
          </Link>
        }
      />

      <div className="page-stack page-stack--landing">
        <PageIntro
          variant="landing"
          className="landing-hero"
          eyebrow="Submission Verification Layer"
          title="결과물이 아니라 이해를 다시 확인합니다."
          description="VIVA는 제출 이후 학생이 실제로 이해했는지 검증하는 평가 레이어입니다. LMS도, AI 튜터도, 탐지기도 아닌 교사 중심 검증 도구입니다."
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
            <div className="landing-hero__aside">
              <div className="badge-row">
                <StatusBadge tone="accent">검증 질문 생성</StatusBadge>
                <StatusBadge tone="info">근거 구조화</StatusBadge>
                <StatusBadge tone="success">교사 최종 판단</StatusBadge>
              </div>
              <div className="metric-grid metric-grid--compact">
                <MetricCard label="질문 구조" value="3문항" note="왜형, 전이형, 반례형" />
                <MetricCard
                  label="판단 구조"
                  value="AI + 교사"
                  note="AI가 근거를 정리하고 교사가 최종 판단합니다."
                />
                <MetricCard
                  label="결과 출력"
                  value="CSV / JSON"
                  note="운영 요약과 세션 export를 지원합니다."
                />
              </div>
              <div className="landing-hero__art" aria-hidden="true">
                <div className="landing-hero__panel landing-hero__panel--primary" />
                <div className="landing-hero__panel landing-hero__panel--secondary" />
                <div className="landing-hero__panel landing-hero__panel--tertiary" />
                <div className="landing-hero__ring" />
                <div className="landing-hero__dot" />
              </div>
            </div>
          }
        />

        <section className="landing-story-grid">
          <SurfaceCard
            eyebrow="Why Now"
            title="AI를 써도 이해는 직접 확인해야 합니다."
            description="과제 결과만 보고는 학생이 스스로 설명할 수 있는지, 조건이 바뀌어도 개념을 유지하는지 알기 어렵습니다."
          >
            <div className="token-row">
              {["LMS 아님", "AI 튜터 아님", "탐지기 아님"].map((item) => (
                <span key={item} className="token-chip">
                  {item}
                </span>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard
            tone="accent"
            eyebrow="What Changes"
            title="교사는 읽기와 판단에만 집중할 수 있습니다."
            description="질문 생성, 학생 링크, 분석 근거, 운영 요약이 하나의 흐름으로 이어져 판단 속도를 높입니다."
          >
            <div className="badge-row">
              <StatusBadge tone="accent">검증 질문 생성</StatusBadge>
              <StatusBadge tone="info">근거 구조화</StatusBadge>
              <StatusBadge tone="success">교사 최종 판단</StatusBadge>
            </div>
          </SurfaceCard>
        </section>

        <section className="section-stack">
          <div className="section-block__heading">
            <p className="eyebrow">Principles</p>
            <h2 className="section-headline">점수보다 구조와 근거가 먼저 보이게 설계합니다.</h2>
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
            <h2 className="section-headline">실사용 흐름은 다섯 단계로 끝납니다.</h2>
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
            <h2 className="section-headline">같은 브랜드 안에서 목적이 다른 화면으로 나눕니다.</h2>
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

        <section className="landing-proof-strip">
          <div className="landing-proof-strip__copy">
            <p className="eyebrow">Built For Delivery</p>
            <h2 className="section-headline">
              질문 생성, 학생 제출, 교사 판단, 운영 요약이 실제 서비스 흐름으로 이어집니다.
            </h2>
            <p className="body-copy">
              VIVA는 데모 화면이 아니라 배포 가능한 검증 도구를 목표로 설계했습니다. 교사와 학생의 마찰은 낮추고,
              운영자가 반복 오개념을 읽는 흐름까지 한 제품 안에 넣습니다.
            </p>
          </div>
          <div className="landing-proof-strip__actions">
            <Link href="/login?next=/teacher" className="button button--primary">
              교사로 시작하기
            </Link>
            <Link href="/settings" className="button button--ghost">
              검증 기본값 보기
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
