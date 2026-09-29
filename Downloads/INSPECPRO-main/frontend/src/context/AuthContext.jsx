import { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(authService.getUsuarioLocal());
  const [loading, setLoading] = useState(true);

  // Ao carregar a aplicação, valida se o token salvo ainda é válido.
  useEffect(() => {
    async function validarSessao() {
      const token = authService.getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const usuarioAtual = await authService.me();
        setUsuario(usuarioAtual);
      } catch {
        authService.logout();
        setUsuario(null);
      } finally {
        setLoading(false);
      }
    }
    validarSessao();
  }, []);

  async function login(email, senha) {
    const usuarioLogado = await authService.login(email, senha);
    setUsuario(usuarioLogado);
    return usuarioLogado;
  }

  async function atualizarPerfil(dados) {
    const usuarioAtualizado = await authService.atualizarPerfil(dados);
    setUsuario(usuarioAtualizado);
    return usuarioAtualizado;
  }

  function logout() {
    authService.logout();
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout, atualizarPerfil, autenticado: !!usuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
