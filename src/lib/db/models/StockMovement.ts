// src/lib/db/models/StockMovement.ts
import mongoose, { Schema, Document } from 'mongoose';

interface ILocation {
  type: 'provincial' | 'shelter' | 'external' | 'beneficiary';
  id: mongoose.Types.ObjectId | null;
  name: string;
}

interface ISnapshot {
  before: number;
  after: number;
}

export interface IStockMovement extends Document {
  stockId: mongoose.Types.ObjectId;
  movementType: 'receive' | 'transfer' | 'dispense';
  quantity: number;
  unit: string;
  from: ILocation;
  to: ILocation;
  performedBy: mongoose.Types.ObjectId;
  performedAt: Date;
  notes: string;
  referenceId: string;
  snapshot: ISnapshot;
}

const LocationSchema = new Schema({
  type: {
    type: String,
    enum: ['provincial', 'shelter', 'external', 'beneficiary'],
    required: true
  },
  id: { type: Schema.Types.ObjectId, default: null },
  name: { type: String, required: true }
});

const SnapshotSchema = new Schema({
  before: { type: Number, required: true },
  after: { type: Number, required: true }
});

const StockMovementSchema = new Schema<IStockMovement>({
  stockId: { type: Schema.Types.ObjectId, ref: 'Stock', required: true },
  movementType: {
    type: String,
    enum: ['receive', 'transfer', 'dispense'],
    required: true
  },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  from: { type: LocationSchema, required: true },
  to: { type: LocationSchema, required: true },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  performedAt: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
  referenceId: { type: String, default: '' },
  snapshot: { type: SnapshotSchema, required: true }
}, { timestamps: true });

// Indexes
StockMovementSchema.index({ stockId: 1, performedAt: -1 });
StockMovementSchema.index({ 'from.id': 1, movementType: 1 });
StockMovementSchema.index({ 'to.id': 1, movementType: 1 });
StockMovementSchema.index({ performedAt: -1 });
StockMovementSchema.index({ referenceId: 1 });

// Static method: สร้าง Movement Log
StockMovementSchema.statics.logMovement = async function(data: {
  stockId: string;
  type: 'receive' | 'transfer' | 'dispense';
  quantity: number;
  unit: string;
  from: ILocation;
  to: ILocation;
  userId: string;
  notes?: string;
  referenceId?: string;
  snapshot: ISnapshot;
}) {
  return await this.create({
    stockId: data.stockId,
    movementType: data.type,
    quantity: data.quantity,
    unit: data.unit,
    from: data.from,
    to: data.to,
    performedBy: data.userId,
    notes: data.notes || '',
    referenceId: data.referenceId || `REF-${Date.now()}`,
    snapshot: data.snapshot
  });
};

export default mongoose.models.StockMovement || 
  mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
  