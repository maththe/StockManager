import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Label } from '~/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Loader2, Package2 } from 'lucide-react';
import { useLogin } from '~/services/tanStackQuery/auth';
import { FormProvider, useForm } from 'react-hook-form';
import { InputForm } from '~/components/Form/InputForm';
import { Button } from '~/components/ui/button';
import { getCurrentUser } from '~/services/auth/currentUser';

export default function Login() {
  const login = useLogin();
  const form = useForm();
  const navigate = useNavigate();

  // Já autenticado? Vai direto para o painel
  useEffect(() => {
    if (getCurrentUser()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const onSubmit = async () => {
    const payload = {
      email: form.getValues('email'),
      senha: form.getValues('password'),
    };

    try {
      await login.mutateAsync(payload);
      navigate('/dashboard');
    } catch {
      // Erro já exibido em toast pelo useLogin
    }
  };

  const enterAsGuest = async () => {
    try {
      await login.mutateAsync({ email: 'admin@stockmanager.dev', senha: 'senha123' });
      navigate('/dashboard');
    } catch {
      // Erro já exibido em toast pelo useLogin
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
            StockManager
          </CardTitle>
          <CardDescription className="text-center">
            Gerencie seu estoque com rapidez e eficiência
          </CardDescription>
        </CardHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="grid gap-4 px-8 py-2">
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <InputForm
                  name="email"
                  type="email"
                  placeholder="nome@empresa.com"
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
                disabled={login.isPending}
              >
                {login.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Acessar Painel
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={login.isPending}
                onClick={enterAsGuest}
              >
                Entrar como visitante (demo)
              </Button>
              <p className="text-xs text-center text-muted-foreground -mt-2">
                Acesso completo com dados de exemplo, sem cadastro.
              </p>

              <p className="text-sm text-center text-muted-foreground">
                Não tem uma conta?{' '}
                <Link
                  to="/register"
                  className="text-primary font-medium hover:underline"
                >
                  Cadastre sua empresa
                </Link>
              </p>
            </CardFooter>
          </form>
        </FormProvider>
      </Card>
    </div>
  );
}
