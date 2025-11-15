import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import api from '../services/api';
// Importe o 'auth' do seu novo arquivo de config e as funções do Firebase
import { auth } from '@/firebaseConfig'; 
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';

// Esta interface agora é para o *nosso* perfil de usuário do Firestore
interface User {
  id: string;
  nome: string;
  email: string;
}

interface AuthContextType {
  user: User | null; // Nosso perfil do Firestore
  firebaseUser: FirebaseUser | null; // O usuário do Firebase Auth
  loading: boolean;
  error: string | null;
  message: string | null; // <-- NOVO: Para mensagens de sucesso
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Mapeia erros do Firebase para Português
const getFirebaseAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Email inválido.';
    case 'auth/user-disabled':
      return 'Este usuário foi desabilitado.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email ou senha inválidos.';
    case 'auth/email-already-in-use':
      return 'Este email já está em uso.';
    case 'auth/weak-password':
      return 'A senha é muito fraca. Use pelo menos 6 caracteres.';
    default:
      return 'Ocorreu um erro. Tente novamente.';
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null); // Nosso perfil do Firestore
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null); // <-- NOVO

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (userAuth) => {
      if (userAuth) {
        setFirebaseUser(userAuth);
        
        if (user) {
          setLoading(false);
          return;
        }

        try {
          const response = await api.get('/auth/me'); 
          setUser(response.data); 
        } catch (err: any) {
          console.warn('Falha ao buscar /me em onAuthStateChanged:', err.message);
          setUser(null);
        }
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    setMessage(null); // <-- Limpa mensagem de sucesso
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(getFirebaseAuthErrorMessage(err.code));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    setMessage(null); // <-- Limpa mensagem de sucesso
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      const response = await api.post('/auth/register', { 
        nome: name, 
        email: email 
      });

      setUser(response.data); 
      setFirebaseUser(userCredential.user);

    } catch (err: any) {
      if (err.code) { 
        setError(getFirebaseAuthErrorMessage(err.code));
      } else { 
        setError(err.response?.data?.message || 'Erro ao criar perfil.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  const clearError = () => {
    setError(null);
    setMessage(null); // <-- Limpa mensagem de sucesso também
  };

  // ATUALIZADO
  const sendPasswordReset = async (email: string) => {
    setLoading(true);
    setError(null);
    setMessage(null); // <-- Limpa mensagens anteriores
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Email de redefinição de senha enviado! Verifique sua caixa de entrada (e spam)."); // <-- Define a mensagem de sucesso
    } catch (err: any) {
      setError(getFirebaseAuthErrorMessage(err.code));
      throw err; // Joga o erro para o Login.tsx saber que falhou
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        error,
        message, // <-- NOVO
        login,
        register,
        logout,
        clearError,
        sendPasswordReset
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};