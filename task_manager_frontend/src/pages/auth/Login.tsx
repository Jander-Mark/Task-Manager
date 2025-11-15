import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Esquema de validação com Zod
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { login, error, message, clearError, loading, sendPasswordReset } = useAuth();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    getValues, 
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      // Erro já é tratado no contexto
    }
  };

  const handlePasswordReset = async () => {
    clearError(); 
    const email = getValues("email"); 
    
    if (!email) {
      alert("Por favor, digite seu email no campo 'Email' primeiro.");
      return;
    }

    try {
      await sendPasswordReset(email);
    } catch (err) {
      // Falha! O AuthContext vai definir o 'error'
    }
  };

  return (
    // **** ALTERAÇÃO 1: Div externo com a imagem de fundo ****
    <div className="flex min-h-screen items-center justify-center bg-cover bg-center bg-[url('/auth-bg.jpg')]">
      
      {/* **** ALTERAÇÃO 2: Card com efeito fosco/transparente **** */}
      <div className="w-full max-w-md space-y-8 rounded-lg bg-black/40 p-8 shadow-2xl backdrop-blur-md border border-gray-100/20">
        
        <div className="text-center">
          {/* **** ALTERAÇÃO 3: Cores do texto **** */}
          <h2 className="text-3xl font-extrabold text-white">Entrar</h2>
          <p className="mt-2 text-sm text-gray-200">
            Ou{' '}
            <Link to="/register" className="font-medium text-blue-300 hover:text-blue-200">
              criar uma nova conta
            </Link>
          </p>
        </div>
        
        {error && (
          // **** ALTERAÇÃO 3: Cores do Alerta ****
          <div className="rounded-md bg-red-900/50 p-4 border border-red-300/30">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-200">{error}</h3>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={clearError}
                    className="inline-flex rounded-md bg-red-900/10 p-1.5 text-red-300 hover:bg-red-900/50"
                  >
                    <span className="sr-only">Fechar</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {message && (
          // **** ALTERAÇÃO 3: Cores do Alerta ****
           <div className="rounded-md bg-green-900/50 p-4 border border-green-300/30">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-200">{message}</h3>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 rounded-md">
            <div>
              {/* **** ALTERAÇÃO 3: Cores do Label **** */}
              <label htmlFor="email" className="block text-sm font-medium text-gray-200">
                Email
              </label>
              {/* **** ALTERAÇÃO 4: Estilo do Input **** */}
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className="mt-1 block w-full rounded-md border border-gray-300/50 bg-white/20 px-3 py-2 text-white shadow-sm placeholder:text-gray-300 focus:border-blue-300 focus:outline-none focus:ring-blue-300 sm:text-sm"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className="mt-1 block w-full rounded-md border border-gray-300/50 bg-white/20 px-3 py-2 text-white shadow-sm placeholder:text-gray-300 focus:border-blue-300 focus:outline-none focus:ring-blue-300 sm:text-sm"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-300">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="text-sm">
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={loading}
                className="font-medium text-blue-300 hover:text-blue-200 disabled:opacity-50"
              >
                Esqueceu a senha?
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
            >
              {loading ? 'Carregando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;