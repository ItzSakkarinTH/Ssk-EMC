export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

// Stock API Types
export interface StockOverviewResponse {
  totalItems: number;
  totalQuantity: number;
  totalReceived: number;
  totalDispensed: number;
  byCategory: {
    food: CategoryData;
    medicine: CategoryData;
    clothing: CategoryData;
    other: CategoryData;
  };
  alerts: {
    lowStock: number;
    outOfStock: number;
  };
  lastUpdated: Date;
}

export interface CategoryData {
  items: number;
  quantity: number;
}

export interface StockByCategoryResponse {
  category: string;
  itemCount: number;
  items: StockItem[];
}

export interface StockItem {
  itemName: string;
  totalQuantity: number;
  unit: string;
  status: string;
}

export interface MyShelterStockResponse {
  shelterId: string;
  shelterName: string;
  totalItems: number;
  stock: ShelterStockItem[];
}

export interface ShelterStockItem {
  stockId: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  status: string;
  lastUpdated: Date | null;
  minStockLevel: number;
  criticalLevel: number;
}

export interface DispenseRequest {
  stockId: string;
  quantity: number;
  recipient: string;
  notes?: string;
}

export interface DispenseResponse {
  success: boolean;
  remainingStock: number;
  alert: string | null;
}

export interface ReceiveRequest {
  stockId: string;
  quantity: number;
  from: string;
  referenceId?: string;
  notes?: string;
}

export interface TransferRequest {
  stockId: string;
  quantity: number;
  fromShelterId: string | 'provincial';
  toShelterId: string;
  notes?: string;
}

export interface CreateRequestRequest {
  items: Array<{
    stockId: string;
    quantity: number;
    reason: string;
  }>;
}

export interface CreateRequestResponse {
  success: boolean;
  requestId: string;
  requestNumber: string;
  status: string;
  warnings: string[] | null;
  message: string;
}

export interface ApproveRequestRequest {
  status: 'approved' | 'rejected' | 'partial';
  approvedItems?: Array<{
    stockId: string;
    approvedQuantity: number;
  }>;
  adminNotes?: string;
}

export interface AllSheltersResponse {
  shelters: ShelterSummary[];
  summary: {
    totalShelters: number;
    normalShelters: number;
    tightShelters: number;
    criticalShelters: number;
  };
}

export interface ShelterSummary {
  shelterId: string;
  shelterName: string;
  shelterCode: string;
  location: any;
  totalItems: number;
  totalQuantity: number;
  alerts: {
    low: number;
    critical: number;
    total: number;
  };
  status: string;
  capacity: number;
  currentOccupancy: number;
}

export interface ProvinceStockResponse {
  overview: {
    totalProvincialStock: number;
    totalShelterStock: number;
    totalStock: number;
    totalItems: number;
    alerts: {
      low: number;
      outOfStock: number;
    };
  };
  byCategory: Record<string, CategoryData>;
  provincialStock: any[];
  recentActivity: {
    receive: { count: number; quantity: number };
    transfer: { count: number; quantity: number };
    dispense: { count: number; quantity: number };
  };
  lastUpdated: Date;
}