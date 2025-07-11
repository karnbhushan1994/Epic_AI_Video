import mongoose from 'mongoose';

const creationSchema = new mongoose.Schema({
  taskId: {
    type: String,
     required: true,
  },
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
  },

  creditsUsed: {
    type: Number,
    required: true,
    min: 0
  },

  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'], // Added 'processing' status
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
    mode: { type: String, enum: ['Std', 'Pro'], default: null },
    imageCount: { type: Number, default: null },
    videoUrl: { type: String, default: null },
    creationId: { type: String, default: null }, // External API creation ID
    cfgScale: { type: Number, default: null }
  },

  processingStartedAt: {
    type: Date,
    default: null
  },

  processingCompletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const Creation = mongoose.model('Creation', creationSchema);

export default Creation;