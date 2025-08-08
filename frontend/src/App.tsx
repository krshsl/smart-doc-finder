import React from "react";
import { BrowserRouter } from "react-router";

import { AuthProvider } from "./auth/AuthContext";
import AppRouter from "./router/AppRouter";

import "./App.css";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRouter></AppRouter>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
