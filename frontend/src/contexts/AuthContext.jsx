import { createContext, useContext, useState, useEffect } from "react";
import API from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("userName");
    if (token) {
      setUser({ token, name: name || "User" });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await API.post("/login", { email, password });
    const { access_token, refresh_token, name } = response.data;

    localStorage.setItem("token", access_token);
    localStorage.setItem("refreshToken", refresh_token);
    localStorage.setItem("userName", name || "User");
    setUser({ token: access_token, name: name || "User" });

    return response.data;
  };

  const register = async (email, password, name) => {
    const response = await API.post("/register", { email, password, name });
    return response.data;
  };

  const googleAuth = async (credential) => {
    const response = await API.post("/google", { token: credential });
    return response.data; // { signup_token, email, message }
  };

  const completeSignup = async (signupToken, name, password) => {
    const response = await API.post("/complete-signup", {
      signup_token: signupToken,
      name,
      password,
    });
    return response.data;
  };

  const googleLogin = async (credential) => {
    const response = await API.post("/google-login", { token: credential });
    const { access_token, refresh_token, name } = response.data;

    localStorage.setItem("token", access_token);
    localStorage.setItem("refreshToken", refresh_token);
    localStorage.setItem("userName", name || "User");
    setUser({ token: access_token, name: name || "User" });

    return response.data;
  };

  const logout = async () => {
    try {
      // Call logout endpoint to invalidate refresh token on server
      await API.post("/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear auth keys regardless of API call success
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userName");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, googleLogin, register, googleAuth, completeSignup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
