import { apiClient } from '@/lib/api';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ApprovalRequestResponseDto {
  id: number | string;
  type: string;
  status: ApprovalStatus;
  requestedById: number | string;
  reviewedById?: number | string | null;
  payload: Record<string, any>;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewApprovalRequestDto {
  rejectionReason?: string;
}

// GET /approval - Fetch live requests from NestJS / PostgreSQL
export async function getApprovalRequests(): Promise<ApprovalRequestResponseDto[]> {
  const response = await apiClient.get<ApprovalRequestResponseDto[]>('/approval');
  return response.data;
}

// PATCH /approval/:id/approve - Persist approval in NestJS / PostgreSQL
export async function approveApprovalRequest(id: string | number): Promise<ApprovalRequestResponseDto> {
  const response = await apiClient.patch<ApprovalRequestResponseDto>(`/approval/${id}/approve`);
  return response.data;
}

// PATCH /approval/:id/reject - Persist rejection in NestJS / PostgreSQL
export async function rejectApprovalRequest(
  id: string | number,
  dto?: ReviewApprovalRequestDto
): Promise<ApprovalRequestResponseDto> {
  const response = await apiClient.patch<ApprovalRequestResponseDto>(`/approval/${id}/reject`, dto);
  return response.data;
}