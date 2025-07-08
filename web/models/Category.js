import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  prompt: { type: String,default:'' },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]+$/
  },
  type: { type: String, enum: ['image', 'video'], required: true },
  banner: { type: String, default: '' },
  description: { type: String, required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  level: { type: Number, default: 0 },
  sortOrder: { type: Number, default: 0 },
  comingSoon: { type: Boolean, default: false },
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

  videoDurations: {
    type: Number,
    default: undefined
  },

  usageCount: {
    type: Number,
    default: 0
  },

  lastUsedTimestamp: {
    type: Date,
    default: null
  }

}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
export default Category;
