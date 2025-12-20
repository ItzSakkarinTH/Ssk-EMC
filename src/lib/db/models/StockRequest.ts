
import mongoose, { Schema, Document } from 'mongoose';

interface IRequestItem {
  stockId: mongoose.Types.ObjectId;
  itemName: string;
  requestedQuantity: number;
  unit: string;
  reason: string;
}

interface IApprovedItem {
  stockId: mongoose.Types.ObjectId;
  approvedQuantity: number;
}

export interface IStockRequest extends Document {
  requestNumber: string;
  shelterId: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  requestedAt: Date;
  items: IRequestItem[];
  status: 'pending' | 'approved' | 'rejected' | 'partial';
  reviewedBy: mongoose.Types.ObjectId | null;
  reviewedAt: Date | null;
  adminNotes: string;
  approvedItems: IApprovedItem[];
  deliveryStatus: 'pending' | 'in_transit' | 'delivered';
  deliveredAt: Date | null;
}

const RequestItemSchema = new Schema({
  stockId: { type: Schema.Types.ObjectId, ref: 'Stock', required: true },
  itemName: { type: String, required: true },
  requestedQuantity: { type: Number, required: true, min: 1 },
  unit: { type: String, required: true },
  reason: { type: String, default: '' }
});

const ApprovedItemSchema = new Schema({
  stockId: { type: Schema.Types.ObjectId, ref: 'Stock', required: true },
  approvedQuantity: { type: Number, required: true, min: 0 }
});

const StockRequestSchema = new Schema<IStockRequest>({
  requestNumber: {
    type: String,
    required: true,
    unique: true,
    default: () => `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  shelterId: { type: Schema.Types.ObjectId, ref: 'Shelter', required: true },
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  requestedAt: { type: Date, default: Date.now },
  items: [RequestItemSchema],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'partial'],
    default: 'pending'
  },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  adminNotes: { type: String, default: '' },
  approvedItems: [ApprovedItemSchema],
  deliveryStatus: {
    type: String,
    enum: ['pending', 'in_transit', 'delivered'],
    default: 'pending'
  },
  deliveredAt: { type: Date, default: null }
}, { timestamps: true });

// Indexes
StockRequestSchema.index({ shelterId: 1, status: 1, requestedAt: -1 });
StockRequestSchema.index({ status: 1, requestedAt: -1 });
StockRequestSchema.index({ requestNumber: 1 });

// Method: คำนวณ Approval Rate
StockRequestSchema.methods.getApprovalRate = function () {
  if (this.status !== 'approved' && this.status !== 'partial') return 0;

  const totalRequested = this.items.reduce((sum: number, i: IRequestItem) => sum + i.requestedQuantity, 0);
  const totalApproved = this.approvedItems.reduce((sum: number, i: IApprovedItem) => sum + i.approvedQuantity, 0);

  return (totalApproved / totalRequested) * 100;
};

// Static method: สร้างคำร้องใหม่
StockRequestSchema.statics.createRequest = async function (data: {
  shelterId: string;
  requestedBy: string;
  items: IRequestItem[];
}) {
  return await this.create({
    shelterId: data.shelterId,
    requestedBy: data.requestedBy,
    items: data.items,
    status: 'pending'
  });
};

export default mongoose.models.StockRequest ||
  mongoose.model<IStockRequest>('StockRequest', StockRequestSchema);