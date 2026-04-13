import Link from "next/link";

import { AppHeader } from "@/components/app-header";
import { StatusBadge } from "@/components/status-badge";

const validationSignals = [
  {
    label: "학생별 질문",
    value: "3개",
    body: "왜형, 전이형, 반례형 질문으로 이해를 다시 묻습니다.",
  },
  {
    label: "교사 판단",
    value: "최종 승인",
    body: "AI는 근거를 구조화하고, 최종 판단은 교사가 맡습니다.",
  },
  {
    label: "운영 요약",
    value: "패턴 추적",
    body: "반복 오개념과 누락 개념을 운영 화면에서 바로 확인합니다.",
  },
];

const frictionPoints = [
  {
    title: "결과물만으로는 이해를 알 수 없습니다.",
    body: "문장을 잘 썼는지와 개념을 설명할 수 있는지는 다릅니다.",
  },
  {
    title: "교사는 다시 묻기 위한 구조가 필요합니다.",
    body: "질문 생성, 답변 수집, 근거 비교가 한 흐름으로 이어져야 합니다.",
  },
  {
    title: "운영자는 반복 패턴까지 읽어야 합니다.",
    body: "학생 개인 판정에서 끝나지 않고 수업 전체의 붕괴 지점을 봐야 합니다.",
  },
];

const flow = [
  {
    index: "01",
    title: "과제 기준 입력",
    body: "교사가 과제 설명, 루브릭, 제출물을 넣습니다.",
  },
  {
    index: "02",
    title: "질문 생성",
    body: "제출물 기반으로 학생별 검증 질문 3개를 만듭니다.",
  },
  {
    index: "03",
    title: "학생 답변",
    body: "학생은 텍스트 또는 음성으로 짧고 분명하게 답합니다.",
  },
  {
    index: "04",
    title: "근거 비교",
    body: "제출물, 질문, 답변, 루브릭을 함께 비교합니다.",
  },
  {
    index: "05",
    title: "교사 판단",
    body: "교사는 근거를 읽고 최종 판단을 남깁니다.",
  },
];

const surfaces = [
  {
    label: "Teacher",
    title: "질문 생성부터 최종 판단까지 한 화면에서 처리합니다.",
    body: "교사는 입력, 학생 링크, 분석, 판단, 최근 세션을 끊기지 않는 흐름으로 다룹니다.",
    href: "/login?next=/teacher",
    cta: "교사 워크벤치",
    tone: "teacher",
  },
  {
    label: "Student",
    title: "학생은 부담 없이 짧게 답하고 끝낼 수 있어야 합니다.",
    body: "모바일 우선 화면에서 질문 3개에 답하고, 필요하면 음성으로도 응답합니다.",
    href: null,
    cta: "교사 링크로 진입",
    tone: "student",
  },
  {
    label: "Operator",
    title: "운영자는 개별 사례보다 패턴을 먼저 읽습니다.",
    body: "분류 분포, 교사 판단, 누락 개념, 반복 오개념을 한 화면에서 요약합니다.",
    href: "/login?next=/operator",
    cta: "운영 요약",
    tone: "operator",
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
        <section className="landing-hero-2">
          <div className="landing-hero-2__copy">
            <p className="eyebrow">Submission Verification Layer</p>
            <h1 className="landing-hero-2__title">
              제출 이후의
              <br />
              이해를
              <br />
              다시 확인합니다.
            </h1>
            <p className="landing-hero-2__description">
              VIVA는 결과물을 평가하는 화면이 아니라, 학생이 실제로 이해했는지 교사가 다시 검증할 수 있게
              만드는 제품입니다. LMS도, AI 튜터도, 탐지기도 아닙니다.
            </p>
            <div className="button-row">
              <Link href="/login?next=/teacher" className="button button--primary">
                교사 워크벤치
              </Link>
              <Link href="/login?next=/operator" className="button button--secondary">
                운영 요약 보기
              </Link>
            </div>
            <div className="badge-row">
              <StatusBadge tone="accent">검증 질문 생성</StatusBadge>
              <StatusBadge tone="info">근거 구조화</StatusBadge>
              <StatusBadge tone="success">교사 최종 판단</StatusBadge>
            </div>
          </div>

          <div className="landing-hero-2__visual" aria-hidden="true">
            <div className="landing-hero-2__glass landing-hero-2__glass--a" />
            <div className="landing-hero-2__glass landing-hero-2__glass--b" />
            <div className="landing-hero-2__glass landing-hero-2__glass--c" />
            <div className="landing-hero-2__signal landing-hero-2__signal--a" />
            <div className="landing-hero-2__signal landing-hero-2__signal--b" />
            <div className="landing-hero-2__signal landing-hero-2__signal--c" />
            <div className="landing-hero-2__card landing-hero-2__card--primary">
              <span>질문 생성</span>
              <strong>학생별 3문항</strong>
            </div>
            <div className="landing-hero-2__card landing-hero-2__card--secondary">
              <span>근거 비교</span>
              <strong>빠진 개념과 충돌 문장</strong>
            </div>
            <div className="landing-hero-2__card landing-hero-2__card--accent">
              <span>최종 판단</span>
              <strong>교사 승인 구조</strong>
            </div>
          </div>
        </section>

        <section className="landing-proof-grid">
          {validationSignals.map((item) => (
            <article key={item.label} className="landing-proof-card">
              <p className="landing-proof-card__label">{item.label}</p>
              <strong className="landing-proof-card__value">{item.value}</strong>
              <p className="landing-proof-card__body">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="landing-contrast">
          <div className="landing-contrast__intro">
            <p className="eyebrow">Why This Product Exists</p>
            <h2 className="landing-contrast__title">결과물은 보이지만, 이해는 그대로 드러나지 않습니다.</h2>
            <p className="landing-contrast__description">
              VIVA는 학생이 제출한 결과물을 다시 설명하게 만들고, 교사가 빠르게 판단할 수 있도록 질문과 근거를
              구조화합니다.
            </p>
          </div>
          <div className="landing-contrast__grid">
            {frictionPoints.map((item) => (
              <article key={item.title} className="landing-contrast__item">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-flow-2">
          <div className="section-block__heading">
            <p className="eyebrow">Flow</p>
            <h2 className="section-headline">교사와 학생의 흐름은 다섯 단계로 닫힙니다.</h2>
          </div>
          <div className="landing-flow-2__grid">
            {flow.map((item) => (
              <article key={item.index} className="landing-flow-2__item">
                <span>{item.index}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-surface-grid">
          {surfaces.map((item) => (
            <article key={item.label} className={`landing-surface-card landing-surface-card--${item.tone}`}>
              <p className="eyebrow">{item.label}</p>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              {item.href ? (
                <Link href={item.href} className="button button--ghost">
                  {item.cta}
                </Link>
              ) : (
                <span className="landing-surface-card__note">{item.cta}</span>
              )}
            </article>
          ))}
        </section>

        <section className="landing-cta-band">
          <div className="landing-cta-band__copy">
            <p className="eyebrow">Ready To Verify</p>
            <h2 className="landing-cta-band__title">교사는 더 빨리 읽고, 학생은 더 짧게 설명하고, 운영자는 패턴을 더 빨리 찾습니다.</h2>
          </div>
          <div className="landing-cta-band__actions">
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
