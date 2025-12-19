export type StockCategory = 'food' | 'medicine' | 'clothing' | 'other';
export type StockStatus = 'sufficient' | 'low' | 'critical' | 'outOfStock';
export type MovementType = 'receive' | 'transfer' | 'dispense';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'partial';
export type DeliveryStatus = 'pending' | 'in_transit' | 'delivered';
export type ShelterStatus = 'normal' | 'tight' | 'critical';

export interface Stock {
  _id: string;
  itemName: string;
  category: StockCategory;
  unit: string;
  provincialStock: number;
  shelterStock: ShelterStock[];
  totalQuantity: number;
  totalReceived: number;
  totalDispensed: number;
  minStockLevel: number;
  criticalLevel: number;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
  };
}

export interface ShelterStock {
  shelterId: string;
  quantity: number;
  lastUpdated: Date;
}

export interface StockMovement {
  _id: string;
  stockId: string;
  movementType: MovementType;
  quantity: number;
  unit: string;
  from: Location;
  to: Location;
  performedBy: string;
  performedAt: Date;
  notes: string;
  referenceId: string;
  snapshot: {
    before: number;
    after: number;
  };
}

export interface Location {
  type: 'provincial' | 'shelter' | 'external' | 'beneficiary';
  id: string | null;
  name: string;
}

export interface StockRequest {
  _id: string;
  requestNumber: string;
  shelterId: string;
  requestedBy: string;
  requestedAt: Date;
  items: RequestItem[];
  status: RequestStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  adminNotes: string;
  approvedItems: ApprovedItem[];
  deliveryStatus: DeliveryStatus;
  deliveredAt: Date | null;
}

export interface RequestItem {
  stockId: string;
  itemName: string;
  requestedQuantity: number;
  unit: string;
  reason: string;
}

export interface ApprovedItem {
  stockId: string;
  approvedQuantity: number;
}

export interface Shelter {
  _id: string;
  name: string;
  code: string;
  location: {
    province: string;
    district: string;
    subdistrict: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  capacity: number;
  currentOccupancy: number;
  status: 'active' | 'inactive' | 'full';
  contactPerson: {
    name: string;
    phone: string;
  };
  createdAt: Date;
}
