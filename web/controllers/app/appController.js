// web/controllers/appController.js
import { AppInstallation } from "../../models/AppInstallation.js";

export async function createOrUpdateAppInstall(session) {
  if (!session || !session.shop || !session.accessToken) return;

  await AppInstallation.findOneAndUpdate(
    { shop: session.shop },
    {
      $setOnInsert: {
        installedAt: new Date(),
      },
      $set: {
        accessToken: session.accessToken,
        scope: session.scope,
        uninstalledAt: null,
        appStatus: "installed",
      },
    },
    { upsert: true, new: true }
  );
}

export async function markAppUninstalled(shop) {
  if (!shop) return;

  await AppInstallation.findOneAndUpdate(
    { shop },
    {
      appStatus: "uninstalled",
      uninstalledAt: new Date(),
    }
  );
}
