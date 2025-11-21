'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { JavaClient } from '@/lib/api/java-client';
import { isOnline } from '@/lib/storage/offline-storage';
import { SyncService } from '@/lib/sync/sync-service';
import { loginOffline } from '@/lib/auth-offline';
import { signIn } from 'next-auth/react';

const cadastroSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  telefone: z.string().optional(),
});

type CadastroForm = z.infer<typeof cadastroSchema>;

export default function CadastroPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CadastroForm>({
    resolver: zodResolver(cadastroSchema),
  });

  const onSubmit = async (data: CadastroForm) => {
    setError(null);
    setLoading(true);

    const online = isOnline();

    try {
      if (online) {
        // Tentar cadastrar online primeiro
        try {
          const javaClient = new JavaClient();
          await javaClient.createUsuario({
            nome: data.nome,
            email: data.email,
            senha: data.senha,
            telefone: data.telefone,
          });

          // Fazer login automático após cadastro bem-sucedido
          try {
            const result = await signIn('credentials', {
              email: data.email,
              senha: data.senha,
              redirect: false,
            });

            if (result?.ok) {
              router.push('/eventos');
              router.refresh();
            } else {
              // Se login falhar, redirecionar para página de login
              router.push('/login?cadastro=sucesso');
            }
          } catch (loginErr) {
            // Se login falhar, redirecionar para página de login
            router.push('/login?cadastro=sucesso');
          }
          return;
        } catch (err: any) {
          // Se falhar e for erro de conexão, salvar offline
          if (err.code === 'ECONNREFUSED' || err.response?.status === 0 || err.message?.includes('Network Error')) {
            throw new Error('OFFLINE');
          }
          throw err;
        }
      } else {
        // Já está offline, salvar diretamente
        throw new Error('OFFLINE');
      }
    } catch (err: any) {
      if (err.message === 'OFFLINE' || !online) {
        // Salvar offline
        try {
          const syncService = new SyncService(() => null, () => null);
          const offlineId = await syncService.saveUsuarioOffline({
            nome: data.nome,
            email: data.email,
            senha: data.senha,
            telefone: data.telefone,
          });
          
          // Fazer login offline automático após cadastro
          const offlineSession = await loginOffline(data.email, data.senha);
          if (offlineSession) {
            // Login offline bem-sucedido - redirecionar para eventos
            setError(null);
            router.push('/eventos');
            router.refresh();
          } else {
            // Se login offline falhar, redirecionar para página de login
            setError(null);
            router.push('/login?cadastro=offline&id=' + offlineId);
          }
        } catch (offlineErr: any) {
          console.error('Erro ao salvar cadastro offline:', offlineErr);
          setError('Erro ao salvar cadastro offline. Tente novamente quando tiver conexão.');
        }
      } else {
        setError(err.response?.data?.message || 'Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Cadastro
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Crie sua conta para participar de eventos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg shadow-sm">
                <p className="font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                {...register('nome')}
                placeholder="Seu nome completo"
              />
              {errors.nome && (
                <p className="text-sm text-red-600">{errors.nome.message}</p>
              )}
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone (opcional)</Label>
              <Input
                id="telefone"
                {...register('telefone')}
                placeholder="(00) 00000-0000"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md" 
              disabled={loading}
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </Button>

            <div className="text-center text-sm">
              <a href="/login" className="text-blue-600 hover:underline">
                Já tem uma conta? Faça login
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

