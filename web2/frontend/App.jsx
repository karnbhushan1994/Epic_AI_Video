import "./app.css"; // ✅ Import global styles first
import { BrowserRouter } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavMenu } from "@shopify/app-bridge-react";
import Routes from "./Routes";
import { QueryProvider, PolarisProvider } from "./components";
export default function App() {
  const pages = import.meta.glob("./pages/**/*.([jt]sx)", {
    eager: true,
  });
  const { t } = useTranslation();

  return (
    <PolarisProvider>
      <BrowserRouter>
        <QueryProvider>
          <NavMenu>
            <a href="/" rel="home" />
            <a href="/image">{t("NavigationMenu.image")}</a>
            <a href="/video">{t("NavigationMenu.video")}</a>
             <a href="/library">{t("NavigationMenu.library")}</a>
            <a href="/helpSupport">{t("NavigationMenu.helpSupport")}</a>
          </NavMenu>
          <Routes pages={pages} />
        </QueryProvider>
      </BrowserRouter>
    </PolarisProvider>
  );
}
