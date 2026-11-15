import type { EmpresaTipo, Role } from "@prisma/client";

export const EMPRESA_TIPOS: EmpresaTipo[] = [
  "PRODUTOR",
  "LOGISTICA",
  "BENEFICIAMENTO",
  "VENDA",
];

export const EMPRESA_TIPO_LABEL: Record<EmpresaTipo, string> = {
  PRODUTOR: "Produtor",
  LOGISTICA: "Logística",
  BENEFICIAMENTO: "Beneficiamento",
  VENDA: "Venda",
};

export const EMPRESA_TIPO_DESCRICAO: Record<EmpresaTipo, string> = {
  PRODUTOR: "Cultiva e colhe o café.",
  LOGISTICA: "Transporta a produção entre as etapas.",
  BENEFICIAMENTO: "Processa e prepara os grãos.",
  VENDA: "Comercializa o café com o consumidor final.",
};

export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Estudante",
  TEACHER: "Professor(a)",
};

export function getEmpresaTipoLabel(tipo: EmpresaTipo) {
  return EMPRESA_TIPO_LABEL[tipo];
}
