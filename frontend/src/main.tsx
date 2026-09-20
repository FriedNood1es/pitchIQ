import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { warmCrests } from "./crests";
import "./index.css";

const queryClient = new QueryClient();

// Badge lists load in the background; rows subscribe to the shared store
// instead of each fetching and merging on mount.
warmCrests();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
