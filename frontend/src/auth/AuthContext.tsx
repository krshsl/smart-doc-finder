import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";

import api, { setupInterceptors } from "../services/api";
import eventBus from "../services/eventBus";

export type UserRole = "user" | "admin" | "moderator";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (formData: FormData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const decodeToken = (token: string): User | null => {
  try {
    const payloadBase64 = token.split(".")[1];
    return JSON.parse(atob(payloadBase64));
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("authToken"),
  );

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
  };

  useEffect(() => {
    setupInterceptors();

    const handleLogoutEvent = () => logout();

    eventBus.on("logout", handleLogoutEvent);

    if (token) {
      const decodedUser = decodeToken(token);
      if (decodedUser) setUser(decodedUser);
      else logout();
    }

    return () => {
      eventBus.remove("logout", handleLogoutEvent);
    };
  }, [token]);

  const login = async (formData: FormData) => {
    const params = new URLSearchParams(formData as any);

    const response = await api.post("/login", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const { access_token } = response.data;

    if (access_token) {
      localStorage.setItem("authToken", access_token);
      setToken(access_token);
      const decodedUser = decodeToken(access_token);
      if (decodedUser) {
        setUser(decodedUser);
      } else {
        throw new Error("Received an invalid token from the server.");
      }
    } else {
      throw new Error("Login failed: No access token received from server.");
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
