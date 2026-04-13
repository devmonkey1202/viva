"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const logout = () => {
    setErrorMessage(null);

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/auth/logout", {
            method: "POST",
          });

          if (!response.ok) {
            throw new Error("로그아웃에 실패했습니다.");
          }

          router.push("/login");
          router.refresh();
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "로그아웃 중 오류가 발생했습니다.",
          );
        }
      })();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={logout}
        disabled={isPending}
        className="button button--ghost button--compact"
      >
        {isPending ? "로그아웃 중..." : "로그아웃"}
      </button>
      {errorMessage ? <span className="helper-text">{errorMessage}</span> : null}
    </>
  );
}
