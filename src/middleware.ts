import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

/**
 * Proteção de rotas na borda (Edge Middleware).
 *
 * - Sem sessão válida: redireciona para /login?callbackUrl=...
 * - STUDENT em /professor: redireciona para /painel com aviso.
 * - TEACHER pode acessar todas as rotas, inclusive /painel (leitura).
 *
 * As páginas também revalidam o papel no servidor (requireTeacher), garantindo
 * defesa em profundidade caso o token fique desatualizado.
 */
export default withAuth(
  function middleware(request) {
    const { pathname } = request.nextUrl;
    const role = request.nextauth.token?.role;

    if (pathname.startsWith("/professor") && role !== "TEACHER") {
      const url = request.nextUrl.clone();
      url.pathname = "/painel";
      url.search = "";
      url.searchParams.set("aviso", "acesso-negado");
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
  },
);

export const config = {
  matcher: [
    /*
     * Protege tudo, exceto:
     * - /api/auth (rotas do próprio NextAuth)
     * - /login
     * - arquivos estáticos do Next e assets com extensão
     */
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
