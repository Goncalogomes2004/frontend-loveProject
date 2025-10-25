import { createContext, useContext, useEffect, useState } from "react";
import { createLoveAPI } from "./api/loveApi";

export interface User {
  id?: number;
  username: string;
  email: string;
  password_hash?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  api: ReturnType<typeof createLoveAPI>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("userName"); // ou um objeto JSON completo
    if (storedUser) {
      return {
        id: Number(localStorage.getItem("userId") || undefined),
        username: localStorage.getItem("userName") || "",
        email: localStorage.getItem("userMail") || "",
        // password_hash e datas podem ficar undefined
      };
    }
    return null;
  });
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  // API com token sempre atualizado
  const api = createLoveAPI(token || undefined);

  const login = async (email: string, password: string) => {
    const apiNoToken = createLoveAPI();
    const response = await apiNoToken.authControllerLogin({ email, password });
    const { access_token, user } = response.data;

    setToken(access_token);
    setUser(user);
    localStorage.setItem("token", access_token);
    localStorage.setItem("userName", user.username);
    localStorage.setItem("userMail", user.email);
    localStorage.setItem("userId", user.id?.toString() || "");
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userMail");
    localStorage.removeItem("userId");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
