export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function apiSuccess<T>(data: T, message?: string): ApiSuccess<T> {
  return { success: true, data, message };
}

export function apiError(error: string, code?: string, details?: Record<string, string[]>): ApiError {
  return { success: false, error, code, details };
}
