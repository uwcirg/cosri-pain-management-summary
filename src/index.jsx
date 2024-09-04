import "react-app-polyfill/stable";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./utils/fontawesomeLibrary";

import Root from "./containers/Root";

import "./styles/App.scss";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <Root />
  </BrowserRouter>
);
