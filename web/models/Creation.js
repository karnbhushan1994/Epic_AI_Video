import mongoose from 'mongoose';

// Reusable sub-schema for inputMap
const inputMapItemSchema = new mongoose.Schema({
  productId: { type: String, default: null },
  imageUrl: { type: String, required: true }
}, { _id: false });

// Reusable sub-schema for outputMap
const outputMapItemSchema = new mongoose.Schema({
  productId: { type: String, default: null },
  outputUrl: { type: String, required: true }
}, { _id: false });

const creationSchema = new mongoose.Schema({
  taskId: { 
    type: String,
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
    type: [inputMapItemSchema],
    default: []
  },

  inputImages: {
    type: [String],
    default: []
  },

  outputMap: {
    type: [outputMapItemSchema],
    default: []
  },

  creditsUsed: {
    type: Number,
    required: true,
    min: 0
  },

  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },

  failureReason: {
    type: String,
    default: null
  },

  // associatedProductIds: {
  //   type: [String],
  //   default: []
  // },

  meta: {
    aspectRatio: { type: String, enum: ['9:16', '16:9', '1:1'], default: null },
    duration: { type: Number, default: null },
    mode: { type: String, enum: ['Std', 'Pro'], default: null },
    cfgScale: { type: Number, default: null }
  },

  IN_PROGRESSStartedAt: {
    type: Date,
    default: null
  },

  IN_PROGRESSCOMPLETEDAt: {
    type: Date,
    default: null
  }

}, {
  timestamps: true
});

const Creation = mongoose.model('Creation', creationSchema);

export default Creation;
