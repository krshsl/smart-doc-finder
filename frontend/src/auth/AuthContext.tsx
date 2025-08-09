import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";

import api, { setupInterceptors } from "../services/api";
import eventBus from "../services/eventBus";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (formData: FormData) => Promise<void>;
  logout: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);

  const logout = async () => {
    try {
      await api.post("/logout");
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("authToken");
    }
  };

  useEffect(() => {
    setupInterceptors();
    const handleLogoutEvent = () => logout();
    eventBus.on("logout", handleLogoutEvent);

    return () => {
      eventBus.remove("logout", handleLogoutEvent);
    };
  }, []);

  useEffect(() => {
    try {
      if (token) {
        const decodedUser = decodeToken(token);
        if (decodedUser) {
          setUser(decodedUser);
        } else {
          logout();
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
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
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {!isLoading && children}
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
