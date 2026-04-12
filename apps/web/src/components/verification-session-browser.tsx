"use client";

import { useEffect, useState, useTransition } from "react";

import { StatusBadge } from "@/components/status-badge";
import { EmptyState, Field } from "@/components/ui-blocks";
import {
  analysisClassificationMeta,
  formatDateTime,
  teacherDecisionMeta,
} from "@/lib/presentation";
import type { ListVerificationsResponse, VerificationListItem } from "@/lib/schemas";

type VerificationSessionBrowserProps = {
  activeVerificationId: string | null;
  onSelectVerification: (verificationId: string) => void;
};

export function VerificationSessionBrowser({
  activeVerificationId,
  onSelectVerification,
}: VerificationSessionBrowserProps) {
  const [query, setQuery] = useState("");
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

  return (
    <div className="stack-grid">
      <Field
        label="세션 검색"
        helper="과제명, 개념, 세션 ID 일부로 최근 세션을 찾습니다."
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="form-input"
          placeholder="예: 이진 탐색, verificationId"
        />
      </Field>

      {errorMessage ? <div className="inline-alert">{errorMessage}</div> : null}

      {items.length > 0 ? (
        <div className="stack-grid">
          {items.map((item) => (
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
                  {item.classification ? (
                    <StatusBadge
                      tone={analysisClassificationMeta[item.classification].tone}
                    >
                      {analysisClassificationMeta[item.classification].label}
                    </StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">분석 전</StatusBadge>
                  )}
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
          ))}
        </div>
      ) : (
        <EmptyState
          title="조건에 맞는 세션이 없습니다."
          description="질문 생성 이후 세션이 누적되면 여기서 최근 기록을 다시 불러올 수 있습니다."
        />
      )}
    </div>
  );
}
