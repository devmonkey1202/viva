import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSessionPreferencesFromWorkspaceSettings,
  createDefaultWorkspaceSettingsSnapshot,
  normalizeWorkspaceSettings,
} from "@/lib/workspace-settings";

test("normalizeWorkspaceSettings fills missing values", () => {
  const normalized = normalizeWorkspaceSettings({
    textOnly: true,
  });

  assert.equal(normalized.voiceEnabled, true);
  assert.equal(normalized.textOnly, true);
  assert.equal(normalized.allowFallback, true);
  assert.equal(normalized.defaultExportFormat, "csv");
  assert.equal(normalized.retentionDays, "30");
});

test("buildSessionPreferencesFromWorkspaceSettings respects text-only mode", () => {
  const defaults = createDefaultWorkspaceSettingsSnapshot();
  const sessionPreferences = buildSessionPreferencesFromWorkspaceSettings({
    ...defaults,
    textOnly: true,
    voiceEnabled: false,
    defaultExportFormat: "json",
    allowFallback: false,
  });

  assert.equal(sessionPreferences.studentResponseMode, "text_only");
  assert.equal(sessionPreferences.preferredExportFormat, "json");
  assert.equal(sessionPreferences.allowMockFallback, false);
});
