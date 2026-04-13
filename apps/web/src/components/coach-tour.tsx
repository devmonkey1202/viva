"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type CoachTourStep = {
  selector: string;
  title: string;
  description: string;
  placement?: "top" | "right" | "bottom" | "left";
};

type CoachTourProps = {
  storageKey: string;
  steps: CoachTourStep[];
  tone?: "teacher" | "operator" | "settings";
};

type RectState = {
  top: number;
  left: number;
  width: number;
  height: number;
} | null;

type Point = {
  x: number;
  y: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function CoachTour({
  storageKey,
  steps,
  tone = "teacher",
}: CoachTourProps) {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<RectState>(null);
  const [panelRect, setPanelRect] = useState<RectState>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 900 : window.innerHeight;

  const currentStep = steps[stepIndex];

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(storageKey) === "dismissed");
    } catch {
      setDismissed(false);
    } finally {
      setReady(true);
    }
  }, [storageKey]);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(storageKey, "dismissed");
    } catch {}

    setDismissed(true);
  }, [storageKey]);

  const refreshTarget = useCallback(() => {
    const element = document.querySelector(currentStep.selector) as HTMLElement | null;

    if (!element) {
      setTargetRect(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, [currentStep.selector]);

  useLayoutEffect(() => {
    if (!ready || dismissed) {
      return;
    }

    const element = document.querySelector(currentStep.selector) as HTMLElement | null;
    element?.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });

    const timeoutId = window.setTimeout(refreshTarget, 260);
    window.addEventListener("resize", refreshTarget);
    window.addEventListener("scroll", refreshTarget, true);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", refreshTarget);
      window.removeEventListener("scroll", refreshTarget, true);
    };
  }, [currentStep.selector, dismissed, ready, refreshTarget]);

  useLayoutEffect(() => {
    if (!ready || dismissed) {
      return;
    }

    const refreshPanel = () => {
      const rect = panelRef.current?.getBoundingClientRect();

      if (!rect) {
        setPanelRect(null);
        return;
      }

      setPanelRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    const frameId = window.requestAnimationFrame(refreshPanel);
    window.addEventListener("resize", refreshPanel);
    window.addEventListener("scroll", refreshPanel, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", refreshPanel);
      window.removeEventListener("scroll", refreshPanel, true);
    };
  }, [currentStep.selector, currentStep.placement, dismissed, ready, stepIndex]);

  useEffect(() => {
    if (!ready || dismissed) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismiss();
      }

      if (event.key === "ArrowRight") {
        setStepIndex((current) => Math.min(current + 1, steps.length - 1));
      }

      if (event.key === "ArrowLeft") {
        setStepIndex((current) => Math.max(current - 1, 0));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismiss, dismissed, ready, steps.length]);

  const panelStyle = useMemo(() => {
    const mobileWidth = viewportWidth < 760;

    if (!targetRect) {
      return {
        top: mobileWidth ? `${viewportHeight - 236}px` : "24px",
        left: mobileWidth ? "12px" : "24px",
        width: `${Math.min(mobileWidth ? viewportWidth - 24 : 360, viewportWidth - 24)}px`,
      };
    }

    const gap = 18;
    const panelWidth = Math.min(340, viewportWidth - 24);
    const panelHeightGuess = 220;
    const placement = currentStep.placement ?? "bottom";

    if (mobileWidth) {
      return {
        top: `${Math.max(viewportHeight - panelHeightGuess - 16, 12)}px`,
        left: "12px",
        width: `${panelWidth}px`,
      };
    }

    let top = targetRect.top + targetRect.height + gap;
    let left = targetRect.left;

    if (placement === "top") {
      top = targetRect.top - panelHeightGuess - gap;
      left = targetRect.left;
    }

    if (placement === "right") {
      top = targetRect.top;
      left = targetRect.left + targetRect.width + gap;
    }

    if (placement === "left") {
      top = targetRect.top;
      left = targetRect.left - panelWidth - gap;
    }

    return {
      top: `${clamp(top, 16, viewportHeight - panelHeightGuess - 16)}px`,
      left: `${clamp(left, 16, viewportWidth - panelWidth - 16)}px`,
      width: `${panelWidth}px`,
    };
  }, [currentStep.placement, targetRect, viewportHeight, viewportWidth]);

  const connectorStyle = useMemo(() => {
    if (!targetRect || !panelRect || viewportWidth < 760) {
      return null;
    }

    const placement = currentStep.placement ?? "bottom";
    let from: Point;
    let to: Point;

    if (placement === "top") {
      from = {
        x: targetRect.left + targetRect.width / 2,
        y: targetRect.top - 8,
      };
      to = {
        x: panelRect.left + panelRect.width / 2,
        y: panelRect.top + panelRect.height,
      };
    } else if (placement === "right") {
      from = {
        x: targetRect.left + targetRect.width + 8,
        y: targetRect.top + targetRect.height / 2,
      };
      to = {
        x: panelRect.left,
        y: panelRect.top + panelRect.height / 2,
      };
    } else if (placement === "left") {
      from = {
        x: targetRect.left - 8,
        y: targetRect.top + targetRect.height / 2,
      };
      to = {
        x: panelRect.left + panelRect.width,
        y: panelRect.top + panelRect.height / 2,
      };
    } else {
      from = {
        x: targetRect.left + targetRect.width / 2,
        y: targetRect.top + targetRect.height + 8,
      };
      to = {
        x: panelRect.left + panelRect.width / 2,
        y: panelRect.top,
      };
    }

    const deltaX = to.x - from.x;
    const deltaY = to.y - from.y;
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    return {
      top: `${from.y}px`,
      left: `${from.x}px`,
      width: `${Math.max(length, 24)}px`,
      transform: `rotate(${angle}deg)`,
    };
  }, [currentStep.placement, panelRect, targetRect, viewportWidth]);

  if (!ready || dismissed || !currentStep) {
    return null;
  }

  return (
    <div
      className={`coach-tour coach-tour--${tone}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="coach-tour-title"
    >
      <button
        type="button"
        className="coach-tour__scrim"
        aria-label="튜토리얼 닫기"
        onClick={dismiss}
      />

      {targetRect ? (
        <div
          className="coach-tour__target"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        >
          <span className="coach-tour__target-dot" />
        </div>
      ) : null}

      {connectorStyle ? (
        <div className="coach-tour__connector" style={connectorStyle}>
          <span className="coach-tour__connector-tail" />
        </div>
      ) : null}

      <section
        ref={panelRef}
        className={`coach-tour__panel coach-tour__panel--${currentStep.placement ?? "bottom"}`}
        style={panelStyle}
      >
        <div className="coach-tour__head">
          <div className="coach-tour__eyebrow">
            <span>빠른 안내</span>
            <strong>
              {stepIndex + 1} / {steps.length}
            </strong>
          </div>
          <button
            type="button"
            className="button button--ghost button--compact"
            onClick={dismiss}
          >
            건너뛰기
          </button>
        </div>

        <div className="coach-tour__body">
          <h2 id="coach-tour-title">{currentStep.title}</h2>
          <p>{currentStep.description}</p>
          <p className="coach-tour__hint">
            이 안내는 처음 한 번만 보입니다.
          </p>
        </div>

        <div className="coach-tour__footer">
          <button
            type="button"
            className="button button--ghost button--compact"
            onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
            disabled={stepIndex === 0}
          >
            이전
          </button>
          <div className="coach-tour__dots" aria-hidden="true">
            {steps.map((step, index) => (
              <i
                key={`${step.selector}-${index}`}
                className={index === stepIndex ? "is-active" : undefined}
              />
            ))}
          </div>
          {stepIndex === steps.length - 1 ? (
            <button
              type="button"
              className="button button--primary button--compact"
              onClick={dismiss}
            >
              안내 종료
            </button>
          ) : (
            <button
              type="button"
              className="button button--primary button--compact"
              onClick={() =>
                setStepIndex((current) => Math.min(current + 1, steps.length - 1))
              }
            >
              다음
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
