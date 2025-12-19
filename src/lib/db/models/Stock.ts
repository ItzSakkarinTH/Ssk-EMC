// src/lib/db/models/Stock.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IShelterStock {
  shelterId: mongoose.Types.ObjectId;
  quantity: number;
  lastUpdated: Date;
}

export interface IStock extends Document {
  itemName: string;
  category: 'food' | 'medicine' | 'clothing' | 'other';
  unit: string;
  provincialStock: number;
  shelterStock: IShelterStock[];
  totalQuantity: number;
  totalReceived: number;
  totalDispensed: number;
  minStockLevel: number;
  criticalLevel: number;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: mongoose.Types.ObjectId;
  };
}

const ShelterStockSchema = new Schema({
  shelterId: { type: Schema.Types.ObjectId, ref: 'Shelter', required: true },
  quantity: { type: Number, default: 0, min: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

const StockSchema = new Schema<IStock>({
  itemName: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['food', 'medicine', 'clothing', 'other'],
    required: true
  },
  unit: { type: String, required: true, trim: true },
  provincialStock: { type: Number, default: 0, min: 0 },
  shelterStock: [ShelterStockSchema],
  totalQuantity: { type: Number, default: 0, min: 0 },
  totalReceived: { type: Number, default: 0, min: 0 },
  totalDispensed: { type: Number, default: 0, min: 0 },
  minStockLevel: { type: Number, default: 10 },
  criticalLevel: { type: Number, default: 5 },
  metadata: {
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }
}, { timestamps: true });

// Indexes
StockSchema.index({ category: 1, totalQuantity: -1 });
StockSchema.index({ 'shelterStock.shelterId': 1 });
StockSchema.index({ totalQuantity: 1 });
StockSchema.index({ itemName: 'text' });

// Method: คำนวณ totalQuantity
StockSchema.methods.calculateTotal = function() {
  this.totalQuantity = this.provincialStock + 
    this.shelterStock.reduce((sum, s) => sum + s.quantity, 0);
  return this.totalQuantity;
};

// Method: ตรวจสอบสถานะ
StockSchema.methods.getStatus = function() {
  if (this.totalQuantity === 0) return 'outOfStock';
  if (this.totalQuantity <= this.criticalLevel) return 'critical';
  if (this.totalQuantity <= this.minStockLevel) return 'low';
  return 'sufficient';
};

// Method: ดึงสต๊อกของศูนย์เฉพาะ
StockSchema.methods.getShelterStock = function(shelterId: string) {
  return this.shelterStock.find(s => s.shelterId.toString() === shelterId);
};

export default mongoose.models.Stock || mongoose.model<IStock>('Stock', StockSchema);