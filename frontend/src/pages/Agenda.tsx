import React, { useState, useEffect } from 'react';
import { agendaService } from '../services/agenda.service';

export const Agenda: React.FC = () => {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Calendar state
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [actionPopup, setActionPopup] = useState<{ id: string, status: string, appt: any } | null>(null);

    const fetchAppointments = () => {
        setLoading(true);
        agendaService.getAppointments().then(res => {
            setAppointments(res.data.appointments);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            await agendaService.updateAppointmentStatus(id, status);
            fetchAppointments();
        } catch (error) {
            alert('Erro ao atualizar status');
        }
    };

    // Derived data
    const selectedDayAppointments = appointments.filter(a => a.date.startsWith(selectedDate));
    
    // Monthly Summary
    const currentMonthPrefix = `${currentMonth.getFullYear()}-${(currentMonth.getMonth()+1).toString().padStart(2, '0')}`;
    const monthAppointments = appointments.filter(a => a.date.startsWith(currentMonthPrefix));
    const pendingCount = monthAppointments.filter(a => a.status === 'PENDING').length;
    const confirmedCount = monthAppointments.filter(a => a.status === 'CONFIRMED').length;

    // Calendar generation
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="p-2 border border-transparent"></div>);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            const dayAppts = appointments.filter(a => a.date.startsWith(dateStr));
            const hasConfirmed = dayAppts.some(a => a.status === 'CONFIRMED');
            const hasPending = dayAppts.some(a => a.status === 'PENDING');
            
            const isSelected = selectedDate === dateStr;
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            days.push(
                <div 
                    key={dateStr} 
                    onClick={() => setSelectedDate(dateStr)}
                    className={`p-2 min-h-[80px] border cursor-pointer transition-colors relative ${isSelected ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50 bg-white'} rounded-md`}
                >
                    <div className="flex justify-between items-start">
                        <span className={`text-sm font-medium ${isToday ? 'bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-gray-700'}`}>{d}</span>
                        {dayAppts.length > 0 && <span className="text-xs bg-gray-100 border text-gray-600 px-1.5 py-0.5 rounded-full font-bold">{dayAppts.length}</span>}
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-1">
                        {hasConfirmed && <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm" title="Possui confirmados"></div>}
                        {hasPending && <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-sm" title="Possui pendentes"></div>}
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-7 gap-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider py-2">{day}</div>
                ))}
                {days}
            </div>
        );
    };

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Minha Agenda</h1>

            {/* Resumo Base */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card bg-gradient-to-br from-blue-50 to-white border-l-4 border-l-blue-500">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Agendamentos no Mês</p>
                    <p className="text-4xl font-bold text-blue-700 mt-2">{monthAppointments.length}</p>
                </div>
                <div className="card bg-gradient-to-br from-yellow-50 to-white border-l-4 border-l-yellow-400">
                    <p className="text-sm font-semibold text-yellow-700 uppercase tracking-wide">Aguardando Confirmação</p>
                    <div className="flex items-center gap-3">
                        <p className="text-4xl font-bold text-yellow-600 mt-2">{pendingCount}</p>
                        {pendingCount > 0 && <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold animate-pulse">Ações necessárias</span>}
                    </div>
                </div>
                <div className="card bg-gradient-to-br from-green-50 to-white border-l-4 border-l-green-500">
                    <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Confirmados no Mês</p>
                    <p className="text-4xl font-bold text-green-600 mt-2">{confirmedCount}</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Calendário */}
                <div className="lg:col-span-2 card">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 capitalize">
                            {currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={prevMonth} className="btn-secondary px-3 py-1 font-bold text-lg">&lt;</button>
                            <button onClick={nextMonth} className="btn-secondary px-3 py-1 font-bold text-lg">&gt;</button>
                        </div>
                    </div>
                    {renderCalendar()}
                </div>

                {/* Lista do Dia Selecionado */}
                <div className="card h-fit">
                    <h3 className="text-xl font-bold mb-4 border-b pb-3 text-gray-800">
                        Dia {selectedDate.split('-').reverse().join('/')}
                    </h3>
                    
                    {loading ? (
                        <div className="py-8 text-center text-gray-500">Carregando...</div>
                    ) : selectedDayAppointments.length === 0 ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center mt-4">
                            <p className="text-gray-500">Nenhum agendamento para este dia.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                            {selectedDayAppointments.sort((a,b) => a.startTime.localeCompare(b.startTime)).map((appt) => (
                                <div key={appt.id} className={`p-4 rounded-lg border-l-4 shadow-sm bg-white border ${
                                    appt.status === 'CONFIRMED' ? 'border-l-green-500' : 
                                    appt.status === 'CANCELLED' ? 'border-l-red-500 bg-gray-50 opacity-60' : 
                                    'border-l-yellow-400'
                                }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="bg-gray-100 text-gray-800 font-bold px-2 py-1 rounded text-sm">
                                            {appt.startTime}
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                            appt.status === 'CONFIRMED' ? 'text-green-700 bg-green-100' : 
                                            appt.status === 'CANCELLED' ? 'text-red-700 bg-red-100' : 
                                            'text-yellow-800 bg-yellow-100'
                                        }`}>
                                            {appt.status}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-gray-900">{appt.clientName}</h4>
                                    <p className={`text-sm text-gray-500 ${!appt.clientWhatsapp ? 'mb-3' : 'mb-1'}`}>{appt.clientEmail}</p>
                                    {appt.clientWhatsapp && (
                                        <p className="text-sm text-gray-500 mb-3 flex items-center gap-1 font-medium">
                                            <span className="text-green-600 text-[10px]">💬</span> {appt.clientWhatsapp}
                                        </p>
                                    )}

                                    <div className="flex gap-2">
                                        {appt.status !== 'CANCELLED' && (
                                            <button onClick={() => setActionPopup({ id: appt.id, status: 'CANCELLED', appt })} className="flex-1 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors">
                                                Recusar/Cancelar
                                            </button>
                                        )}
                                        {appt.status !== 'CONFIRMED' && appt.status !== 'CANCELLED' && (
                                            <button onClick={() => setActionPopup({ id: appt.id, status: 'CONFIRMED', appt })} className="flex-1 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded transition-colors">
                                                Aprovar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Notification Popup Modal */}
            {actionPopup && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-slide-up">
                        <h3 className="text-2xl font-bold mb-4 text-gray-900 border-b pb-3">Confirmação de Ação</h3>
                        <p className="text-gray-700 mb-6 text-lg">
                            Você está prestes a <strong>{actionPopup.status === 'CONFIRMED' ? 'Aprovar' : 'Recusar'}</strong> este agendamento.
                            O cliente será notificado via WhatsApp automaticamente pelo sistema.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => {
                                    handleStatusUpdate(actionPopup.id, actionPopup.status);
                                    setActionPopup(null);
                                }}
                                className={`font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm text-white ${actionPopup.status === 'CONFIRMED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                Confirmar e Notificar
                            </button>
                            <button 
                                onClick={() => setActionPopup(null)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3.5 px-4 rounded-xl transition-colors"
                            >
                                Voltar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
