/** Mirrors backend `PageResponse<T>` (Spring Page: currentPage is 0-based). */
export interface PageResponse<T> {
    content: T[];
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalElements: number;
}
