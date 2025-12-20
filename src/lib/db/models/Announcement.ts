import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IAnnouncement extends Document {
    title: string;
    content: string;
    type: 'info' | 'warning' | 'urgent';
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>({
    title: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 200
    },
    content: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 2000
    },
    type: {
        type: String,
        enum: ['info', 'warning', 'urgent'],
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexes
AnnouncementSchema.index({ type: 1, isActive: 1, createdAt: -1 });
AnnouncementSchema.index({ createdBy: 1 });

const Announcement: Model<IAnnouncement> =
    mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);

export default Announcement;
