export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-8 rounded-[36px] border border-white/70 bg-white/84 px-6 py-8 shadow-[0_35px_90px_rgba(28,37,54,0.08)] backdrop-blur lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:py-12">
        <div className="space-y-6">
          <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-orange-700 uppercase">
            Submission-based verification layer
          </div>
          <div className="space-y-4">
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
              AI 시대에도 학생의{" "}
              <span className="font-serif italic text-orange-700">
                진짜 이해
              </span>
              를 증명하게 만듭니다.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-slate-600">
              VIVA는 AI가 만든 결과물을 잡는 도구가 아니라, 제출물 이후의
              짧은 검증을 통해 학생이 실제로 이해했는지를 교사가 판단할 수 있게
              만드는 교육 검증 서비스입니다.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <a
              href="/teacher"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              교사 워크벤치 열기
            </a>
            <a
              href="#service-flow"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-4 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
            >
              핵심 흐름 보기
            </a>
          </div>
        </div>

        <div className="grid gap-4 rounded-[30px] bg-[linear-gradient(180deg,rgba(255,249,242,0.95),rgba(244,248,255,0.95))] p-5">
          {[
            {
              title: "교사 입력",
              body: "과제, 루브릭, 핵심 개념과 취약 포인트를 넣습니다.",
            },
            {
              title: "질문 생성",
              body: "왜형, 전이형, 반례형 질문 3개를 제출물 기반으로 생성합니다.",
            },
            {
              title: "이해 분석",
              body: "학생 답변을 제출물과 루브릭에 비추어 근거 중심으로 구조화합니다.",
            },
            {
              title: "교사 판단",
              body: "빠진 개념과 충돌 문장을 보고 교사가 최종 판단합니다.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[24px] border border-white/90 bg-white/80 px-5 py-4"
            >
              <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                {item.title}
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="service-flow"
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
      >
        {[
          {
            index: "01",
            title: "LMS가 아닌 검증 레이어",
            body: "제출 이후의 이해 검증에만 집중해 제품 정체성을 선명하게 유지합니다.",
          },
          {
            index: "02",
            title: "질문은 학생마다 다르게",
            body: "고정 문제 세트가 아니라 제출물과 루브릭에 맞춘 질문 3개를 만듭니다.",
          },
          {
            index: "03",
            title: "점수보다 근거",
            body: "빠진 개념, 충돌 문장, 재설명 포인트를 중심으로 결과를 보여줍니다.",
          },
          {
            index: "04",
            title: "교사가 최종 판단",
            body: "AI는 자동 채점자가 아니라 교사의 검증 품질을 높이는 보조 엔진입니다.",
          },
        ].map((item) => (
          <article
            key={item.index}
            className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(20,28,45,0.05)]"
          >
            <p className="text-sm font-semibold tracking-[0.2em] text-orange-600 uppercase">
              {item.index}
            </p>
            <h2 className="mt-4 text-2xl font-semibold text-slate-950">
              {item.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
