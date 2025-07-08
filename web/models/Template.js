const mongoose = require('mongoose');
const slugify = require('slugify');

const templateSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true,
    index: true
  },

  title: {
    type: String,
    required: true,
    trim: true
  },

  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]+$/
  },

  templateCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    match: /^[A-Z0-9_]+$/
  },

  description: {
    type: String,
    trim: true
  },

  // ✅ Use ObjectId references to Category
  mainCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },

  subCategories: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Category',
    required: true,
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length > 0,
      message: 'At least one sub-category is required'
    }
  },

  // UI and access control
  tags: {
    type: [String],
    default: []
  },

  highlightAsNew: {
    type: Boolean,
    default: false
  },

  isPremium: {
    type: Boolean,
    default: false
  },

  availableForPlans: {
    type: [String],
    default: ['pro'],
    enum: ['free', 'pro', 'enterprise']
  },

  // Usage tracking
  usageCount: {
    type: Number,
    default: 0
  },

  lastUsedTimestamp: {
    type: Date,
    default: null
  },

  // Video-specific fields
  aspectRatiosSupported: {
    type: [String],
    enum: ['9:16', '16:9', '1:1'],
    default: undefined
  },

  videoDurations: {
    type: [Number],
    default: undefined
  },

  modes: {
    type: [String],
    enum: ['Standard', 'Pro'],
    default: undefined
  }

}, {
  timestamps: true
});

// Auto-generate slug and templateCode
templateSchema.pre('validate', function (next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }

  if (!this.templateCode && this.title) {
    this.templateCode = this.title
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  next();
});

// Indexes for performance
templateSchema.index({ type: 1, mainCategory: 1 });
templateSchema.index({ subCategories: 1 });
templateSchema.index({ slug: 1 });
templateSchema.index({ templateCode: 1 });
templateSchema.index({ highlightAsNew: 1 });
templateSchema.index({ tags: 1 });

module.exports = mongoose.model('Template', templateSchema);
