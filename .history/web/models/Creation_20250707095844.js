import mongoose from 'mongoose';

const creationSchema = new mongoose.Schema({
  shopDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: /^[a-z0-9-]+\.myshopify\.com$/
  },

  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },

  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: true
  },

  inputMap: {
    type: [
      {
        productId: { type: String, default: null },
        imageUrl: { type: String, required: true }
      }
    ],
    default: []
  },

  inputImages: {
    type: [String],
    default: []
  },

  outputMap: {
    type: [
      {
        productId: { type: String, required: true },
        outputUrl: { type: String, required: true }
      }
    ],
    default: []
    // validate: {
    //   validator: (arr) => Array.isArray(arr) && arr.length > 0,
    //   message: 'At least one output mapping is required.'
    // }
  },

  creditsUsed: {
    type: Number,
    required: true,
    min: 0
  },

  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },

  failureReason: {
    type: String,
    default: null
  },

  associatedProductIds: {
    type: [String],
    default: []
  },
  meta: {
    aspectRatio: { type: String, enum: ['9:16', '16:9', '1:1'], default: null },
    duration: { type: Number, default: null },
    mode: { type: String, enum: ['Standard', 'Pro'], default: null },
    imageCount: { type: Number, default: null }
  }
}, {
  timestamps: true
});

creationSchema.index({ shopDomain: 1, createdAt: -1 });
creationSchema.index({ templateId: 1, type: 1 });
creationSchema.index({ associatedProductIds: 1 });
creationSchema.index({ status: 1 });

const Creation = mongoose.model('Creation', creationSchema);

export default Creation;