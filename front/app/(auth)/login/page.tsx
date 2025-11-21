'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loginOffline, clearOfflineSession } from '@/lib/auth-offline';
import { isOnline } from '@/lib/storage/offline-storage';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('cadastro') === 'sucesso') {
      setSuccess('Cadastro realizado com sucesso! Faça login para continuar.');
      router.replace('/login');
    } else if (searchParams.get('cadastro') === 'offline') {
      setSuccess('Cadastro salvo offline! Quando a conexão for restaurada, sua conta será criada automaticamente. Você poderá fazer login após a sincronização.');
      router.replace('/login');
    }
  }, [searchParams, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setLoading(true);

    try {
      const online = isOnline();

      // Se estiver offline, tentar login offline diretamente (sem passar pelo NextAuth)
      if (!online) {
        const offlineSession = await loginOffline(data.email, data.senha);
        if (offlineSession) {
          // Login offline bem-sucedido
          router.push('/eventos');
          router.refresh();
          return;
        } else {
          setError('Email ou senha inválidos');
          return;
        }
      }

      // Se estiver online, tentar login online primeiro
      try {
        const result = await signIn('credentials', {
          email: data.email,
          senha: data.senha,
          redirect: false,
        });

        if (result?.error) {
          // Se falhar online, tentar offline (pode ser que o usuário foi cadastrado offline)
          const offlineSession = await loginOffline(data.email, data.senha);
          if (offlineSession) {
            // Login offline bem-sucedido
            router.push('/eventos');
            router.refresh();
          } else {
            setError('Email ou senha inválidos');
          }
        } else {
          // Login online bem-sucedido - limpar sessão offline se existir
          clearOfflineSession();
          router.push('/eventos');
          router.refresh();
        }
      } catch (signInErr: any) {
        // Se o signIn falhar por erro de conexão, tentar offline
        if (signInErr.code === 'ECONNREFUSED' || signInErr.message?.includes('Network Error')) {
          const offlineSession = await loginOffline(data.email, data.senha);
          if (offlineSession) {
            router.push('/eventos');
            router.refresh();
          } else {
            setError('Email ou senha inválidos');
          }
        } else {
          setError('Erro ao fazer login. Tente novamente.');
        }
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Login
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-r-lg shadow-sm">
                <p className="font-medium">{success}</p>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg shadow-sm">
                <p className="font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="seu@email.com"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                {...register('senha')}
                placeholder="••••••"
              />
              {errors.senha && (
                <p className="text-sm text-red-600">{errors.senha.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md" 
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="text-center text-sm">
              <a href="/cadastro" className="text-blue-600 hover:underline">
                Não tem uma conta? Cadastre-se
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

