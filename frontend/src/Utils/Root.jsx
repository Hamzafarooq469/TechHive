
// src/Root.jsx
import React, { useEffect } from "react";
import App from "../App";
import { useTranslation } from "react-i18next";
import { isRTL } from "./isRTL";

const Root = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const dir = isRTL(i18n.language) ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", i18n.language);
  }, [i18n.language]);

  return <App />;
};

export default Root;
