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
  hasCOMPLETEDOnboarding: {
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
  COMPLETEDSteps: {
    type: [Number],
    default: [],
    validate: {
      validator: (steps) => steps.every(step => Number.isInteger(step) && step > 0 && step <= 4),
      message: 'Invalid step number in COMPLETEDSteps'
    }
  },
  lastVisitedStep: {
    type: Number,
    default: 1,
    min: 1,
    max: 4
  },
  COMPLETEDAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ShopOnboardingStatus', shopOnboardingSchema);
