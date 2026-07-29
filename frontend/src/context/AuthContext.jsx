import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem("adsoft_current_user");
    return stored ? JSON.parse(stored) : null;
  });

  async function login(email, senha) {
    const { data } = await api.post("/usuarios/login", { email, senha });
    const usuario = { ...data.data, isAdmin: data.data.isAdmin === 1 || data.data.isAdmin === true };
    sessionStorage.setItem("adsoft_current_user", JSON.stringify(usuario));
    setUser(usuario);
    return usuario;
  }

  function logout() {
    sessionStorage.removeItem("adsoft_current_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
