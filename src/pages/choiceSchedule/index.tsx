import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

import { Header } from "@/components/Header";

type Service = {
  id: string;
  label: string;
  price: string;
  duration: string;
};

export function ChoiceSchedulePage() {
  const navigate = useNavigate();
  const location = useLocation() as {
    state?: {
      barberId?: string;
      selectedServices?: Service[];
    };
  };

  const { barberId, selectedServices } = location.state || {};

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Gerar próximos 7 dias
  const generateDates = () => {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);

      date.setDate(today.getDate() + i);

      // Formatar data no fuso horário local para evitar problemas de UTC
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      dates.push({
        value: dateString,
        label: date.toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        }),
        fullDate: date.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
      });
    }

    return dates;
  };

  // Horários disponíveis (8h às 18h, intervalos de 30min)
  const generateTimeSlots = () => {
    const slots = [];

    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

        slots.push(time);
      }
    }

    return slots;
  };

  const dates = generateDates();
  const timeSlots = generateTimeSlots();

  const handleSchedule = () => {
    if (selectedDate && selectedTime) {
      navigate("/confirm-appointment", {
        state: {
          barberId,
          selectedServices,
          selectedDate,
          selectedTime,
        },
      });
    }
  };

  return (
    <section className="min-h-screen bg-gray-800">
      {/* COMPONENTE CABEÇALH0 */}
      <Header />
      {/* Conteúdo principal */}
      <div className="px-4 pt-8 pb-14 md:px-8">
        <Helmet title="Selecionar data e horário" />

        <div className="mx-auto max-w-2xl">
          <button
            className="text-sm text-gray-300 hover:text-white mb-4"
            type="button"
            onClick={() => navigate(-1)}
          >
            Voltar
          </button>

          {/* Banner com imagem de fundo */}
          <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-800 h-40 mb-6">
            <img
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover opacity-100"
              src="/image-1.png"
            />
            <div className="absolute bottom-0 left-0 p-4">
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                Selecione a data e horário
              </h1>
            </div>
          </div>

          {/* Resumo do agendamento */}
          {selectedServices?.map((service) => (
            <div key={service.id} className="bg-gray-900 rounded-lg p-4 mb-6">
              <h3 className="text-white font-medium mb-2">
                Resumo do agendamento
              </h3>
              <div className="text-sm text-gray-300 space-y-1">
                <div>Serviço: {service.label}</div>
                <div>Preço: {service.price}</div>
                <div>Duração: {service.duration}</div>
                {barberId && <div>Barbeiro: #{barberId}</div>}
              </div>
            </div>
          ))}

          {/* Seleção de data */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">
              Escolha a data
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {dates.map((date) => (
                <button
                  key={date.value}
                  className={`p-3 rounded-lg text-center transition-colors ${
                    selectedDate === date.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-900 text-gray-300 hover:bg-gray-700"
                  }`}
                  type="button"
                  onClick={() => setSelectedDate(date.value)}
                >
                  <div className="text-sm font-medium">{date.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Seleção de horário */}
          {selectedDate && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-3">
                Escolha o horário
              </h2>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    className={`p-2 rounded-lg text-center text-sm transition-colors ${
                      selectedTime === time
                        ? "bg-green-600 text-white"
                        : "bg-gray-900 text-gray-300 hover:bg-gray-700"
                    }`}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Botão de confirmação */}
          {selectedDate && selectedTime && (
            <button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              type="button"
              onClick={handleSchedule}
            >
              Confirmar com Pagamento
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
