import mongoose from "mongoose";
const AppInstallationSchema = new mongoose.Schema({
  shop: { type: String, required: true, unique: true },
  accessToken: { type: String },
  scope: { type: String },
  installedAt: { type: Date, default: Date.now },
  uninstalledAt: { type: Date },
  appStatus: { type: String, default: "installed" },
  plan: {
    type: { type: String, default: 'free' },
    startDate: { type: Date, default: Date.now },
  },  
  // Shopify session-related fields
  sessionId: { type: String, unique: true, sparse: true },
  isOnline: { type: Boolean },
  state: { type: String },
  expires: { type: Date },
  onlineAccessInfo: { type: mongoose.Schema.Types.Mixed },
});

export const AppInstallation = mongoose.model("AppInstallation", AppInstallationSchema);
