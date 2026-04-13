import type { VerificationSessionPreferences } from "@/lib/schemas";

export type WorkspaceSettings = {
  voiceEnabled: boolean;
  textOnly: boolean;
  allowFallback: boolean;
  defaultExportFormat: "csv" | "json";
  retentionDays: string;
};

export type WorkspaceSettingsSnapshot = WorkspaceSettings & {
  savedAt: string | null;
};

export const workspaceSettingsStorageKey = "viva:workspace-settings";

export const defaultWorkspaceSettings: WorkspaceSettings = {
  voiceEnabled: true,
  textOnly: false,
  allowFallback: true,
  defaultExportFormat: "csv",
  retentionDays: "30",
};

export const createDefaultWorkspaceSettingsSnapshot =
  (): WorkspaceSettingsSnapshot => ({
    ...defaultWorkspaceSettings,
    savedAt: null,
  });

export const normalizeWorkspaceSettings = (
  value: Partial<WorkspaceSettingsSnapshot> | null | undefined,
): WorkspaceSettingsSnapshot => ({
  voiceEnabled: value?.voiceEnabled ?? defaultWorkspaceSettings.voiceEnabled,
  textOnly: value?.textOnly ?? defaultWorkspaceSettings.textOnly,
  allowFallback: value?.allowFallback ?? defaultWorkspaceSettings.allowFallback,
  defaultExportFormat:
    value?.defaultExportFormat ?? defaultWorkspaceSettings.defaultExportFormat,
  retentionDays: value?.retentionDays ?? defaultWorkspaceSettings.retentionDays,
  savedAt: value?.savedAt ?? null,
});

export const readWorkspaceSettings = (): WorkspaceSettingsSnapshot => {
  if (typeof window === "undefined") {
    return createDefaultWorkspaceSettingsSnapshot();
  }

  try {
    const raw = window.localStorage.getItem(workspaceSettingsStorageKey);

    if (!raw) {
      return createDefaultWorkspaceSettingsSnapshot();
    }

    return normalizeWorkspaceSettings(
      JSON.parse(raw) as Partial<WorkspaceSettingsSnapshot>,
    );
  } catch {
    window.localStorage.removeItem(workspaceSettingsStorageKey);
    return createDefaultWorkspaceSettingsSnapshot();
  }
};

export const persistWorkspaceSettings = (
  value: WorkspaceSettingsSnapshot,
): WorkspaceSettingsSnapshot => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      workspaceSettingsStorageKey,
      JSON.stringify(value),
    );
  }

  return value;
};

export const buildSessionPreferencesFromWorkspaceSettings = (
  settings: WorkspaceSettings,
): VerificationSessionPreferences => ({
  studentResponseMode:
    settings.textOnly || !settings.voiceEnabled ? "text_only" : "voice_or_text",
  preferredExportFormat: settings.defaultExportFormat,
  allowMockFallback: settings.allowFallback,
});
