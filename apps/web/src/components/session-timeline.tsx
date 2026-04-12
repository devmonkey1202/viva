import { formatDateTime } from "@/lib/presentation";
import type { VerificationActivity } from "@/lib/schemas";

type SessionTimelineProps = {
  verificationId: string | null;
  activity: VerificationActivity[];
};

export function SessionTimeline({
  verificationId,
  activity,
}: SessionTimelineProps) {
  return (
    <div className="stack-grid">
      <div className="summary-box">
        <p className="summary-box__label">세션 ID</p>
        <p className="summary-box__mono">{verificationId ?? "미생성"}</p>
      </div>
      {activity.length > 0 ? (
        <ul className="timeline-list">
          {activity.map((item, index) => (
            <li
              key={`${item.recordedAt}-${index}`}
              className="timeline-list__item"
            >
              <span className="timeline-list__dot" />
              <div>
                <p className="timeline-list__title">{item.message}</p>
                <p className="timeline-list__meta">
                  {formatDateTime(item.recordedAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="helper-text">아직 기록된 세션 활동이 없습니다.</p>
      )}
    </div>
  );
}
