import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Esquema de validação com Zod
const registerSchema = z
  .object({
    name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'], // Onde o erro será exibido
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const { register: authRegister, error, clearError, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await authRegister(data.name, data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      // Erro já é tratado no contexto
    }
  };

  return (
    // **** ALTERAÇÃO 1: Div externo com a imagem de fundo ****
    <div className="flex min-h-screen items-center justify-center bg-cover bg-center bg-[url('/auth-bg.jpg')]">
      
      {/* **** ALTERAÇÃO 2: Card com efeito fosco/transparente **** */}
      <div className="w-full max-w-md space-y-8 rounded-lg bg-black/40 p-8 shadow-2xl backdrop-blur-md border border-gray-100/20">
        
        <div className="text-center">
          {/* **** ALTERAÇÃO 3: Cores do texto **** */}
          <h2 className="text-3xl font-extrabold text-white">Criar conta</h2>
          <p className="mt-2 text-sm text-gray-200">
            Já tem uma?{' '}
            <Link to="/login" className="font-medium text-blue-300 hover:text-blue-200">
              Faça login
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

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 rounded-md">
            <div>
              {/* **** ALTERAÇÃO 3: Cores do Label **** */}
              <label htmlFor="name" className="block text-sm font-medium text-gray-200">
                Nome
              </label>
              {/* **** ALTERAÇÃO 4: Estilo do Input **** */}
              <input
                id="name"
                type="text"
                autoComplete="name"
                {...register('name')}
                className="mt-1 block w-full rounded-md border border-gray-300/50 bg-white/20 px-3 py-2 text-white shadow-sm placeholder:text-gray-300 focus:border-blue-300 focus:outline-none focus:ring-blue-300 sm:text-sm"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-300">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200">
                Email
              </label>
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
                autoComplete="new-password"
                {...register('password')}
                className="mt-1 block w-full rounded-md border border-gray-300/50 bg-white/20 px-3 py-2 text-white shadow-sm placeholder:text-gray-300 focus:border-blue-300 focus:outline-none focus:ring-blue-300 sm:text-sm"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-300">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200">
                Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register('confirmPassword')}
                className="mt-1 block w-full rounded-md border border-gray-300/50 bg-white/20 px-3 py-2 text-white shadow-sm placeholder:text-gray-300 focus:border-blue-300 focus:outline-none focus:ring-blue-300 sm:text-sm"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-300">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;