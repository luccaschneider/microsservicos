'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { JavaClient } from '@/lib/api/java-client';
import type { Usuario } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, CheckCircle } from 'lucide-react';
import { useServiceStatus } from '@/components/ServiceStatus';
import { ServiceError } from '@/components/ServiceError';

const perfilSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  cpf: z.string().min(11, 'CPF deve ter no mínimo 11 caracteres').max(14, 'CPF inválido').optional(),
  telefone: z.string().optional(),
});

type PerfilForm = z.infer<typeof perfilSchema>;

export default function PerfilPage() {
  const { data: session } = useSession();
  const serviceStatus = useServiceStatus();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PerfilForm>({
    resolver: zodResolver(perfilSchema),
  });

  useEffect(() => {
    const loadUsuario = async () => {
      if (!session?.accessToken) {
        setLoading(false);
        return;
      }

      if (!serviceStatus.java) {
        setLoading(false);
        setError('java');
        return;
      }

      try {
        const javaClient = new JavaClient(() => session.accessToken as string);
        const data = await javaClient.getMe();
        setUsuario(data);
        reset({
          nome: data.nome,
          cpf: data.cpf || '',
          telefone: data.telefone || '',
        });
        setError(null);
      } catch (err: any) {
        if (err.code === 'ECONNREFUSED' || err.response?.status === 0) {
          setError('java');
        } else {
          setError('Erro ao carregar dados do perfil. Tente novamente.');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadUsuario();
  }, [session, reset, serviceStatus.java]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  const onSubmit = async (data: PerfilForm) => {
    if (!session?.accessToken || !usuario) return;

    setSalvando(true);
    setError(null);
    setSuccess(null);

    try {
      const javaClient = new JavaClient(() => session.accessToken as string);
      const updated = await javaClient.updateMe({
        nome: data.nome,
        cpf: data.cpf,
        telefone: data.telefone,
      });
      setUsuario(updated);
      setSuccess('Dados atualizados com sucesso!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar dados. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div>Carregando perfil...</div>
      </div>
    );
  }

  if (error === 'java') {
    return (
      <div>
        <ServiceError service="java" onRetry={handleRetry} />
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Erro ao carregar dados do usuário.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gerencie suas informações pessoais
        </p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
          <CheckCircle className="mr-2 h-5 w-5" />
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Informações Básicas
            </CardTitle>
            <CardDescription>
              Dados cadastrais do seu perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={usuario.email} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500 mt-1">
                  O email não pode ser alterado
                </p>
              </div>

              <div>
                <Label>Status dos Dados</Label>
                <div className="mt-2">
                  {usuario.dadosCompletos ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      <span className="text-sm">Dados completos</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-yellow-600">
                      <User className="mr-2 h-4 w-4" />
                      <span className="text-sm">Dados incompletos - Complete abaixo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completar Dados</CardTitle>
            <CardDescription>
              Preencha suas informações adicionais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  {...register('nome')}
                  placeholder="Seu nome completo"
                  defaultValue={usuario.nome}
                />
                {errors.nome && (
                  <p className="text-sm text-red-600">{errors.nome.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  {...register('cpf')}
                  placeholder="000.000.000-00"
                  defaultValue={usuario.cpf || ''}
                />
                {errors.cpf && (
                  <p className="text-sm text-red-600">{errors.cpf.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  {...register('telefone')}
                  placeholder="(00) 00000-0000"
                  defaultValue={usuario.telefone || ''}
                />
                {errors.telefone && (
                  <p className="text-sm text-red-600">{errors.telefone.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

