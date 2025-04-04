// Import polyfill first
import './lib/global-polyfill';

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import { BrowserRouter } from "react-router-dom";
import { SocketContextProvider } from "./context/SocketContext";
import { MessagesContextProvider } from "./context/MessagesContext";
import { GroupsContextProvider } from "./context/GroupsContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <SocketContextProvider>
        <MessagesContextProvider>
          <GroupsContextProvider>
            <App />
          </GroupsContextProvider>
        </MessagesContextProvider>
      </SocketContextProvider>
    </BrowserRouter>
  </StrictMode>
);
