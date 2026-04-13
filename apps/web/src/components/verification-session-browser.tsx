"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { StatusBadge } from "@/components/status-badge";
import { EmptyState, Field } from "@/components/ui-blocks";
import {
  analysisClassificationMeta,
  formatDateTime,
  teacherDecisionMeta,
} from "@/lib/presentation";
import type { ListVerificationsResponse, VerificationListItem } from "@/lib/schemas";
import {
  type VerificationSessionFilter,
  getVerificationSessionFilter,
  matchesVerificationSessionFilter,
} from "@/lib/verification-list";

type VerificationSessionBrowserProps = {
  activeVerificationId: string | null;
  onSelectVerification: (verificationId: string) => void;
};

const sessionFilterMeta: Array<{
  value: VerificationSessionFilter;
  label: string;
}> = [
  { value: "all", label: "전체" },
  { value: "awaiting_answers", label: "학생 응답 대기" },
  { value: "analysis_ready", label: "분석 완료" },
  { value: "decision_complete", label: "교사 판단 완료" },
];

const sessionFilterLabel: Record<
  Exclude<VerificationSessionFilter, "all">,
  string
> = {
  awaiting_answers: "학생 응답 대기",
  analysis_ready: "분석 완료",
  decision_complete: "교사 판단 완료",
};

export function VerificationSessionBrowser({
  activeVerificationId,
  onSelectVerification,
}: VerificationSessionBrowserProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<VerificationSessionFilter>("all");
  const [items, setItems] = useState<VerificationListItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const controller = new AbortController();

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(
            `/api/verifications?limit=10&query=${encodeURIComponent(query)}`,
            {
              cache: "no-store",
              signal: controller.signal,
            },
          );

          if (!response.ok) {
            const error = (await response.json()) as { message?: string };
            throw new Error(error.message ?? "세션 목록을 불러오지 못했습니다.");
          }

          const payload = (await response.json()) as ListVerificationsResponse;
          setItems(payload.items);
          setErrorMessage(null);
        } catch (error) {
          if ((error as Error).name === "AbortError") {
            return;
          }

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "세션 목록 조회 중 오류가 발생했습니다.",
          );
        }
      })();
    });

    return () => controller.abort();
  }, [query]);

  const filteredItems = useMemo(
    () => items.filter((item) => matchesVerificationSessionFilter(item, filter)),
    [filter, items],
  );

  return (
    <div className="stack-grid">
      <Field
        label="세션 검색"
        helper="과제명, 개념, verificationId로 최근 세션을 찾습니다."
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="form-input"
          placeholder="예: 이진 탐색, verificationId"
        />
      </Field>

      <div className="session-browser-toolbar">
        <div className="session-browser-filters">
          {sessionFilterMeta.map((item) => (
            <button
              key={item.value}
              type="button"
              className="button button--ghost button--compact"
              data-active={filter === item.value}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="session-browser-summary">
          {filteredItems.length}개 세션
        </p>
      </div>

      {errorMessage ? <div className="inline-alert">{errorMessage}</div> : null}

      {filteredItems.length > 0 ? (
        <div className="stack-grid">
          {filteredItems.map((item) => {
            const sessionFilter = getVerificationSessionFilter(item);

            return (
              <button
                key={item.verificationId}
                type="button"
                className="session-browser-item"
                data-active={item.verificationId === activeVerificationId}
                onClick={() => onSelectVerification(item.verificationId)}
                disabled={isPending}
              >
                <div className="session-browser-item__head">
                  <strong>{item.assignmentTitle}</strong>
                  <div className="badge-row">
                    <StatusBadge tone="neutral">
                      {sessionFilterLabel[sessionFilter]}
                    </StatusBadge>
                    {item.classification ? (
                      <StatusBadge
                        tone={analysisClassificationMeta[item.classification].tone}
                      >
                        {analysisClassificationMeta[item.classification].label}
                      </StatusBadge>
                    ) : null}
                    {item.teacherDecision ? (
                      <StatusBadge tone={teacherDecisionMeta[item.teacherDecision].tone}>
                        {teacherDecisionMeta[item.teacherDecision].label}
                      </StatusBadge>
                    ) : null}
                  </div>
                </div>
                <div className="session-browser-item__meta">
                  <span>{formatDateTime(item.updatedAt)}</span>
                  <span className="mono-text">{item.verificationId}</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="조건에 맞는 세션이 없습니다."
          description="검색어나 상태 필터를 바꿔 보거나, 새 세션을 생성해 흐름을 다시 시작하세요."
        />
      )}
    </div>
  );
}

