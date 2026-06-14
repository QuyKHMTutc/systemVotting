import api from './api';

export const ReportTargetType = {
  POLL: 'POLL',
  COMMENT: 'COMMENT',
  USER: 'USER'
} as const;

export type ReportTargetType = typeof ReportTargetType[keyof typeof ReportTargetType];

export const ReportReasonType = {
  SPAM: 'SPAM',
  HARASSMENT: 'HARASSMENT',
  HATE_SPEECH: 'HATE_SPEECH',
  FALSE_INFORMATION: 'FALSE_INFORMATION',
  INAPPROPRIATE_CONTENT: 'INAPPROPRIATE_CONTENT',
  OTHER: 'OTHER'
} as const;

export type ReportReasonType = typeof ReportReasonType[keyof typeof ReportReasonType];

export const ReportStatus = {
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED'
} as const;

export type ReportStatus = typeof ReportStatus[keyof typeof ReportStatus];

export interface ReportRequest {
  targetType: ReportTargetType;
  targetId: number;
  reasonType: ReportReasonType;
  description?: string;
}

export interface ReportResponse {
  id: number;
  reporterId: number;
  reporterName: string;
  reporterEmail: string;
  targetType: ReportTargetType;
  targetId: number;
  targetSnippet?: string;
  reasonType: ReportReasonType;
  description: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Page<T> {
  content: T[];
  pageable: any;
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: any;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export const reportService = {
  // User API
  createReport: async (data: ReportRequest) => {
    const response = await api.post('/reports', data);
    return response.data;
  },

  // Admin APIs
  getAllReports: async (params?: {
    status?: ReportStatus;
    targetType?: ReportTargetType;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }) => {
    const response = await api.get('/admin/reports', { params });
    return response.data.data as Page<ReportResponse>;
  },

  getReportById: async (id: number) => {
    const response = await api.get(`/admin/reports/${id}`);
    return response.data.data as ReportResponse;
  },

  updateReportStatus: async (id: number, status: ReportStatus) => {
    const response = await api.put(`/admin/reports/${id}/status`, { status });
    return response.data.data as ReportResponse;
  }
};
