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

const ContentSchema = new mongoose.Schema(
  {
    page: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    blocks: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    draftBlocks: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    updatedBy: { type: String, default: '' },
    draftUpdatedBy: { type: String, default: '' },
    draftUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Always use the latest schema (dev-server hot reload can cache an old Map-based model).
if (mongoose.models.Content) {
  delete mongoose.models.Content;
}

export default mongoose.model('Content', ContentSchema);
