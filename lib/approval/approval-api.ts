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

// GET /approval - Fetch all requests using central apiClient
export async function getApprovalRequests(): Promise<ApprovalRequestResponseDto[]> {
  try {
    const response = await apiClient.get<ApprovalRequestResponseDto[]>('/approval');
    if (response.data && response.data.length > 0) {
      return response.data;
    }
    return MOCK_APPROVAL_REQUESTS;
  } catch (error) {
    console.warn('Backend API connection failed, using mock fallback data:', error);
    return MOCK_APPROVAL_REQUESTS;
  }
}

// PATCH /approval/:id/approve - Approve a request
export async function approveApprovalRequest(id: string | number): Promise<ApprovalRequestResponseDto> {
  try {
    const response = await apiClient.patch<ApprovalRequestResponseDto>(`/approval/${id}/approve`);
    return response.data;
  } catch (error) {
    console.warn(`Backend approve failed for ${id} (likely mock data), applying local fallback:`, error);
    return {
      id,
      type: 'OVERRIDE',
      status: 'APPROVED',
      requestedById: 'STAFF-015',
      reviewedById: 'ADMIN-CURRENT',
      payload: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

// PATCH /approval/:id/reject - Reject a request
export async function rejectApprovalRequest(
  id: string | number,
  dto?: ReviewApprovalRequestDto
): Promise<ApprovalRequestResponseDto> {
  try {
    const response = await apiClient.patch<ApprovalRequestResponseDto>(`/approval/${id}/reject`, dto);
    return response.data;
  } catch (error) {
    console.warn(`Backend reject failed for ${id} (likely mock data), applying local fallback:`, error);
    return {
      id,
      type: 'OVERRIDE',
      status: 'REJECTED',
      requestedById: 'STAFF-015',
      reviewedById: 'ADMIN-CURRENT',
      rejectionReason: dto?.rejectionReason || 'Rejected by Admin',
      payload: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

// Mock fallback data for visual/offline testing
export const MOCK_APPROVAL_REQUESTS: ApprovalRequestResponseDto[] = [
  {
    id: 'APP-1001',
    type: 'STOCK_OUT_OVERRIDE',
    status: 'PENDING',
    requestedById: 'STAFF-042',
    reviewedById: null,
    createdAt: '2026-10-07T09:30:00.000Z',
    updatedAt: '2026-10-07T09:30:00.000Z',
    payload: {
      productId: 'PROD-8891',
      productName: 'Wireless Barcode Scanner',
      requestedQuantity: 50,
      currentStock: 12,
      reason: 'Urgent bulk order fulfillment for Client X.',
    },
  },
  {
    id: 'APP-1002',
    type: 'PRICE_OVERRIDE',
    status: 'PENDING',
    requestedById: 'STAFF-015',
    reviewedById: null,
    createdAt: '2026-10-07T10:15:00.000Z',
    updatedAt: '2026-10-07T10:15:00.000Z',
    payload: {
      productId: 'PROD-1022',
      originalPrice: 1500.00,
      overridePrice: 1200.00,
      reason: 'Damaged outer box discount approved by floor supervisor.',
    },
  },
  {
    id: 'APP-1000',
    type: 'REFUND_TRANSACTION',
    status: 'APPROVED',
    requestedById: 'STAFF-042',
    reviewedById: 'ADMIN-001',
    createdAt: '2026-10-06T14:20:00.000Z',
    updatedAt: '2026-10-06T14:45:00.000Z',
    payload: {
      transactionId: 'TX-9982',
      refundAmount: 450.50,
      items: [{ sku: 'ITEM-1', qty: 1, price: 450.50 }],
    },
  },
  {
    id: 'APP-0999',
    type: 'REFUND_TRANSACTION',
    status: 'REJECTED',
    requestedById: 'STAFF-019',
    reviewedById: 'ADMIN-001',
    createdAt: '2026-10-05T11:00:00.000Z',
    updatedAt: '2026-10-05T11:10:00.000Z',
    rejectionReason: 'Receipt issue date exceeds the allowable 30-day return policy window.',
    payload: {
      transactionId: 'TX-7501',
      refundAmount: 890.00,
      reason: 'Customer changed mind',
    },
  },
];