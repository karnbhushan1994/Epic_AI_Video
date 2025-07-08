const mongoose = require('mongoose');

const shopOnboardingSchema = new mongoose.Schema({
  shopDomain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9\-]+\.myshopify\.com$/
  },
  hasCompletedOnboarding: {
    type: Boolean,
    default: false
  },
  skippedIntro: {
    type: Boolean,
    default: false
  },
  acceptedDisclaimer: {
    type: Boolean,
    default: false
  },
  completedSteps: {
    type: [Number],
    default: [],
    validate: {
      validator: (steps) => steps.every(step => Number.isInteger(step) && step > 0 && step <= 4),
      message: 'Invalid step number in completedSteps'
    }
  },
  lastVisitedStep: {
    type: Number,
    default: 1,
    min: 1,
    max: 4
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ShopOnboardingStatus', shopOnboardingSchema);
