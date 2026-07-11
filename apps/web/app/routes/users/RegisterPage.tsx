import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { FormProvider, useForm } from 'react-hook-form';
import { Loader2, Package2 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { InputForm } from '~/components/Form/InputForm';
import { useRegister } from '~/services/tanStackQuery/auth';
import { getCurrentUser } from '~/services/auth/currentUser';

interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  const register = useRegister();
  const form = useForm<RegisterFormValues>();
  const navigate = useNavigate();

  // Já autenticado? Vai direto para o painel
  useEffect(() => {
    if (getCurrentUser()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await register.mutateAsync({
        name: data.name,
        email: data.email,
        senha: data.password,
      });
      navigate('/');
    } catch {
      // Erro já exibido em toast pelo useRegister
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-tr from-primary/30 to-accent/30 blur-3xl opacity-30 transform rotate-45"></div>
      </div>

      <Card className="relative w-full max-w-md rounded-2xl bg-white/70 dark:bg-[#0b1220]/60 backdrop-blur-md border border-transparent shadow-2xl ring-1 ring-gray-200/40 dark:ring-0">
        <CardHeader className="space-y-1 flex flex-col items-center px-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary text-white mb-2 shadow-md">
            <Package2 className="w-6 h-6" />
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight">
            Criar conta
          </CardTitle>
          <CardDescription className="text-center">
            Cadastre sua empresa e comece a gerenciar o estoque
          </CardDescription>
        </CardHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="grid gap-4 px-8 py-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <InputForm
                  name="name"
                  placeholder="Seu nome"
                  required
                  className="bg-white/60 dark:bg-transparent"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <InputForm
                  name="email"
                  type="email"
                  placeholder="nome@empresa.com"
                  required
                  className="bg-white/60 dark:bg-transparent"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <InputForm
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="bg-white/60 dark:bg-transparent"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 px-8 pb-8 pt-2">
              <Button
                className="w-full bg-gradient-to-r from-primary to-secondary text-white shadow-md hover:opacity-95"
                type="submit"
                disabled={register.isPending}
              >
                {register.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Criar conta
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Já tem uma conta?{' '}
                <Link to="/" className="text-primary font-medium hover:underline">
                  Entrar
                </Link>
              </p>
            </CardFooter>
          </form>
        </FormProvider>
      </Card>
    </div>
  );
}
