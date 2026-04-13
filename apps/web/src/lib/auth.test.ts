import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveRoleFromCookieValues,
} from "@/lib/auth";
import { createVivaSessionToken } from "@/lib/server-auth";

test("resolveRoleFromCookieValues reads role from signed session token hint", () => {
  const sessionToken = createVivaSessionToken("operator", "demo");

  const resolvedRole = resolveRoleFromCookieValues({
    sessionToken,
  });

  assert.equal(resolvedRole, "operator");
});

test("resolveRoleFromCookieValues returns null when session token is missing", () => {
  const resolvedRole = resolveRoleFromCookieValues({
  });

  assert.equal(resolvedRole, null);
});
