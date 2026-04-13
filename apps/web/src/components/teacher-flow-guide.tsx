import { StatusBadge } from "@/components/status-badge";
import { SurfaceCard } from "@/components/ui-blocks";
import { cx } from "@/lib/cx";

type TeacherFlowGuideStep = {
  key: string;
  title: string;
  description: string;
  status: "complete" | "current" | "pending";
  note?: string;
  action?: React.ReactNode;
};

type TeacherFlowGuideProps = {
  steps: TeacherFlowGuideStep[];
};

const stepTone = {
  complete: "success",
  current: "accent",
  pending: "neutral",
} as const;

const stepLabel = {
  complete: "완료",
  current: "현재 단계",
  pending: "대기",
} as const;

export function TeacherFlowGuide({ steps }: TeacherFlowGuideProps) {
  return (
    <SurfaceCard
      eyebrow="Flow Guide"
      title="지금 어디까지 왔는지와 다음 행동을 한 화면에서 봅니다."
      description="교사용 흐름은 입력, 질문 생성, 학생 응답 수집, 분석, 최종 판단 순서로 이어집니다."
    >
      <div className="flow-guide">
        {steps.map((step, index) => (
          <section
            key={step.key}
            className={cx("flow-guide__step", `flow-guide__step--${step.status}`)}
          >
            <div className="flow-guide__head">
              <div className="flow-guide__index">{index + 1}</div>
              <div className="flow-guide__copy">
                <p className="flow-guide__title">{step.title}</p>
                <p className="flow-guide__description">{step.description}</p>
              </div>
              <StatusBadge tone={stepTone[step.status]}>
                {stepLabel[step.status]}
              </StatusBadge>
            </div>
            {step.note ? <p className="flow-guide__note">{step.note}</p> : null}
            {step.action ? <div className="button-row">{step.action}</div> : null}
          </section>
        ))}
      </div>
    </SurfaceCard>
  );
}
