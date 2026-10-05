import mongoose from 'mongoose';

const ContentBlockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'list'],
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

const ContentRevisionSchema = new mongoose.Schema(
  {
    pageKey: { type: String, required: true, index: true, trim: true, lowercase: true },
    logicalPage: { type: String, required: true, trim: true, lowercase: true },
    locale: { type: String, required: true, trim: true, lowercase: true },
    blocks: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    savedBy: { type: String, required: true, trim: true },
    savedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

ContentRevisionSchema.index({ pageKey: 1, savedAt: -1 });

if (mongoose.models.ContentRevision) {
  delete mongoose.models.ContentRevision;
}

export default mongoose.model('ContentRevision', ContentRevisionSchema);
