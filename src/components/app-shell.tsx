"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { EmpresaTipo, Role } from "@prisma/client";
import {
  GraduationCap,
  Handshake,
  Landmark,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { EMPRESA_TIPO_LABEL, ROLE_LABEL } from "@/lib/empresa";
import { cn, getInitials } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const ROTAS_PRINCIPAIS: NavItem[] = [
  { href: "/painel", label: "Painel", icon: LayoutDashboard },
  { href: "/mercado", label: "Mercado", icon: TrendingUp },
  { href: "/negociacoes", label: "Negociações", icon: Handshake },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/banco", label: "Banco", icon: Landmark },
];

const ROTA_PROFESSOR: NavItem = {
  href: "/professor",
  label: "Painel do Professor",
  icon: GraduationCap,
};

export type AppShellUser = {
  nome: string;
  email: string;
  role: Role;
};

export type AppShellEmpresa = {
  nome: string;
  tipo: EmpresaTipo;
} | null;

export function AppShell({
  user,
  empresa,
  children,
}: {
  user: AppShellUser;
  empresa: AppShellEmpresa;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isTeacher = user.role === "TEACHER";
  const todasAsRotas = isTeacher
    ? [...ROTAS_PRINCIPAIS, ROTA_PROFESSOR]
    : ROTAS_PRINCIPAIS;

  const rotaAtual = todasAsRotas.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <div className="relative min-h-dvh bg-background">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <SidebarContent
          user={user}
          empresa={empresa}
          pathname={pathname}
          isTeacher={isTeacher}
        />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[19rem] max-w-[86vw] border-0 bg-sidebar p-0 text-sidebar-foreground"
        >
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <SheetDescription className="sr-only">
            Navegue entre as áreas do simulador Euriptus.
          </SheetDescription>
          <SidebarContent
            user={user}
            empresa={empresa}
            pathname={pathname}
            isTeacher={isTeacher}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-dvh flex-col lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:px-6 lg:px-8">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu de navegação"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Euriptus
            </p>
            <p className="truncate font-display text-lg font-semibold leading-tight">
              {rotaAtual?.label ?? "Simulador"}
            </p>
          </div>

          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0 text-right">
              <p className="max-w-[8.5rem] truncate text-sm font-medium sm:max-w-[14rem]">
                {user.nome}
              </p>
              <p className="hidden max-w-[14rem] truncate text-xs text-muted-foreground sm:block">
                {empresa
                  ? `${empresa.nome} · ${EMPRESA_TIPO_LABEL[empresa.tipo]}`
                  : ROLE_LABEL[user.role]}
              </p>
            </div>

            <span
              aria-hidden="true"
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary sm:flex"
            >
              {getInitials(user.nome)}
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={isSigningOut}
              aria-label="Sair da conta"
            >
              {isSigningOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </header>

        <main
          id="conteudo"
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10"
        >
          {children}
        </main>

        <footer className="mx-auto w-full max-w-6xl px-4 pb-6 pt-2 text-xs text-muted-foreground sm:px-6 lg:px-10">
          <p>Euriptus · Simulador educacional da cadeia produtiva do café.</p>
          <p className="mt-1">Iteração 1 — autenticação, empresas e estrutura do app.</p>
        </footer>
      </div>
    </div>
  );
}

function SidebarContent({
  user,
  empresa,
  pathname,
  isTeacher,
  onNavigate,
}: {
  user: AppShellUser;
  empresa: AppShellEmpresa;
  pathname: string;
  isTeacher: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-20 shrink-0 items-center border-b border-sidebar-border px-5 pr-12">
        <Link href="/painel" onClick={onNavigate}>
          <Brand inverted />
        </Link>
      </div>

      <nav
        aria-label="Navegação principal"
        className="flex flex-1 flex-col gap-7 overflow-y-auto px-3 py-6"
      >
        <div>
          <p className="px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-sidebar-muted">
            Navegação
          </p>
          <ul className="space-y-1">
            {ROTAS_PRINCIPAIS.map((item) => (
              <li key={item.href}>
                <NavLink
                  item={item}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </ul>
        </div>

        {isTeacher && (
          <div>
            <p className="px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-sidebar-muted">
              Gestão
            </p>
            <ul className="space-y-1">
              <li>
                <NavLink
                  item={ROTA_PROFESSOR}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              </li>
            </ul>
          </div>
        )}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-4">
        <div className="rounded-lg border border-sidebar-border bg-white/[0.04] p-3">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-sidebar-muted">
            Conectado como
          </p>
          <p className="mt-1 truncate text-sm font-medium text-sidebar-foreground">
            {user.nome}
          </p>
          <p className="truncate text-xs text-sidebar-muted">
            {empresa ? empresa.nome : ROLE_LABEL[user.role]}
          </p>
        </div>
        <p className="mt-3 px-1 text-[0.65rem] leading-relaxed text-sidebar-muted">
          Iteração 1 · base do simulador
        </p>
      </div>
    </div>
  );
}

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-white shadow-sm"
          : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "h-[1.15rem] w-[1.15rem] shrink-0",
          active ? "text-amber-300" : "text-sidebar-muted group-hover:text-amber-300/80",
        )}
      />
      <span className="truncate">{item.label}</span>
      {active && (
        <span
          aria-hidden="true"
          className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300"
        />
      )}
    </Link>
  );
}
