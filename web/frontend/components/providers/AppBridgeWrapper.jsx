import React, { useMemo } from "react";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import { BrowserRouter } from "react-router-dom";

import Routes from "../../Routes";
import { QueryProvider, PolarisProvider } from "../";
import { useTranslation } from "react-i18next";

export default function AppBridgeWrapper({ appBridgeConfig }) {
  const { t } = useTranslation();

  const NavMenu = useMemo(() => {
    const m = require("@shopify/app-bridge-react");
    return m.NavMenu;
  }, []);

  const AppBridgeProvider = useMemo(() => {
    const m = require("@shopify/app-bridge-react");
    return m.Provider;
  }, []);

  const pages = import.meta.glob("../../pages/**/!(*.test.[jt]sx)*.([jt]sx)", {
    eager: true,
  });

  return (
    <AppBridgeProvider config={appBridgeConfig}>
      <PolarisProvider>
        <BrowserRouter>
          <QueryProvider>
            <NavMenu>
              <a href="/" rel="home" />
              <a href="/image">{t("NavigationMenu.image")}</a>
              <a href="/video">{t("NavigationMenu.video")}</a>
            </NavMenu>
            <Routes pages={pages} />
          </QueryProvider>
        </BrowserRouter>
      </PolarisProvider>
    </AppBridgeProvider>
  );
}
