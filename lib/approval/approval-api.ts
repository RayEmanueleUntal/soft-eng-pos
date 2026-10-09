export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ApprovalRequestResponseDto {
  id: number | string;
  type: string; // e.g., 'REFUND_TRANSACTION', 'STOCK_OUT_OVERRIDE', 'PRICE_OVERRIDE'
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// Helper for standard API calls
async function fetchWithAuth(url: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed with status ${res.status}`);
  }

  return res.json();
}

/**
 * GET /approval — Fetch all approval requests
 */
export async function getApprovalRequests(): Promise<ApprovalRequestResponseDto[]> {
  try {
    return await fetchWithAuth('/approval');
  } catch (err) {
    console.warn('Backend API unreachable or empty. Using fallback local data for development.', err);
    return MOCK_APPROVAL_REQUESTS;
  }
}

/**
 * GET /approval/{id} — Fetch specific approval request
 */
export async function getApprovalRequestById(id: string | number): Promise<ApprovalRequestResponseDto> {
  return await fetchWithAuth(`/approval/${id}`);
}

/**
 * PATCH /approval/{id}/approve — Approve request
 */
export async function approveApprovalRequest(id: string | number): Promise<ApprovalRequestResponseDto> {
  return await fetchWithAuth(`/approval/${id}/approve`, {
    method: 'PATCH',
  });
}

/**
 * PATCH /approval/{id}/reject — Reject request
 */
export async function rejectApprovalRequest(
  id: string | number,
  dto?: ReviewApprovalRequestDto
): Promise<ApprovalRequestResponseDto> {
  return await fetchWithAuth(`/approval/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify(dto || {}),
  });
}

// Fallback Mock Data for testing UI without active backend entries
export const MOCK_APPROVAL_REQUESTS: ApprovalRequestResponseDto[] = [
  {
    id: 'APP-1001',
    type: 'REFUND_TRANSACTION',
    status: 'PENDING',
    requestedById: 'STAFF-042',
    reviewedById: null,
    createdAt: '2026-10-09T08:30:00.000Z',
    updatedAt: '2026-10-09T08:30:00.000Z',
    rejectionReason: null,
    payload: {
      transactionId: 'TX-8842',
      refundAmount: 1450.00,
      customerName: 'Juan Dela Cruz',
      reason: 'Defective item - crack on plastic body',
      items: [
        { productId: 'PROD-101', name: 'Heavy Duty Drill 12V', qty: 1, unitPrice: 1450.00 }
      ]
    }
  },
  {
    id: 'APP-1002',
    type: 'STOCK_OUT_OVERRIDE',
    status: 'PENDING',
    requestedById: 'STAFF-015',
    reviewedById: null,
    createdAt: '2026-10-09T09:15:00.000Z',
    updatedAt: '2026-10-09T09:15:00.000Z',
    rejectionReason: null,
    payload: {
      productId: 'PROD-502',
      sku: 'HDW-SCREW-M4',
      productName: 'M4 Stainless Steel Screws (100pcs)',
      requestedQty: 50,
      currentStock: 12,
      allowOverride: true,
      notes: 'Emergency store maintenance requirement'
    }
  },
  {
    id: 'APP-1000',
    type: 'PRICE_DISCOUNT_OVERRIDE',
    status: 'APPROVED',
    requestedById: 'STAFF-008',
    reviewedById: 'ADMIN-001',
    createdAt: '2026-10-08T14:20:00.000Z',
    updatedAt: '2026-10-08T14:25:00.000Z',
    rejectionReason: null,
    payload: {
      transactionId: 'TX-8810',
      originalTotal: 5000.00,
      discountedTotal: 4200.00,
      discountPercentage: '16%',
      managerApproved: true
    }
  },
  {
    id: 'APP-0999',
    type: 'REFUND_TRANSACTION',
    status: 'REJECTED',
    requestedById: 'STAFF-019',
    reviewedById: 'ADMIN-001',
    createdAt: '2026-10-07T11:00:00.000Z',
    updatedAt: '2026-10-07T11:10:00.000Z',
    rejectionReason: 'Receipt issue date exceeds the allowable 30-day return policy window.',
    payload: {
      transactionId: 'TX-7501',
      refundAmount: 890.00,
      reason: 'nigga changed his mind'
    }
  }
];