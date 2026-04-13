import assert from "node:assert/strict";
import test from "node:test";

import {
  createVivaSessionToken,
  readVivaRoleFromSessionCookies,
  readVivaSessionFromCookies,
  validateAccessCode,
} from "@/lib/server-auth";

test("createVivaSessionToken produces a readable signed session", () => {
  const token = createVivaSessionToken("teacher", "demo");
  const session = readVivaSessionFromCookies({
    get(name: string) {
      if (name === "viva_session") {
        return { value: token };
      }

      return undefined;
    },
  });

  assert.equal(session?.role, "teacher");
  assert.equal(session?.authMode, "demo");
  assert.equal(readVivaRoleFromSessionCookies({
    get(name: string) {
      if (name === "viva_session") {
        return { value: token };
      }

      return undefined;
    },
  }), "teacher");
});

test("tampered session token is rejected", () => {
  const token = createVivaSessionToken("teacher", "demo");
  const session = readVivaSessionFromCookies({
    get(name: string) {
      if (name === "viva_session") {
        return { value: `${token}tampered` };
      }

      return undefined;
    },
  });

  assert.equal(session, null);
});

test("validateAccessCode falls back to demo mode when no code is configured", () => {
  const result = validateAccessCode("teacher", "");
  assert.equal(result.valid, true);
  assert.equal(result.authMode, "demo");
});

test("validateAccessCode enforces configured role codes", () => {
  const previousTeacherCode = process.env.VIVA_TEACHER_ACCESS_CODE;

  process.env.VIVA_TEACHER_ACCESS_CODE = "teacher-secret";

  try {
    const validResult = validateAccessCode("teacher", "teacher-secret");
    const invalidResult = validateAccessCode("teacher", "wrong-secret");

    assert.equal(validResult.valid, true);
    assert.equal(validResult.authMode, "passcode");
    assert.equal(invalidResult.valid, false);
    assert.equal(invalidResult.authMode, "passcode");
  } finally {
    if (previousTeacherCode === undefined) {
      delete process.env.VIVA_TEACHER_ACCESS_CODE;
    } else {
      process.env.VIVA_TEACHER_ACCESS_CODE = previousTeacherCode;
    }
  }
});

test("createVivaSessionToken requires explicit session secret in production", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousSessionSecret = process.env.VIVA_SESSION_SECRET;

  delete process.env.VIVA_SESSION_SECRET;
  process.env.NODE_ENV = "production";

  try {
    assert.throws(
      () => createVivaSessionToken("teacher", "demo"),
      /VIVA_SESSION_SECRET must be configured in production/,
    );
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }

    if (previousSessionSecret === undefined) {
      delete process.env.VIVA_SESSION_SECRET;
    } else {
      process.env.VIVA_SESSION_SECRET = previousSessionSecret;
    }
  }
});
