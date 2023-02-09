import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import * as serviceWorker from "./serviceWorker";

import "./utils/fontawesomeLibrary";

import Root from "./containers/Root";

import "./styles/App.scss";

const domNode = document.getElementById("root");
const root = createRoot(domNode);
root.render(
  <Router basename={process.env.PUBLIC_URL}>
    <Root />
  </Router>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
