export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: ErrorDetail;
}

export interface ErrorDetail {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
