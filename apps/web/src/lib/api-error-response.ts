import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { ApiAuthorizationError } from "@/lib/server-auth";
import {
  buildTraceHeaders,
  getTraceDurationMs,
  logServerEvent,
  type RequestTrace,
} from "@/lib/server-observability";

type ApiErrorOptions = {
  validationMessage: string;
  fallbackMessage: string;
  validationStatus?: number;
  errorStatus?: number;
  trace?: RequestTrace;
  context?: Record<string, unknown>;
};

export const createApiErrorResponse = (
  error: unknown,
  options: ApiErrorOptions,
) => {
  const headers = options.trace ? buildTraceHeaders(options.trace) : undefined;

  if (error instanceof ZodError) {
    logServerEvent("warn", "api.validation_failed", {
      requestId: options.trace?.requestId,
      path: options.trace?.path,
      method: options.trace?.method,
      durationMs: options.trace ? getTraceDurationMs(options.trace) : undefined,
      details: error.flatten(),
      ...options.context,
    });

    return NextResponse.json(
      {
        message: options.validationMessage,
        code: "validation_failed",
        requestId: options.trace?.requestId,
        details: error.flatten(),
      },
      { status: options.validationStatus ?? 400, headers },
    );
  }

  if (error instanceof ApiAuthorizationError) {
    logServerEvent("warn", "api.authorization_failed", {
      requestId: options.trace?.requestId,
      path: options.trace?.path,
      method: options.trace?.method,
      durationMs: options.trace ? getTraceDurationMs(options.trace) : undefined,
      status: error.status,
      code: error.code,
      message: error.message,
      ...options.context,
    });

    return NextResponse.json(
      {
        message: error.message,
        code: error.code,
        requestId: options.trace?.requestId,
      },
      { status: error.status, headers },
    );
  }

  logServerEvent("error", "api.unhandled_error", {
    requestId: options.trace?.requestId,
    path: options.trace?.path,
    method: options.trace?.method,
    durationMs: options.trace ? getTraceDurationMs(options.trace) : undefined,
    message: options.fallbackMessage,
    errorMessage: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...options.context,
  });

  return NextResponse.json(
    {
      message: options.fallbackMessage,
      code: "internal_error",
      requestId: options.trace?.requestId,
    },
    { status: options.errorStatus ?? 500, headers },
  );
};
