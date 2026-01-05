import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IStockItem extends Document {
    name: string;
    category: string;
    unit: string;
    description?: string;
    minStock: number;
    maxStock: number;
    createdAt: Date;
    updatedAt: Date;
}

const StockItemSchema = new Schema<IStockItem>({
    name: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 100,
        trim: true
    },
    category: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 50
    },
    unit: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 20
    },
    description: {
        type: String,
        maxlength: 500
    },
    minStock: {
        type: Number,
        required: false,
        default: 0,
        min: 0
    },
    maxStock: {
        type: Number,
        required: false,
        default: null,
        min: 1
    }
}, {
    timestamps: true
});

// Indexes
StockItemSchema.index({ category: 1, name: 1 });
StockItemSchema.index({ name: 'text' });

const StockItem: Model<IStockItem> =
    mongoose.models.StockItem || mongoose.model<IStockItem>('StockItem', StockItemSchema);

export default StockItem;
