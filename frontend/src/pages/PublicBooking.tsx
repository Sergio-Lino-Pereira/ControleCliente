import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { agendaService } from '../services/agenda.service';

export const PublicBooking: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [professional, setProfessional] = useState<any>(null);
    const [date, setDate] = useState<string>('');

    // Calendar related state
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [monthAvailability, setMonthAvailability] = useState<any[]>([]);
    const [calendarLoading, setCalendarLoading] = useState(false);
    const [slots, setSlots] = useState<any[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string>('');
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientWhatsapp, setClientWhatsapp] = useState('');
    const [loading, setLoading] = useState(true);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedService, setSelectedService] = useState<any>(null);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    useEffect(() => {
        if (!slug) return;
        agendaService.getProfessional(slug)
            .then(res => {
                setProfessional(res.data.professional);
                setLoading(false);
            })
            .catch(() => {
                setError('Profissional não encontrado.');
                setLoading(false);
            });
    }, [slug]);

    useEffect(() => {
        if (!slug) return;
        setCalendarLoading(true);
        agendaService.getMonthAvailability(slug, currentYear, currentMonth)
            .then(res => setMonthAvailability(res.data.availability))
            .catch(() => setError('Erro ao buscar disponibilidade do mês.'))
            .finally(() => setCalendarLoading(false));
    }, [slug, currentYear, currentMonth]);

    useEffect(() => {
        if (!date || !slug || !selectedService) return;
        setSlotsLoading(true);
        agendaService.getAvailability(slug, date, selectedService.duration)
            .then(res => {
                setSlots(res.data.slots);
                setSelectedSlot('');
            })
            .catch(() => setError('Erro ao buscar horários'))
            .finally(() => setSlotsLoading(false));
    }, [date, slug, selectedService]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await agendaService.createAppointment(slug!, {
                date,
                startTime: selectedSlot,
                clientName,
                clientEmail,
                clientWhatsapp: `55${clientWhatsapp}`,
                serviceId: selectedService.id
            });
            setBookingSuccess(true);
        } catch (err: any) {
            const backendMsg = err.response?.data?.message || 'Erro ao agendar horário. Tente novamente.';
            setError(backendMsg);
        }
    };

    const renderCalendar = () => {
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
        const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0-6

        const days = [];
        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        // Blank spaces
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="p-1 sm:p-2 border border-gray-100 bg-gray-50/50 rounded-md"></div>);
        }

        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            const availInfo = monthAvailability.find(a => a.date === dateStr);
            const today = new Date();
            const isPast = new Date(currentYear, currentMonth - 1, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

            let bgColor = 'bg-gray-50 border-gray-100 text-gray-400';
            let cursor = 'cursor-not-allowed';
            let slotsText = '';

            if (availInfo && availInfo.isWorkingDay && !isPast) {
                if (availInfo.availableSlots > 0) {
                    bgColor = 'bg-green-600 text-white border-green-700 hover:bg-green-700 shadow-sm';
                    cursor = 'cursor-pointer hover:-translate-y-0.5 transition-transform';
                    slotsText = `${availInfo.availableSlots} vagas`;
                } else {
                    bgColor = 'bg-red-400 text-white border-red-500';
                    cursor = 'cursor-not-allowed';
                    slotsText = 'Esgotado';
                }
            }
            if (date === dateStr) {
                bgColor = 'bg-blue-600 text-white border-blue-700 ring-4 ring-blue-200 scale-105 shadow-md z-10';
            }

            days.push(
                <div
                    key={d}
                    onClick={() => {
                        if (availInfo && availInfo.isWorkingDay && availInfo.availableSlots > 0 && !isPast) {
                            setDate(dateStr);
                        }
                    }}
                    className={`p-1 sm:p-3 border rounded-md relative flex flex-col items-center justify-center min-h-[50px] sm:min-h-[80px] ${bgColor} ${cursor}`}
                >
                    <span className="text-base sm:text-lg font-bold">{d}</span>
                    {slotsText && <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 font-medium opacity-90 text-center leading-tight">
                        <span className="sm:hidden">{slotsText === 'Esgotado' ? 'Lotado' : slotsText.replace(' vagas', 'v')}</span>
                        <span className="hidden sm:inline">{slotsText}</span>
                    </span>}
                </div>
            );
        }

        return (
            <div className="w-full">
                <div className="flex justify-between items-center mb-4 sm:mb-6 bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100">
                    <button
                        type="button"
                        onClick={() => {
                            if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(currentYear - 1); }
                            else setCurrentMonth(currentMonth - 1);
                            setDate('');
                        }}
                        className="px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-50 text-gray-700 font-medium border border-gray-200 transition-colors text-sm sm:text-base flex items-center justify-center"
                    >
                        &larr; <span className="hidden sm:inline ml-1">Anterior</span>
                    </button>
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-800 capitalize px-2 text-center leading-tight">
                        {new Date(currentYear, currentMonth - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button
                        type="button"
                        onClick={() => {
                            if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(currentYear + 1); }
                            else setCurrentMonth(currentMonth + 1);
                            setDate('');
                        }}
                        className="px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-50 text-gray-700 font-medium border border-gray-200 transition-colors text-sm sm:text-base flex items-center justify-center"
                    >
                        <span className="hidden sm:inline mr-1">Próximo</span> &rarr;
                    </button>
                </div>
                {calendarLoading ? (
                    <div className="py-20 text-center text-gray-500 flex flex-col items-center">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        Carregando calendário...
                    </div>
                ) : (
                    <div className="bg-white p-2 sm:p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-4">
                            {weekDays.map(w => (
                                <div key={w} className="text-center font-bold text-gray-500 py-1 sm:py-2 text-xs sm:text-base">
                                    {w}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1 sm:gap-3 px-1 sm:px-0">
                            {days}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div className="text-center py-20 text-xl font-medium text-gray-600">Carregando informações do profissional...</div>;
    if (error && !professional) return <div className="text-center py-20 text-red-600 text-xl font-semibold bg-red-50 mx-4 rounded-xl">{error}</div>;

    if (bookingSuccess) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-12 text-center">
                <div className="card bg-blue-50 border border-blue-200 shadow-xl">
                    <h2 className="text-4xl font-bold text-blue-700 mb-6">Solicitação Enviada! ⏳</h2>
                    <p className="text-blue-800 text-xl leading-relaxed">
                        Sua solicitação de agendamento com <strong>{professional?.name}</strong> para o serviço <strong>{selectedService?.name}</strong> no dia <strong>{date.split('-').reverse().join('/')}</strong> às <strong>{selectedSlot}</strong> foi registrada.
                    </p>
                    <p className="text-blue-800 text-lg font-medium mt-4">
                        Valor acordado: <strong>R$ {selectedService?.price || '0,00'}</strong>
                    </p>
                    <p className="text-blue-800 text-sm mt-4">
                        Por favor, aguarde a confirmação do profissional. As atualizações serão enviadas via WhatsApp automaticamente se você informou seu número.
                    </p>
                    
                    <div className="mt-8">
                        <button onClick={() => window.location.reload()} className="btn-primary px-8">Novo Agendamento</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Agendar com {professional?.name}</h1>
                <p className="text-gray-600 text-lg">Confira os serviços e horários disponíveis</p>
            </div>

            <div className="space-y-12">
                {/* Passo 1: Seleção de Serviço */}
                <div className="card bg-white rounded-2xl shadow-lg p-8 border-t-4 border-blue-500">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                        Selecione o Serviço
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {professional?.services && professional.services.length > 0 ? (
                            professional.services.map((service: any) => (
                                <div
                                    key={service.id}
                                    onClick={() => {
                                        setSelectedService(service);
                                        setDate('');
                                        setSelectedSlot('');
                                    }}
                                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between min-h-[140px] ${
                                        selectedService?.id === service.id
                                            ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100'
                                            : 'border-gray-100 bg-gray-50 hover:border-blue-300'
                                    }`}
                                >
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg mb-1">{service.name}</h3>
                                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                                            <span>⏱ {service.duration} min</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="text-blue-700 font-extrabold text-xl">
                                            R$ {service.price || '0,00'}
                                        </span>
                                        {selectedService?.id === service.id && (
                                            <span className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded-full uppercase tracking-tighter">Selecionado</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="col-span-full text-center py-8 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed">
                                Este profissional ainda não cadastrou serviços para agendamento online.
                            </p>
                        )}
                    </div>
                </div>

                {/* Passo 2: Calendário (Só aparece após serviço selecionado) */}
                {selectedService && (
                    <div className="animate-fade-in space-y-12">
                        <div className="card bg-white rounded-2xl shadow-lg p-8 border-t-4 border-green-500">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                                Escolha uma Data
                            </h2>
                            {renderCalendar()}
                        </div>

                        {/* Passo 3: Horários */}
                        {date && (
                            <div className="card border-t-4 border-t-purple-600 animate-slide-up bg-white rounded-2xl shadow-lg p-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                                    Horários para {date.split('-').reverse().join('/')}
                                </h2>
                                {slotsLoading ? (
                                    <div className="flex items-center space-x-3 text-gray-500 py-6">
                                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-lg">Calculando disponibilidade para {selectedService.duration} min...</p>
                                    </div>
                                ) : slots.length === 0 ? (
                                    <p className="text-red-500 bg-red-50 border border-red-200 p-6 rounded-xl font-medium text-lg text-center">
                                        Nenhum horário disponível para este serviço nesta data. Tente outro dia.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {slots.map(slot => (
                                            <button
                                                key={slot.time}
                                                onClick={() => slot.isAvailable && setSelectedSlot(slot.time)}
                                                disabled={!slot.isAvailable}
                                                className={`p-4 rounded-xl border-2 font-bold transition-all relative flex flex-col items-center justify-center min-h-[80px] ${
                                                    !slot.isAvailable 
                                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-70'
                                                    : selectedSlot === slot.time
                                                        ? 'bg-purple-600 text-white border-purple-600 shadow-lg scale-105 ring-4 ring-purple-100'
                                                        : slot.hasPending
                                                            ? 'bg-amber-50 text-amber-900 border-amber-300 hover:border-amber-500 hover:bg-amber-100 shadow-sm'
                                                            : 'bg-white text-gray-700 hover:border-purple-400 hover:text-purple-600 border-gray-200'
                                                    }`}
                                            >
                                                <span className="text-xl">{slot.time}</span>
                                                {!slot.isAvailable && (
                                                    <span className="text-[10px] sm:text-xs leading-tight mt-2 font-medium text-gray-500 uppercase tracking-widest text-center px-1">
                                                        Sem Tempo
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Passo 4: Dados Finais */}
                        {selectedSlot && (
                            <form onSubmit={handleSubmit} className="card bg-gray-50 border-t-4 border-t-amber-500 mt-8 space-y-6 animate-slide-up rounded-2xl shadow-lg p-8">
                                <h3 className="text-3xl font-bold mb-2 text-gray-900 text-center flex items-center justify-center gap-2">
                                    <span className="bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
                                    Finalize seu Agendamento
                                </h3>
                                <p className="text-center text-gray-600 mb-8">
                                    Você está agendando <strong>{selectedService.name}</strong> para o dia <strong>{date.split('-').reverse().join('/')}</strong> às <strong>{selectedSlot}</strong>.
                                    Valor: <strong>R$ {selectedService.price || '0,00'}</strong>
                                </p>
                                
                                <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                                    {/* ... inputs omitidos por brevidade, mantendo os mesmos campos ... */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Nome Completo</label>
                                        <input required type="text" className="input-field bg-white py-3 text-lg border-2 w-full" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Seu nome" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">E-mail</label>
                                        <input required type="email" className="input-field bg-white py-3 text-lg border-2 w-full" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="seu@email.com" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">WhatsApp</label>
                                        <div className="flex">
                                            <span className="inline-flex items-center px-4 rounded-l-md border-2 border-r-0 border-gray-300 bg-gray-50 text-gray-600 font-bold text-lg">
                                                +55
                                            </span>
                                            <input required type="text" className="flex-1 input-field bg-white py-3 text-lg border-2 !rounded-l-none" value={clientWhatsapp} onChange={e => setClientWhatsapp(e.target.value.replace(/\D/g, ''))} placeholder="DDD + Número" />
                                        </div>
                                    </div>
                                </div>
                                {error && <p className="text-red-600 mt-4 font-bold text-center bg-red-50 py-3 rounded-lg border border-red-200">{error}</p>}
                                <div className="pt-6">
                                    <button type="submit" className="btn-primary w-full text-xl py-5 mt-4 uppercase tracking-wider font-extrabold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all !bg-green-600 !border-green-700">
                                        Confirmar e Concordar com Valor: R$ {selectedService.price || '0,00'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
