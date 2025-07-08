const mongoose = require('mongoose');

const templateUsageLogSchema = new mongoose.Schema({
  shopDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: /^[a-z0-9-]+\.myshopify\.com$/
  },

  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: true,
    index: true
  },

  creationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creation',
    required: true
  },

  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },

  usedAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  creditsUsed: {
    type: Number,
    required: true,
    min: 0
  },

  usedBy: {
    type: String, // Optional: Shopify staff email, sub-user, or null
    default: null
  },

  meta: {
    aspectRatio: {
      type: String,
      enum: ['9:16', '16:9', '1:1'],
      default: null
    },
    duration: {
      type: Number,
      default: null
    },
    mode: {
      type: String,
      enum: ['Standard', 'Pro'],
      default: 'Standard'
    },
    imageCount: {
      type: Number,
      default: 1
    }
  }
}, {
  timestamps: true
});

// Indexes for fast lookup
templateUsageLogSchema.index({ shopDomain: 1, usedAt: -1 });
templateUsageLogSchema.index({ templateId: 1, usedAt: -1 });
templateUsageLogSchema.index({ creationId: 1 });

module.exports = mongoose.model('TemplateUsageLog', templateUsageLogSchema);
