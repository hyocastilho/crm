export type Sessao = {
  role: "admin" | "atendente";
  businessName: string;
};

export type Contato = {
  id: string;
  name: string;
  phone: string | null;
  instagram_username: string | null;
};

export type ConversaResumo = {
  id: string;
  channel: "whatsapp" | "instagram";
  stage: string;
  status: string;
  handler: "bot" | "humano";
  lastMessageAt: string;
  preview: string;
  contact: Contato;
};

export type Mensagem = {
  id: string;
  direction: "in" | "out";
  author: "customer" | "bot" | "human";
  body: string;
  created_at: string;
};

export const ETAPAS = [
  { value: "novo", label: "Novo" },
  { value: "em_atendimento", label: "Em atendimento" },
  { value: "orcamento", label: "Orçamento" },
  { value: "pedido", label: "Pedido" },
  { value: "pago", label: "Pago" },
  { value: "perdido", label: "Perdido" },
] as const;

export function rotuloEtapa(valor: string) {
  return ETAPAS.find((etapa) => etapa.value === valor)?.label ?? valor;
}

export function rotuloCanal(valor: string) {
  return valor === "whatsapp" ? "WhatsApp" : "Instagram";
}

export function horaCurta(iso: string) {
  const data = new Date(iso);
  const hoje = new Date();
  if (data.toDateString() === hoje.toDateString()) {
    return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
