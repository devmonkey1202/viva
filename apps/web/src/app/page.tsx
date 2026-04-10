import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";

const principles = [
  {
    index: "01",
    title: "질문이 학생마다 달라야 한다",
    body: "VIVA는 고정 문제 세트가 아니라 제출물과 루브릭을 함께 읽고, 왜형·전이형·반례형 질문을 새로 구성합니다.",
  },
  {
    index: "02",
    title: "점수보다 증거가 먼저 와야 한다",
    body: "결과는 점수 한 줄이 아니라 누락 개념, 충돌 문장, 재설명 포인트, 교사용 요약으로 제시됩니다.",
  },
  {
    index: "03",
    title: "교사가 최종 판단을 가져야 한다",
    body: "AI는 자동 채점자가 아니라 검증 엔진입니다. 최종 판단과 피드백 책임은 언제나 교사에게 남깁니다.",
  },
];

const tracks = [
  {
    label: "Teacher Track",
    title: "교사는 제출 이후의 이해 붕괴 지점을 빠르게 잡습니다.",
    body: "과제와 루브릭을 넣고, 학생 제출물을 기준으로 검증 질문을 생성한 뒤, 답변을 근거 중심으로 읽습니다.",
    href: "/teacher",
    action: "교사 워크벤치",
  },
  {
    label: "Operator Track",
    title: "운영자는 반복 오개념과 후속 개입 지점을 봅니다.",
    body: "개별 세션을 넘어 반과 과정 단위의 누락 개념, 오개념, 교사 판단 분포를 요약해서 확인합니다.",
    href: "/operator",
    action: "운영자 요약",
  },
];

const flow = [
  "과제와 루브릭 등록",
  "제출물 기반 질문 3개 생성",
  "학생의 짧은 답변 수집",
  "제출물·질문·답변 삼자 비교",
  "교사 최종 판단 및 export",
];

export default function Home() {
  return (
    <main className="viva-page py-4 sm:py-6">
      <section className="viva-panel viva-reveal-1 rounded-[2rem] px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        <div className="grid gap-8 xl:grid-cols-[1.22fr_0.78fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="viva-kicker">
                <span className="viva-signal-dot" />
                viva voce verification
              </span>
              <StatusBadge tone="neutral">AI 시대 교육 검증 레이어</StatusBadge>
            </div>

            <div className="space-y-5">
              <p className="viva-caption">Submission Aftercare</p>
              <h1 className="viva-display max-w-5xl text-[3.2rem] text-[var(--foreground)] sm:text-[4.2rem] lg:text-[5.5rem]">
                결과물이 아니라
                <br />
                <span className="text-[var(--accent)]">이해의 증거</span>를
                남깁니다.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-[rgba(24,20,17,0.74)] sm:text-lg">
                VIVA는 LMS도, AI 튜터도, AI 탐지기도 아닙니다. 제출 이후에
                학생이 정말로 이해했는지를 짧고 정교한 검증 흐름으로 드러내는
                교육용 검증 시스템입니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/teacher" className="viva-button-primary">
                교사 워크벤치 열기
              </Link>
              <Link href="/operator" className="viva-button-secondary">
                운영자 대시보드 열기
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "질문 축", value: "3 types" },
                { label: "판정 구조", value: "AI + Teacher" },
                { label: "내보내기", value: "JSON / CSV" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="viva-stat rounded-[1.5rem] px-4 py-4"
                >
                  <p className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-[rgba(24,20,17,0.52)]">
                    {item.label}
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <article className="viva-panel-soft rounded-[1.8rem] px-5 py-5">
              <p className="viva-caption">Core Promise</p>
              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                  <p className="text-sm leading-7 text-[rgba(24,20,17,0.74)]">
                    학생별 제출물에 맞는 질문을 생성합니다.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--signal)]" />
                  <p className="text-sm leading-7 text-[rgba(24,20,17,0.74)]">
                    답변을 근거 중심으로 구조화해 교사가 읽기 쉽게 보여줍니다.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--gold)]" />
                  <p className="text-sm leading-7 text-[rgba(24,20,17,0.74)]">
                    운영자는 누적 결과에서 반복 오개념과 후속 개입 포인트를
                    확인합니다.
                  </p>
                </div>
              </div>
            </article>

            <article className="viva-grid-rule rounded-[1.8rem] px-5 py-5">
              <p className="viva-caption">Flow</p>
              <div className="mt-4 grid gap-4">
                {flow.map((item, index) => (
                  <div key={item} className="grid grid-cols-[auto_1fr] gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(125,46,42,0.2)] bg-[rgba(125,46,42,0.08)] text-sm font-extrabold text-[var(--accent)]">
                        {index + 1}
                      </div>
                      {index < flow.length - 1 ? (
                        <div className="mt-2 h-full w-px bg-[rgba(44,32,19,0.16)]" />
                      ) : null}
                    </div>
                    <p className="pb-4 text-sm leading-7 text-[rgba(24,20,17,0.72)]">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {principles.map((item, index) => (
          <article
            key={item.index}
            className={`viva-panel rounded-[1.8rem] px-5 py-6 viva-reveal-${Math.min(
              index + 1,
              3,
            )}`}
          >
            <p className="viva-caption">{item.index}</p>
            <h2 className="mt-4 text-[1.6rem] font-semibold leading-tight text-[var(--foreground)]">
              {item.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[rgba(24,20,17,0.72)]">
              {item.body}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {tracks.map((item, index) => (
          <article
            key={item.label}
            className={`viva-panel rounded-[1.9rem] px-6 py-6 viva-reveal-${Math.min(
              index + 2,
              3,
            )}`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge tone={index === 0 ? "accent" : "success"}>
                {item.label}
              </StatusBadge>
            </div>
            <h2 className="mt-5 max-w-2xl text-[2rem] font-semibold leading-tight text-[var(--foreground)]">
              {item.title}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[rgba(24,20,17,0.72)]">
              {item.body}
            </p>
            <div className="mt-6">
              <Link href={item.href} className="viva-button-ghost">
                {item.action}
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
