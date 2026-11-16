import { EmpresaTipo, NoticiaTipo, Role } from "@prisma/client";
import { z } from "zod";

export const noticiaSchema = z.object({
  id: z.string().optional(),
  titulo: z.string().trim().min(3, "Informe um título.").max(120),
  corpo: z.string().trim().min(10, "Informe o conteúdo da notícia.").max(2000),
  tipo: z.nativeEnum(NoticiaTipo),
  ativa: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});

export const parametroSchema = z.object({
  nome: z.string().min(1),
  valor: z.preprocess((v) => (typeof v === "string" ? Number(v.replace(",", ".")) : v), z.number().finite()),
  descricao: z.string().trim().min(3).max(300),
});

export const catalogoSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(2).max(120),
  descricao: z.string().trim().min(3).max(300),
  unidade: z.string().trim().min(1).max(40),
  preco: z.preprocess((v) => (typeof v === "string" ? Number(v.replace(",", ".")) : v), z.number().positive().max(1_000_000_000)),
  empresaTipo: z.preprocess((v) => (v === "" || v === "TODAS" ? null : v), z.nativeEnum(EmpresaTipo).nullable()),
  ativo: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});

export const empresaSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(3).max(120),
  tipo: z.nativeEnum(EmpresaTipo),
  saldo: z.preprocess((v) => (typeof v === "string" ? Number(v.replace(",", ".")) : v), z.number().min(0).max(1_000_000_000)),
});

export const usuarioSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(3).max(120),
  email: z.string().trim().email("E-mail inválido."),
  role: z.nativeEnum(Role),
  empresaId: z.preprocess((v) => (v === "" ? null : v), z.string().nullable()),
  senha: z.string().optional().or(z.literal("")),
});

export const eventoTemplateSchema = z.object({
  id: z.string().optional(),
  titulo: z.string().trim().min(3).max(120),
  descricao: z.string().trim().min(10).max(2000),
  tipoNoticia: z.nativeEnum(NoticiaTipo),
  impactoTexto: z.string().trim().max(300).optional().or(z.literal("")),
  ativo: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});
