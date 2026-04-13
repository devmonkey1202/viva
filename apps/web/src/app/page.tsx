import Link from "next/link";

import { AppHeader } from "@/components/app-header";
import { StatusBadge } from "@/components/status-badge";

const proofPoints = [
  {
    label: "질문 생성",
    value: "학생별 3문항",
    body: "제출물, 루브릭, 위험 신호를 함께 보고 학생마다 다른 검증 질문을 만듭니다.",
  },
  {
    label: "근거 비교",
    value: "충돌 지점 추적",
    body: "제출물과 답변 사이에서 비어 있는 개념, 설명 실패, 논리 충돌을 먼저 보여줍니다.",
  },
  {
    label: "최종 판단",
    value: "교사가 결정",
    body: "VIVA는 점수 도구가 아니라 판단 도구입니다. 책임과 맥락은 교사에게 남깁니다.",
  },
];

const contrasts = [
  {
    title: "결과물만 보면 이해가 보이지 않습니다.",
    body: "좋아 보이는 제출물과 실제 이해는 다를 수 있습니다. VIVA는 제출 이후의 설명 가능성을 다시 묻습니다.",
  },
  {
    title: "교사는 다시 묻기 위한 구조가 필요합니다.",
    body: "질문 생성, 응답 수집, 근거 비교, 최종 판단이 한 흐름 안에서 끊기지 않아야 합니다.",
  },
  {
    title: "운영자는 반복 패턴을 봐야 합니다.",
    body: "개별 답변이 아니라 어떤 개념에서 이해가 계속 무너지는지까지 읽혀야 합니다.",
  },
];

const flow = [
  {
    index: "01",
    title: "기준 입력",
    body: "교사가 과제, 루브릭, 제출물을 한 화면에서 정리합니다.",
  },
  {
    index: "02",
    title: "질문 생성",
    body: "학생별로 왜형, 전이형, 반례형 질문이 생성됩니다.",
  },
  {
    index: "03",
    title: "학생 응답",
    body: "학생은 모바일에서 텍스트나 음성으로 짧고 분명하게 답합니다.",
  },
  {
    index: "04",
    title: "근거 비교",
    body: "제출물, 질문, 답변, 루브릭을 함께 비교해 비어 있는 부분을 드러냅니다.",
  },
  {
    index: "05",
    title: "교사 판단",
    body: "교사는 근거와 위험 신호를 보고 최종 결정을 남깁니다.",
  },
];

const rolePanels = [
  {
    label: "교사",
    title: "질문 생성부터 최종 판단까지 한 흐름으로 관리합니다.",
    body: "입력, 질문 생성, 학생 링크, 분석, 최종 판단, 세션 재열람까지 교사용 워크벤치에서 이어집니다.",
    note: "과제 기준을 잡고, 링크를 배포하고, 근거를 확인한 뒤 판단합니다.",
    href: "/login?next=/teacher",
    cta: "교사용 워크스페이스",
    tone: "teacher",
  },
  {
    label: "학생",
    title: "학생은 부담 없이 짧고 분명하게 설명합니다.",
    body: "학생 화면은 로그인 없이 링크로 열리고, 질문 세 개만 답하면 흐름이 끝납니다.",
    note: "모바일 우선, 음성 fallback 지원, 제출 완료 상태까지 한 화면에서 처리합니다.",
    href: null,
    cta: "교사가 공유한 링크로 응답",
    tone: "student",
  },
  {
    label: "운영자",
    title: "운영자는 반복되는 오개념과 누락 패턴을 먼저 봅니다.",
    body: "개별 학생보다 분포와 패턴을 읽어 수업 보완 포인트를 빠르게 찾게 합니다.",
    note: "분류 분포, 교사 판단, 누락 개념, 최근 세션을 같은 맥락에서 읽습니다.",
    href: "/login?next=/operator",
    cta: "운영 대시보드",
    tone: "operator",
  },
];

