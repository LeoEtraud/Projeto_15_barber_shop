import { useState, useMemo, useEffect } from "react";
import { GetHorariosFuncionamento } from "@/contexts/ScheduleProvider/util";
import { IHorarioFuncionamento, IProfessionals } from "@/contexts/ScheduleProvider/types";
import { useAuth } from "@/contexts/AuthProvider/useAuth";
import { useSchedule } from "@/contexts/ScheduleProvider/useSchedule";
import { useLoading } from "@/contexts/LoadingProvider";
import { getDefaultBarberImage } from "@/utils/defaultImages";

// Função para obter as iniciais do barbeiro
function getInitials(nomeCompleto: string): string {
  const parts = nomeCompleto?.trim().split(" ") || [];

  if (parts.length === 0) return "";

  const first = parts[0]?.charAt(0)?.toUpperCase() || "";
  const last =
    parts.length > 1
      ? parts[parts.length - 1]?.charAt(0)?.toUpperCase() || ""
      : "";

  return `${first}${last}`;
}

// Função para obter URL do avatar
function getAvatarUrl(avatar: string | undefined): string | null {
  if (!avatar) return null;

  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }

  return `${import.meta.env.VITE_API_URL}/files/${avatar}`;
}

export function GerenciarAgendamentos() {
  const { user } = useAuth();
  const { professionals } = useSchedule();
  const { withLoading } = useLoading();
  const [horarios, setHorarios] = useState<IHorarioFuncionamento[]>([]);
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState<string | null>(null);

  // Buscar horários
  useEffect(() => {
    async function fetchHorarios() {
      const barbeariaId = user?.user?.barbeariaId;
      if (!barbeariaId) {
        return;
      }

      try {
        const response = await withLoading(GetHorariosFuncionamento(barbeariaId));
        
        // A API retorna os dados em hoursFunctionment
        const horariosDaAPI =
          response?.hoursFunctionment || response?.horarios || response || [];
        setHorarios(Array.isArray(horariosDaAPI) ? horariosDaAPI : []);
      } catch (error) {
        console.error("Erro ao buscar horários:", error);
        setHorarios([]);
      }
    }

    fetchHorarios();
  }, [user?.user?.barbeariaId, withLoading]);

  // Enriquecer horários com dados dos profissionais
  const horariosEnriquecidos = useMemo(() => {
    if (!Array.isArray(horarios) || horarios.length === 0) {
      return [];
    }
    
    const professionalsArray = Array.isArray(professionals) ? professionals : [];
    
    return horarios.map((horario) => {
      const profissionaisEnriquecidos = horario.profissionais_ids
        ?.map((id: string) => professionalsArray.find((p: IProfessionals) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => p !== undefined) || [];

      return {
        ...horario,
        profissionais: profissionaisEnriquecidos,
      };
    });
  }, [horarios, professionals]);

  // Filtrar barbeiros ativos
  const barbeirosAtivos = useMemo(() => {
    if (!Array.isArray(professionals)) {
      return [];
    }
    return professionals.filter((p) => p.status === "ATIVO");
  }, [professionals]);

  // Função para obter exceção de uma data específica
  const getExcecaoPorData = (data: Date): IHorarioFuncionamento | undefined => {
    return horariosEnriquecidos.find((excecao) => {
      if (!excecao.data_excecao || excecao.tipo_regra !== "EXCECAO") return false;
      const excecaoData = new Date(excecao.data_excecao);
      excecaoData.setHours(0, 0, 0, 0);
      const compararData = new Date(data);
      compararData.setHours(0, 0, 0, 0);
      return (
        excecaoData.getDate() === compararData.getDate() &&
        excecaoData.getMonth() === compararData.getMonth() &&
        excecaoData.getFullYear() === compararData.getFullYear()
      );
    });
  };

  // Função para gerar próximos 6 dias
  const gerarProximos6Dias = () => {
    const dias: Array<{ data: Date; diaSemana: string; horario?: IHorarioFuncionamento }> = [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    let diasAdicionados = 0;
    let i = 0;

    // Garante exatamente 6 dias
    while (diasAdicionados < 6) {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() + i);
      
      const diaSemanaNum = data.getDay();
      const diaSemanaMap: Record<number, string> = {
        0: "DOMINGO",
        1: "SEGUNDA",
        2: "TERCA",
        3: "QUARTA",
        4: "QUINTA",
        5: "SEXTA",
        6: "SABADO",
      };
      const diaSemana = diaSemanaMap[diaSemanaNum];

      // Para domingo, só mostra se houver exceção
      if (diaSemana === "DOMINGO") {
        const excecao = getExcecaoPorData(data);
        if (excecao && !excecao.is_feriado) {
          dias.push({ data, diaSemana, horario: excecao });
          diasAdicionados++;
        }
        // Se não houver exceção, pula o domingo mas continua contando
      } else {
        // Para outros dias, busca horário (exceção ou padrão)
        const excecao = getExcecaoPorData(data);
        const horarioPadrao = horariosEnriquecidos.find(
          (h) => h.dia_da_semana === diaSemana && h.tipo_regra === "PADRAO"
        );
        dias.push({ data, diaSemana, horario: excecao || horarioPadrao });
        diasAdicionados++;
      }
      
      i++;
    }

    return dias;
  };

  // Função para gerar slots de horário
  const gerarSlotsHorario = (
    horario: IHorarioFuncionamento | undefined,
    barbeiroId?: string | null
  ): Array<{ hora: string; disponivel: boolean; isAlmoco: boolean; isSlotAlmoco?: boolean }> => {
    if (!horario || horario.is_feriado) {
      return [];
    }

    const slots: Array<{ hora: string; disponivel: boolean; isAlmoco: boolean; isSlotAlmoco?: boolean }> = [];
    const [horaAbertura, minutoAbertura] = horario.horario_abertura.split(":").map(Number);
    const [horaFechamento, minutoFechamento] = horario.horario_fechamento.split(":").map(Number);

    let horaAtual = horaAbertura;
    let minutoAtual = minutoAbertura;
    let slotAlmocoAdicionado = false;

    while (horaAtual < horaFechamento || (horaAtual === horaFechamento && minutoAtual < minutoFechamento)) {
      const horaStr = `${String(horaAtual).padStart(2, "0")}:${String(minutoAtual).padStart(2, "0")}`;
      
      // Verifica se está no intervalo de almoço
      const isAlmoco = horario.tem_almoco &&
        horario.horario_almoco_inicio &&
        horario.horario_almoco_fim &&
        horaStr >= horario.horario_almoco_inicio &&
        horaStr < horario.horario_almoco_fim;

      // Se está no início do intervalo de almoço e ainda não adicionou o slot de almoço
      if (isAlmoco && !slotAlmocoAdicionado && horaStr === horario.horario_almoco_inicio && horario.horario_almoco_fim) {
        slots.push({
          hora: `${horario.horario_almoco_inicio} - ${horario.horario_almoco_fim}`,
          disponivel: false,
          isAlmoco: true,
          isSlotAlmoco: true,
        });
        slotAlmocoAdicionado = true;
        
        // Pula para o fim do almoço
        const [horaAlmocoFim, minutoAlmocoFim] = horario.horario_almoco_fim.split(":").map(Number);
        horaAtual = horaAlmocoFim;
        minutoAtual = minutoAlmocoFim;
        continue;
      }

      // Se não está no intervalo de almoço, adiciona slot normal
      if (!isAlmoco) {
        // Verifica se o barbeiro está disponível neste horário (se filtro ativo)
        let disponivel = true;
        if (barbeiroId && horario.profissionais) {
          disponivel = horario.profissionais.some((p) => p.id === barbeiroId);
        }

        slots.push({
          hora: horaStr,
          disponivel,
          isAlmoco: false,
        });
      }

      // Avança 30 minutos
      minutoAtual += 30;
      if (minutoAtual >= 60) {
        minutoAtual = 0;
        horaAtual++;
      }
    }

    return slots;
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">
        Grade de Disponibilidade (6 dias)
      </h3>
      
      {/* Abas de Filtro por Barbeiro */}
      <div className="bg-gray-800 rounded-lg p-2 mb-4 border border-gray-700">
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              barbeiroSelecionado === null
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            type="button"
            onClick={() => setBarbeiroSelecionado(null)}
          >
            Todos os Barbeiros
          </button>
          {barbeirosAtivos.map((barbeiro) => (
            <button
              key={barbeiro.id}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                barbeiroSelecionado === barbeiro.id
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
              type="button"
              onClick={() => setBarbeiroSelecionado(barbeiro.id)}
            >
              {barbeiro.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-6 gap-4 min-w-[800px]">
          {gerarProximos6Dias().map((diaInfo, index) => {
            const dataFormatada = `${String(diaInfo.data.getDate()).padStart(2, "0")}/${String(diaInfo.data.getMonth() + 1).padStart(2, "0")}`;
            const diaSemanaMap: Record<string, string> = {
              DOMINGO: "Dom",
              SEGUNDA: "Seg",
              TERCA: "Ter",
              QUARTA: "Qua",
              QUINTA: "Qui",
              SEXTA: "Sex",
              SABADO: "Sáb",
            };
            const diaSemana = diaSemanaMap[diaInfo.diaSemana] || diaInfo.diaSemana;
            const slots = gerarSlotsHorario(diaInfo.horario, barbeiroSelecionado);

            return (
              <div key={index} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                <div className="text-white font-semibold mb-2 text-center">
                  {diaSemana} {dataFormatada}
                </div>
                {diaInfo.horario && !diaInfo.horario.is_feriado ? (
                  <>
                    <div className="space-y-1 max-h-[400px] overflow-y-auto mb-3">
                      {slots.map((slot, slotIndex) => (
                        <div
                          key={slotIndex}
                          className={`text-xs p-1 rounded text-center ${
                            slot.isSlotAlmoco
                              ? "bg-gray-700 text-gray-300 py-2 font-medium"
                              : slot.disponivel
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {slot.isSlotAlmoco ? (
                            <span>Almoço: {slot.hora}</span>
                          ) : (
                            <>
                              {slot.hora} {slot.disponivel ? "•" : "■"}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Lista de Barbeiros */}
                    {diaInfo.horario.profissionais && diaInfo.horario.profissionais.length > 0 && (
                      <div className="pt-3 border-t border-gray-700">
                        <p className="text-xs text-gray-400 mb-2 font-medium">Barbeiros:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {diaInfo.horario.profissionais.map((profissional) => {
                            const avatarUrl = getAvatarUrl(profissional.avatar);
                            return (
                              <div
                                key={profissional.id}
                                className="flex items-center gap-1.5 bg-gray-700/50 rounded-lg px-2 py-1 border border-gray-600/50"
                              >
                                {avatarUrl ? (
                                  <img
                                    alt={profissional.nome}
                                    className="w-5 h-5 rounded-full object-cover border border-gray-600 flex-shrink-0"
                                    src={avatarUrl}
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                      e.currentTarget.nextElementSibling?.classList.remove("hidden");
                                    }}
                                  />
                                ) : null}
                                {(() => {
                                  if (avatarUrl) return null;
                                  
                                  return (
                                    <img
                                      alt={profissional.nome}
                                      className="w-5 h-5 rounded-full object-cover border border-gray-600 flex-shrink-0"
                                      src={getDefaultBarberImage(profissional.nome)}
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  );
                                })()}
                                <span className="text-white text-[10px] font-medium truncate max-w-[60px]">
                                  {profissional.nome}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-red-400 font-semibold">FECHADO</div>
                    {diaInfo.horario?.is_feriado && (
                      <div className="text-gray-400 text-xs mt-1">(padrão)</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h4 className="text-sm font-semibold text-white mb-3">Legenda:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-bold">•</span>
            <span className="text-gray-300 text-xs">disponível</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-400 font-bold">■</span>
            <span className="text-gray-300 text-xs">ocupado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-bold">Almoço</span>
            <span className="text-gray-300 text-xs">intervalo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-400 font-bold">FECHADO</span>
            <span className="text-gray-300 text-xs">sem slots</span>
          </div>
        </div>
      </div>
    </div>
  );
}

