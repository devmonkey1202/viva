"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import type { VivaRole } from "@/lib/auth";
import { sanitizeNextPath, vivaRoleMeta } from "@/lib/auth";

const roleOptions = Object.keys(vivaRoleMeta) as VivaRole[];

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedRole, setSelectedRole] = useState<VivaRole>("teacher");
  const [accessCode, setAccessCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nextPath = sanitizeNextPath(searchParams.get("next"));

  const login = (role: VivaRole) => {
    setSelectedRole(role);
    setErrorMessage(null);

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role,
              accessCode: accessCode.trim() || undefined,
              nextPath:
                nextPath === "/teacher" && role === "operator"
                  ? vivaRoleMeta[role].defaultPath
                  : nextPath,
            }),
          });

          const payload = (await response.json()) as {
            message?: string;
            nextPath?: string;
          };

          if (!response.ok) {
            throw new Error(payload.message ?? "로그인에 실패했습니다.");
          }

          router.push(payload.nextPath ?? vivaRoleMeta[role].defaultPath);
          router.refresh();
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "로그인 중 오류가 발생했습니다.",
          );
        }
      })();
    });
  };

  return (
    <div className="stack-grid">
      <div className="surface-card surface-card--muted">
        <div className="surface-card__copy">
          <p className="eyebrow">접속 코드</p>
          <h2 className="section-title">배포에 코드가 설정된 경우만 입력합니다.</h2>
          <p className="section-description">
            접속 코드가 없는 배포는 데모 모드로 동작합니다. 코드가 설정된 배포에서는 역할별 코드가 필요합니다.
          </p>
        </div>
        <label className="field-shell">
          <span className="field-shell__label">접속 코드</span>
          <input
            type="password"
            value={accessCode}
            onChange={(event) => setAccessCode(event.target.value)}
            className="form-input"
            placeholder="필요한 경우만 입력"
            autoComplete="current-password"
          />
        </label>
      </div>

      <div className="landing-card-grid">
        {roleOptions.map((role) => (
          <button
            key={role}
            type="button"
            className="surface-card surface-card--muted role-choice"
            data-active={selectedRole === role}
            onClick={() => login(role)}
            disabled={isPending}
          >
            <div className="surface-card__copy">
              <p className="eyebrow">접속 역할</p>
              <h2 className="section-title">{vivaRoleMeta[role].label}</h2>
              <p className="section-description">{vivaRoleMeta[role].description}</p>
            </div>
            <span className="button button--primary button--full">
              {isPending && selectedRole === role ? "접속 중..." : "이 역할로 시작"}
            </span>
          </button>
        ))}
      </div>
      {errorMessage ? <div className="inline-alert">{errorMessage}</div> : null}
    </div>
  );
}
