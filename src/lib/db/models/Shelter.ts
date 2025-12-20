import mongoose, { Schema, Document } from 'mongoose';

export interface IShelter extends Document {
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

const ShelterSchema = new Schema<IShelter>({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  location: {
    province: { type: String, required: true },
    district: { type: String, required: true },
    subdistrict: { type: String, required: true },
    address: { type: String, required: true },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  capacity: { type: Number, required: true, min: 0 },
  currentOccupancy: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['active', 'inactive', 'full'], default: 'active' },
  contactPerson: {
    name: { type: String, required: true },
    phone: { type: String, required: true }
  },
  createdAt: { type: Date, default: Date.now }
});

// Index
ShelterSchema.index({ status: 1 });

export default mongoose.models.Shelter || mongoose.model<IShelter>('Shelter', ShelterSchema);