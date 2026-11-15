"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type DemoAccount = {
  email: string;
  label: string;
  detail: string;
};

const DEMO_PASSWORD = "senha123";

export function LoginForm({
  callbackUrl,
  demoAccounts,
}: {
  callbackUrl: string;
  demoAccounts: DemoAccount[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!result?.ok || result.error) {
        setError(
          result?.error === "CredentialsSignin"
            ? "E-mail ou senha inválidos. Confira os dados e tente novamente."
            : "Não foi possível entrar agora. Tente novamente em instantes.",
        );
        setIsPending(false);
        return;
      }

      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError("Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.");
      setIsPending(false);
    }
  }

  function fillDemoAccount(account: DemoAccount) {
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);
    setError(null);
  }

  return (
    <>
      <noscript>
        <Alert variant="warning">
          <AlertCircle aria-hidden="true" className="h-4 w-4" />
          <AlertTitle>JavaScript necessário</AlertTitle>
          <AlertDescription>
            Ative o JavaScript no navegador para entrar no Euriptus.
          </AlertDescription>
        </Alert>
      </noscript>

      <form onSubmit={handleSubmit} method="post" className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="voce@escola.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="pl-10"
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "login-error" : undefined}
              disabled={isPending}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <LockKeyhole
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pl-10 pr-11"
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "login-error" : undefined}
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={showPassword}
              tabIndex={0}
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Eye aria-hidden="true" className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" id="login-error">
            <AlertCircle aria-hidden="true" className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              Entrando…
            </>
          ) : (
            <>
              Entrar
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {demoAccounts.length > 0 && (
        <details className="group mt-6 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
          <summary className="cursor-pointer select-none font-medium text-foreground marker:text-muted-foreground">
            Contas de demonstração
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (ambiente de desenvolvimento)
            </span>
          </summary>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Senha para todas as contas: <code className="rounded bg-background px-1.5 py-0.5 font-mono text-[0.7rem]">{DEMO_PASSWORD}</code>
          </p>
          <ul className="mt-3 space-y-1.5">
            {demoAccounts.map((account) => (
              <li key={account.email}>
                <button
                  type="button"
                  onClick={() => fillDemoAccount(account)}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-foreground">
                      {account.label}
                    </span>
                    <span className="block truncate text-[0.7rem] text-muted-foreground">
                      {account.email}
                    </span>
                  </span>
                  <span className="shrink-0 text-[0.68rem] font-medium text-primary">
                    Usar
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
