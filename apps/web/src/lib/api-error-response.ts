import { NextResponse } from "next/server";
import { ZodError } from "zod";

type ApiErrorOptions = {
  validationMessage: string;
  fallbackMessage: string;
  validationStatus?: number;
  errorStatus?: number;
};

export const createApiErrorResponse = (
  error: unknown,
  options: ApiErrorOptions,
) => {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: options.validationMessage,
        details: error.flatten(),
      },
      { status: options.validationStatus ?? 400 },
    );
  }

  console.error(options.fallbackMessage, error);

  return NextResponse.json(
    {
      message: options.fallbackMessage,
    },
    { status: options.errorStatus ?? 500 },
  );
};
