import axios from 'axios';
import { auth } from '@/firebaseConfig'; // Importe o auth

// URL da sua API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor (MODIFICADO para ser assíncrono)
api.interceptors.request.use(
  async (config) => { // <-- Agora é async
    
    // Pega o usuário atual do Firebase Auth
    const user = auth.currentUser; 

    if (user) {
      try {
        // Pega o Token ID do Firebase (isso atualiza o token se necessário)
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (err) {
        console.error("Erro ao obter token do Firebase:", err);
        // Opcional: redirecionar para login ou tratar erro
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de resposta (MODIFICADO para deslogar do Firebase)
api.interceptors.response.use(
  (response) => response,
  async (error) => { // <-- Agora é async
    if (error.response && error.response.status === 401) {
      // Token expirado ou inválido
      await auth.signOut(); // Desloga do Firebase
      // Não precisa mais de window.location.href, o AuthProvider cuidará do redirecionamento
    }
    return Promise.reject(error);
  }
);

export default api;