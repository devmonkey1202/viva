"use client";

import { useEffect, useMemo, useState } from "react";

import { Field, SurfaceCard } from "@/components/ui-blocks";

type RuntimeSummary = {
  aiConfigured: boolean;
  managedDatabase: boolean;
  aiFastModel: string;
  aiReasoningModel: string;
  storeMode: string;
};

type SettingsPanelProps = {
  runtime: RuntimeSummary;
};

type LocalSettingsState = {
  voiceEnabled: boolean;
  textOnly: boolean;
  allowFallback: boolean;
  defaultExportFormat: "csv" | "json";
  retentionDays: string;
};

type SettingsSnapshot = LocalSettingsState & {
  savedAt: string | null;
};

const settingsStorageKey = "viva:workspace-settings";

const defaultSettings: LocalSettingsState = {
  voiceEnabled: true,
  textOnly: false,
  allowFallback: true,
  defaultExportFormat: "csv",
  retentionDays: "30",
};

const createDefaultSnapshot = (): SettingsSnapshot => ({
  ...defaultSettings,
  savedAt: null,
});

const readStoredSettings = (): SettingsSnapshot => {
  if (typeof window === "undefined") {
    return createDefaultSnapshot();
  }

  try {
    const raw = window.localStorage.getItem(settingsStorageKey);
    if (!raw) {
      return createDefaultSnapshot();
    }

    const parsed = JSON.parse(raw) as Partial<SettingsSnapshot>;

    return {
      voiceEnabled: parsed.voiceEnabled ?? defaultSettings.voiceEnabled,
      textOnly: parsed.textOnly ?? defaultSettings.textOnly,
      allowFallback: parsed.allowFallback ?? defaultSettings.allowFallback,
      defaultExportFormat:
        parsed.defaultExportFormat ?? defaultSettings.defaultExportFormat,
      retentionDays: parsed.retentionDays ?? defaultSettings.retentionDays,
      savedAt: parsed.savedAt ?? null,
    };
  } catch {
    window.localStorage.removeItem(settingsStorageKey);
    return createDefaultSnapshot();
  }
};

export function SettingsPanel({ runtime }: SettingsPanelProps) {
  const [settingsState, setSettingsState] =
    useState<SettingsSnapshot>(readStoredSettings);

  const {
    voiceEnabled,
    textOnly,
    allowFallback,
    defaultExportFormat,
    retentionDays,
    savedAt,
  } = settingsState;

  useEffect(() => {
    window.localStorage.setItem(settingsStorageKey, JSON.stringify(settingsState));
  }, [settingsState]);

  const updateSettings = (
    updater: (current: LocalSettingsState) => LocalSettingsState,
  ) => {
    setSettingsState((current) => ({
      ...updater({
        voiceEnabled: current.voiceEnabled,
        textOnly: current.textOnly,
        allowFallback: current.allowFallback,
        defaultExportFormat: current.defaultExportFormat,
        retentionDays: current.retentionDays,
      }),
      savedAt: new Date().toISOString(),
    }));
  };

  const policySummary = useMemo(() => {
    if (textOnly) {
      return "학생 답변은 텍스트 입력만 허용합니다.";
    }

    if (!voiceEnabled) {
      return "학생 답변은 텍스트 입력 중심으로 수집합니다.";
    }

    return "학생 답변은 텍스트와 음성 전사를 함께 허용합니다.";
  }, [textOnly, voiceEnabled]);

  return (
    <div className="section-stack">
      <SurfaceCard
        eyebrow="Workspace Defaults"
        title="검증 기본값"
        description="이 브라우저에서 사용할 기본 검증 정책을 관리합니다."
      >
        <div className="split-grid">
          <Field label="음성 답변 허용">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    voiceEnabled: event.target.checked,
                    textOnly: event.target.checked ? current.textOnly : false,
                  }))
                }
              />
              <span>학생 음성 답변과 STT 전사를 허용합니다.</span>
            </label>
          </Field>
          <Field label="텍스트만 허용">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={textOnly}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    textOnly: event.target.checked,
                    voiceEnabled: event.target.checked
                      ? false
                      : current.voiceEnabled,
                  }))
                }
              />
              <span>학생 답변을 텍스트로만 받습니다.</span>
            </label>
          </Field>
        </div>

        <div className="split-grid">
          <Field label="AI fallback 허용">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={allowFallback}
                onChange={(event) =>
                  updateSettings((current) => ({
                    ...current,
                    allowFallback: event.target.checked,
                  }))
                }
              />
              <span>AI 호출 실패 시 mock fallback을 허용합니다.</span>
            </label>
          </Field>
          <Field label="기본 export 형식">
            <select
              value={defaultExportFormat}
              onChange={(event) =>
                updateSettings((current) => ({
                  ...current,
                  defaultExportFormat: event.target.value as "csv" | "json",
                }))
              }
              className="form-input"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </Field>
        </div>

        <Field label="세션 보관 일수" helper="로컬 기본 정책입니다.">
          <input
            type="number"
            min="1"
            value={retentionDays}
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
            {savedAt
              ? `최근 저장 ${new Date(savedAt).toLocaleString("ko-KR")}`
              : "아직 저장 기록이 없습니다."}
          </p>
        </div>
      </SurfaceCard>

      <SurfaceCard
        eyebrow="Runtime"
        title="현재 런타임 상태"
        description="배포 환경과 AI, 저장소 연결 상태를 요약합니다."
      >
        <div className="metric-grid">
          <div className="metric-card">
            <p className="metric-card__label">AI 연결</p>
            <p className="metric-card__value">
              {runtime.aiConfigured ? "Configured" : "Not configured"}
            </p>
            <p className="metric-card__note">{runtime.aiFastModel}</p>
          </div>
          <div className="metric-card">
            <p className="metric-card__label">추론 모델</p>
            <p className="metric-card__value">{runtime.aiReasoningModel}</p>
            <p className="metric-card__note">질문 생성과 분석에 사용</p>
          </div>
          <div className="metric-card">
            <p className="metric-card__label">저장 방식</p>
            <p className="metric-card__value">
              {runtime.managedDatabase ? "Managed DB" : "Local store"}
            </p>
            <p className="metric-card__note">{runtime.storeMode}</p>
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}
