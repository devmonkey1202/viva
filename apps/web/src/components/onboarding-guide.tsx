"use client";

import { useCallback, useEffect, useState } from "react";

type OnboardingStep = {
  title: string;
  description: string;
};

type OnboardingGuideProps = {
  storageKey: string;
  eyebrow: string;
  title: string;
  description: string;
  steps: OnboardingStep[];
  tone?: "default" | "teacher" | "operator" | "settings";
};

export function OnboardingGuide({
  storageKey,
  eyebrow,
  title,
  description,
  steps,
  tone = "default",
}: OnboardingGuideProps) {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(storageKey) === "dismissed");
    } catch {
      setDismissed(false);
    } finally {
      setReady(true);
    }
  }, [storageKey]);

  const handleDismiss = useCallback(() => {
    try {
      window.localStorage.setItem(storageKey, "dismissed");
    } catch {}

    setDismissed(true);
  }, [storageKey]);

  useEffect(() => {
    if (!ready || dismissed) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleDismiss();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismissed, handleDismiss, ready]);

  if (!ready || dismissed) {
    return null;
  }

  return (
    <section className="onboarding-layer" role="dialog" aria-modal="true">
      <div className="onboarding-layer__backdrop" onClick={handleDismiss} />
      <div className={`onboarding-layer__panel onboarding-layer__panel--${tone}`}>
        <div className="onboarding-guide__head">
          <div className="onboarding-guide__copy">
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="section-title">{title}</h2>
            <p className="section-description">{description}</p>
          </div>
          <button
            type="button"
            className="button button--ghost button--compact"
            onClick={handleDismiss}
          >
            닫기
          </button>
        </div>

        <div className="onboarding-guide__grid">
          {steps.map((step, index) => (
            <article key={`${step.title}-${index}`} className="onboarding-guide__step">
              <div className="onboarding-guide__index">{index + 1}</div>
              <div className="onboarding-guide__body">
                <strong>{step.title}</strong>
                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