const previewPanels = [
  {
    label: "교사 화면",
    title: "입력, 질문, 링크, 근거, 판단",
    body: "좌측은 기준 입력, 우측은 세션 제어와 결과 검토가 이어지는 워크벤치입니다.",
    lines: ["질문 생성", "학생 링크 공유", "근거 비교", "최종 판단"],
    tone: "teacher",
  },
  {
    label: "학생 화면",
    title: "질문 3개만 답하는 모바일 플로우",
    body: "학생은 길게 배우지 않습니다. 지금 이해한 내용을 짧게 설명하는 데 집중합니다.",
    lines: ["진행률 표시", "음성 입력", "텍스트 fallback", "제출 완료"],
    tone: "student",
  },
  {
    label: "운영자 화면",
    title: "패턴과 반복을 읽는 운영 화면",
    body: "수치 카드보다 분포, 누락 개념, 최근 세션을 먼저 보여주는 운영 surface입니다.",
    lines: ["분류 분포", "교사 판단", "누락 개념", "최근 세션"],
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
        <section className="landing-hero">
          <div className="landing-hero__copy">
            <p className="eyebrow">제출 이후 이해 검증 레이어</p>
            <h1 className="landing-hero__title">
              제출은 끝났고,
              <br />
              이해는 아직
              <br />
              확인되지 않았습니다.
            </h1>
            <p className="landing-hero__description">
              VIVA는 결과물을 의심하는 서비스가 아니라, 학생이 실제로 이해했는지를 다시 묻게 만드는
              검증 제품입니다. 질문 생성, 근거 비교, 교사 판단이 하나의 흐름으로 이어집니다.
            </p>
            <div className="landing-hero__actions">
              <Link href="/login?next=/teacher" className="button button--primary">
                교사용 워크스페이스
              </Link>
              <Link href="/login?next=/operator" className="button button--secondary">
                운영 흐름 보기
              </Link>
            </div>
            <div className="badge-row">
              <StatusBadge tone="accent">질문 생성</StatusBadge>
              <StatusBadge tone="info">근거 구조화</StatusBadge>
              <StatusBadge tone="success">교사 최종 판단</StatusBadge>
            </div>
          </div>

          <div className="landing-stage" aria-hidden="true">
            <div className="landing-stage__halo landing-stage__halo--blue" />
            <div className="landing-stage__halo landing-stage__halo--mint" />
            <div className="landing-stage__halo landing-stage__halo--peach" />
            <div className="landing-stage__plane landing-stage__plane--main">
              <span>검증 세션</span>
              <strong>질문, 답변, 근거, 판단이 한 surface 안에 정렬됩니다.</strong>
              <div className="landing-stage__line-grid">
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="landing-stage__plane landing-stage__plane--top">
              <span>교사</span>
              <strong>질문 생성</strong>
            </div>
            <div className="landing-stage__plane landing-stage__plane--side">
              <span>운영자</span>
              <strong>패턴 읽기</strong>
            </div>
            <div className="landing-stage__metric landing-stage__metric--left">
              <p>질문 세트</p>
              <strong>학생별 3문항</strong>
            </div>
            <div className="landing-stage__metric landing-stage__metric--right">
              <p>판단 구조</p>
              <strong>근거 우선</strong>
            </div>
          </div>
        </section>

        <section className="landing-proof-grid">
          {proofPoints.map((item) => (
            <article key={item.label} className="landing-proof-card">
              <p className="landing-proof-card__label">{item.label}</p>
              <strong className="landing-proof-card__value">{item.value}</strong>
              <p className="landing-proof-card__body">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="landing-band">
          <div className="landing-band__intro">
            <p className="eyebrow">Why VIVA</p>
            <h2 className="landing-band__title">
              점수보다 먼저 봐야 하는 것은
              <br />
              설명의 구조와 근거입니다.
            </h2>
            <p className="landing-band__description">
              잘 만든 제출물과 실제 이해는 다를 수 있습니다. VIVA는 학생에게 다시 묻고, 교사에게는
              바로 판단 가능한 구조를 제공합니다.
            </p>
          </div>
          <div className="landing-band__grid">
            {contrasts.map((item) => (
              <article key={item.title} className="landing-band__card">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-flow">
          <div className="section-block__heading">
            <p className="eyebrow">실사용 흐름</p>
            <h2 className="section-headline">실사용 흐름은 다섯 단계로 끝납니다.</h2>
          </div>
          <div className="landing-flow__grid">
            {flow.map((item) => (
              <article key={item.index} className="landing-flow__item">
                <span>{item.index}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-role-grid">
          {rolePanels.map((item) => (
            <article key={item.label} className={`landing-role-card landing-role-card--${item.tone}`}>
              <p className="eyebrow">{item.label}</p>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <small>{item.note}</small>
              {item.href ? (
                <Link href={item.href} className="button button--ghost">
                  {item.cta}
                </Link>
              ) : (
                <span className="landing-role-card__hint">{item.cta}</span>
              )}
            </article>
          ))}
        </section>

        <section className="landing-preview">
          <div className="section-block__heading">
            <p className="eyebrow">화면 구조</p>
            <h2 className="section-headline">같은 브랜드 안에서 목적이 다른 화면으로 나뉩니다.</h2>
          </div>
          <div className="landing-preview__grid">
            {previewPanels.map((item) => (
              <article key={item.label} className={`landing-preview-card landing-preview-card--${item.tone}`}>
                <div className="landing-preview-card__screen">
                  <div className="landing-preview-card__screen-top" />
                  <div className="landing-preview-card__screen-body">
                    <div className="landing-preview-card__screen-main">
                      <i />
                      <i />
                      <i />
                    </div>
                    <div className="landing-preview-card__screen-side">
                      <i />
                      <i />
                    </div>
                  </div>
                </div>
                <p className="eyebrow">{item.label}</p>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <ul className="landing-preview-card__list">
                  {item.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-cta">
          <div className="landing-cta__copy">
            <p className="eyebrow">Ready To Start</p>
            <h2 className="landing-cta__title">
              교사는 기준을 잡고,
              <br />
              학생은 짧게 설명하고,
              <br />
              운영자는 패턴을 읽습니다.
            </h2>
          </div>
          <div className="landing-cta__actions">
            <Link href="/login?next=/teacher" className="button button--primary">
              교사 워크스페이스
            </Link>
            <Link href="/settings" className="button button--ghost">
              기본 설정 보기
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
