import mongoose from 'mongoose';

const ContentAuditSchema = new mongoose.Schema(
  {
    pageKey: { type: String, required: true, index: true, trim: true, lowercase: true },
    logicalPage: { type: String, required: true, trim: true, lowercase: true },
    locale: { type: String, required: true, trim: true, lowercase: true },
    action: {
      type: String,
      enum: ['draft_save', 'publish', 'restore'],
      required: true,
      index: true,
    },
    actor: { type: String, required: true, trim: true },
    keyCount: { type: Number, default: 0 },
    revisionId: { type: String, default: '' },
    note: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'at', updatedAt: false } }
);

ContentAuditSchema.index({ at: -1 });

export default mongoose.models.ContentAudit || mongoose.model('ContentAudit', ContentAuditSchema);
