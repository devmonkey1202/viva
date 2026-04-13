"use client";

import { useMemo, useState } from "react";

import { CoachTour } from "@/components/coach-tour";
import { Field, SurfaceCard } from "@/components/ui-blocks";
import {
  normalizeWorkspaceSettings,
  persistWorkspaceSettings,
  type WorkspaceSettings,
  type WorkspaceSettingsSnapshot,
} from "@/lib/workspace-settings";

type RuntimeSummary = {
  aiConfigured: boolean;
  managedDatabase: boolean;
  aiFastModel: string;
  aiReasoningModel: string;
  storeMode: string;
};

type SettingsPanelProps = {
  runtime: RuntimeSummary;
  initialSettings: WorkspaceSettingsSnapshot;
};

export function SettingsPanel({
  runtime,
  initialSettings,
}: SettingsPanelProps) {
  const [settingsState, setSettingsState] = useState<WorkspaceSettingsSnapshot>(
    normalizeWorkspaceSettings(initialSettings),
  );

  const updateSettings = (
    updater: (current: WorkspaceSettings) => WorkspaceSettings,
  ) => {
    setSettingsState((current) =>
      persistWorkspaceSettings({
        ...updater({
          voiceEnabled: current.voiceEnabled,
          textOnly: current.textOnly,
          allowFallback: current.allowFallback,
          defaultExportFormat: current.defaultExportFormat,
          retentionDays: current.retentionDays,
        }),
        savedAt: new Date().toISOString(),
      }),
    );
  };

  const policySummary = useMemo(() => {
    if (settingsState.textOnly || !settingsState.voiceEnabled) {
      return "다음 검증 세션은 학생 텍스트 답변만 받는 기준으로 시작합니다.";
    }

    return "다음 검증 세션은 텍스트와 음성(STT) 답변을 모두 허용합니다.";
  }, [settingsState.textOnly, settingsState.voiceEnabled]);

  return (
    <div className="section-stack">
      <CoachTour
        storageKey="viva:onboarding:settings"
        tone="settings"
        steps={[
          {
            selector: '[data-tour="settings-defaults"]',
            title: "먼저 세션 기본값을 정합니다",
            description: "응답 방식, 대체 경로, export 형식만 정해도 다음 세션 시작이 빨라집니다.",
            placement: "bottom",
          },
          {
            selector: '[data-tour="settings-runtime"]',
            title: "현재 연결 상태를 확인합니다",
            description: "AI와 저장소가 어떤 경로로 동작 중인지 여기서 바로 확인합니다.",
            placement: "top",
          },
        ]}
      />

      <div data-tour="settings-defaults">
        <SurfaceCard
          eyebrow="작업 기본값"
          title="다음 검증 세션의 기본값"
          description="다음 세션 시작 시 기본값으로 반영됩니다."
        >
        <div className="split-grid">
          <Field label="음성 답변 허용">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={settingsState.voiceEnabled}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    voiceEnabled: event.target.checked,
                    textOnly: event.target.checked ? current.textOnly : false,
                  }))
                }
              />
              <span>학생이 브라우저 STT로 음성 답변을 남길 수 있게 합니다.</span>
            </label>
          </Field>
          <Field label="텍스트만 허용">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={settingsState.textOnly}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    textOnly: event.target.checked,
                    voiceEnabled: event.target.checked ? false : current.voiceEnabled,
                  }))
                }
              />
              <span>학생 세션을 텍스트 답변 전용으로 시작합니다.</span>
            </label>
          </Field>
        </div>

        <div className="split-grid">
          <Field label="AI 대체 경로 허용">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={settingsState.allowFallback}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    allowFallback: event.target.checked,
                  }))
                }
              />
              <span>실제 AI 호출이 막히면 대체 경로로 흐름을 유지합니다.</span>
            </label>
          </Field>
          <Field label="기본 export 형식">
            <div className="select-shell">
              <select
                value={settingsState.defaultExportFormat}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    defaultExportFormat: event.target.value as "csv" | "json",
                  }))
                }
                className="form-input form-select"
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
          </Field>
        </div>

        <Field
          label="세션 보관 기준(일)"
          helper="새 세션 시작 시 참고하는 기본값입니다."
        >
          <input
            type="number"
            min="1"
            value={settingsState.retentionDays}
            onChange={(event) =>
              updateSettings((current) => ({
                ...current,
                retentionDays: event.target.value,
              }))
            }
            className="form-input"
          />
        </Field>

        <div className="summary-box">
          <p className="summary-box__label">현재 정책 요약</p>
          <p className="summary-box__body">{policySummary}</p>
          <p className="helper-text">
            {settingsState.savedAt
              ? `마지막 저장 ${new Date(settingsState.savedAt).toLocaleString("ko-KR")}`
              : "아직 저장 기록이 없습니다."}
          </p>
        </div>
        </SurfaceCard>
      </div>

      <div data-tour="settings-runtime">
        <SurfaceCard
          eyebrow="환경 상태"
          title="현재 배포 환경 연결"
          description="AI와 저장소 연결 상태 요약입니다."
        >
        <div className="metric-grid">
          <div className="metric-card">
            <p className="metric-card__label">AI 연결</p>
            <p className="metric-card__value">
              {runtime.aiConfigured ? "연결됨" : "대체 경로 사용"}
            </p>
            <p className="metric-card__note">{runtime.aiFastModel}</p>
          </div>
          <div className="metric-card">
            <p className="metric-card__label">분석 모델</p>
            <p className="metric-card__value">{runtime.aiReasoningModel}</p>
            <p className="metric-card__note">질문 생성과 분석 단계에 사용합니다.</p>
          </div>
          <div className="metric-card">
            <p className="metric-card__label">저장 방식</p>
            <p className="metric-card__value">
              {runtime.managedDatabase ? "관리형 DB" : "로컬 저장소"}
            </p>
            <p className="metric-card__note">{runtime.storeMode}</p>
          </div>
        </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
