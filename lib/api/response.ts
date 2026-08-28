import { NextResponse } from 'next/server';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ data }, { status });
}

export function apiError(error: string, status = 400) {
  return NextResponse.json<ApiResponse>({ error }, { status });
}

export function apiUnauthorized() {
  return apiError('Unauthorized', 401);
}

export function apiForbidden() {
  return apiError('Forbidden', 403);
}

export function apiNotFound(resource = 'Resource') {
  return apiError(`${resource} not found`, 404);
}

export function apiServerError(err?: unknown) {
  console.error('[API Error]', err);
  return apiError('Internal server error', 500);
}
