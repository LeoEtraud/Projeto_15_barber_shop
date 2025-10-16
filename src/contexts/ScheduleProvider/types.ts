export interface IBarbers {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  data_nascimento: string;
  especialidade: string;
  avatar?: string;
  qtd_atendimentos: number;
  nota_avaliacao: number;
  status: string;
}

export interface IServices {
  id: string;
  nome: string;
  preco: string;
  duracao: number;
  imagem?: string;
}

export interface ISchedules {
  id: string;
  data_agendamento: string;
  hora_inicio: string;
  hora_fim: string;
}

export interface IContext {
  barbers: IBarbers[];
  fetchBarbers: () => void;
  services: IServices[];
  fetchServices: () => void;
  schedules: ISchedules[];
  fetchSchedules: () => void;
}

export interface IScheduleProvider {
  children: JSX.Element;
}
