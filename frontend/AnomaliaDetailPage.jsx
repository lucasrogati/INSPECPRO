import { Clock, Loader2, CheckCircle2, AlertCircle, Wrench, Eye } from 'lucide-react';

export const PERFIS_GESTAO = ['administrador', 'gestor', 'engenheiro'];
export const PERFIS_EXCLUSAO = ['administrador', 'gestor'];
export const PERFIS_FOTOS = ['administrador', 'gestor', 'engenheiro', 'manutencao'];

export const PRIORIDADE_CONFIG = {
  baixa: { label: 'Baixa', bg: '#f0fdf4', text: '#15803d', cor: '#22c55e' },
  media: { label: 'Média', bg: '#fffbeb', text: '#b45309', cor: '#eab308' },
  alta: { label: 'Alta', bg: '#fff7ed', text: '#c2410c', cor: '#f97316' },
  critica: { label: 'Crítica', bg: '#fef2f2', text: '#b91c1c', cor: '#dc2626' },
};

export const STATUS_ANOMALIA_CONFIG = {
  identificado: { label: 'Identificado', bg: '#f1f5f9', text: '#475569', cor: '#94a3b8', icon: AlertCircle },
  pendente: { label: 'Pendente', bg: '#fff7ed', text: '#c2410c', cor: '#f97316', icon: Clock },
  em_manutencao: { label: 'Em Manutenção', bg: '#eff6ff', text: '#1d4ed8', cor: '#3b82f6', icon: Wrench },
  aguardando_verificacao: { label: 'Aguardando Verificação', bg: '#faf5ff', text: '#7e22ce', cor: '#a855f7', icon: Eye },
  resolvido: { label: 'Resolvido', bg: '#f0fdf4', text: '#15803d', cor: '#22c55e', icon: CheckCircle2 },
};

export const STATUS_MANUTENCAO_CONFIG = {
  agendada: { label: 'Agendada', bg: '#f1f5f9', text: '#475569', cor: '#94a3b8', icon: Clock },
  em_andamento: { label: 'Em Andamento', bg: '#fffbeb', text: '#d97706', cor: '#f59e0b', icon: Loader2 },
  concluida: { label: 'Concluída', bg: '#f0fdf4', text: '#15803d', cor: '#22c55e', icon: CheckCircle2 },
};

export const CATEGORIAS_SUGERIDAS = [
  'Elétrica',
  'Hidráulica',
  'Estrutural',
  'Pintura / Acabamento',
  'Impermeabilização',
  'Incêndio / Segurança',
  'Climatização',
  'Esquadrias',
  'Outros',
];
