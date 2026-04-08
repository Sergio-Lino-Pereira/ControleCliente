import React, { useState, useEffect } from 'react';
import { agendaService } from '../services/agenda.service';

const DAYS_OF_WEEK = [
    { id: 0, label: 'Domingo' },
    { id: 1, label: 'Segunda-feira' },
    { id: 2, label: 'Terça-feira' },
    { id: 3, label: 'Quarta-feira' },
    { id: 4, label: 'Quinta-feira' },
    { id: 5, label: 'Sexta-feira' },
    { id: 6, label: 'Sábado' },
];

export const ConfigHorarios: React.FC = () => {
    const [slug, setSlug] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [profileSaved, setProfileSaved] = useState(false);
    const [showInDirectory, setShowInDirectory] = useState(true);
    const [autoConfirm, setAutoConfirm] = useState(false);
    const [settingsSaved, setSettingsSaved] = useState(false);
    const [services, setServices] = useState<any[]>([]);
    const [serviceSaved, setServiceSaved] = useState(false);

    // Store array of {dayOfWeek, startTime, endTime}
    const [hours, setHours] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [linkCopied, setLinkCopied] = useState(false);

    useEffect(() => {
        agendaService.getBusinessHours().then(res => {
            setHours(res.data.hours || []);
            setSlug(res.data.slug || '');
            setWhatsapp(res.data.whatsapp || '');
            setShowInDirectory(res.data.showInDirectory ?? true);
            setAutoConfirm(res.data.autoConfirm ?? false);
            setLoading(false);
        });
        agendaService.getUserServices().then(res => {
            setServices(res.data.services || []);
        });
    }, []);

    const handleSaveSettings = async () => {
        try {
            await agendaService.updateSettings({ showInDirectory, autoConfirm });
            setSettingsSaved(true);
            setTimeout(() => setSettingsSaved(false), 3000);
        } catch {
            alert('Erro ao salvar configurações.');
        }
    };

    const handleSaveProfile = async () => {
        try {
            await agendaService.updateSlug(slug);
            await agendaService.updateWhatsapp(whatsapp);
            setProfileSaved(true);
            setTimeout(() => setProfileSaved(false), 3000);
        } catch (e) {
            alert('Erro ao salvar Perfil.');
        }
    };

    const handleAddService = () => {
        setServices([...services, { name: '', price: '' }]);
    };

    const handleServiceChange = (index: number, field: string, value: string) => {
        setServices(services.map((s, idx) => idx === index ? { ...s, [field]: value } : s));
    };

    const handleRemoveService = (index: number) => {
        setServices(services.filter((_, idx) => idx !== index));
    };

    const handleSaveServices = async () => {
        try {
            await agendaService.updateUserServices(services);
            setServiceSaved(true);
            setTimeout(() => setServiceSaved(false), 3000);
        } catch {
            alert('Erro ao salvar serviços.');
        }
    };

    const handleAddSlot = (dayId: number) => {
        // ... existing handlers ...
        setHours([...hours, { dayOfWeek: dayId, startTime: '08:00', endTime: '12:00', whatsappEnabled: false }]);
    };

    const handleRemoveSlot = (indexToRemove: number) => {
        setHours(hours.filter((_, idx) => idx !== indexToRemove));
    };

    const handleTimeChange = (indexToUpdate: number, field: 'startTime' | 'endTime', value: string) => {
        setHours(hours.map((h, idx) => idx === indexToUpdate ? { ...h, [field]: value } : h));
    };

    const handleToggleWhatsapp = (indexToUpdate: number, value: boolean) => {
        setHours(hours.map((h, idx) => idx === indexToUpdate ? { ...h, whatsappEnabled: value } : h));
    };

    const handleSaveHours = async () => {
        try {
            await agendaService.updateBusinessHours(hours);
            alert('Horários salvos com sucesso!');
        } catch (e) {
            alert('Erro ao salvar horários.');
        }
    };

    if (loading) return <div>Carregando...</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Configurações da Agenda</h1>

            {/* Directory & Auto-Confirm Settings */}
            <div className="card mb-8">
                <h2 className="text-xl font-semibold mb-4 border-b pb-4">Preferências de Atendimento</h2>
                <div className="space-y-4">
                    <label className="flex items-center justify-between cursor-pointer">
                        <div>
                            <p className="font-medium text-gray-900">Aparecer na lista de Profissionais</p>
                            <p className="text-sm text-gray-500">Torne seu perfil visível para novos clientes pelo diretório público</p>
                        </div>
                        <div
                            onClick={() => setShowInDirectory(!showInDirectory)}
                            className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${showInDirectory ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${showInDirectory ? 'translate-x-7' : 'translate-x-1'}`} />
                        </div>
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                        <div>
                            <p className="font-medium text-gray-900">Confirmar agendamentos automaticamente</p>
                            <p className="text-sm text-gray-500">O cliente agenda e já recebe confirmação via WhatsApp sem revisão manual</p>
                        </div>
                        <div
                            onClick={() => setAutoConfirm(!autoConfirm)}
                            className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${autoConfirm ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${autoConfirm ? 'translate-x-7' : 'translate-x-1'}`} />
                        </div>
                    </label>
                </div>
                <div className="mt-6 flex items-center justify-end gap-4">
                    {settingsSaved && <span className="text-green-600 font-medium">Preferências salvas!</span>}
                    <button onClick={handleSaveSettings} className="btn-primary">Salvar Preferências</button>
                </div>
            </div>

            <div className="card mb-8">
                <h2 className="text-xl font-semibold mb-4 border-b pb-4">Seu Perfil de Agendamento</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Crie um endereço único (slug)</label>
                        <div className="flex rounded-md shadow-sm">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                seu-site.com/agendar/
                            </span>
                            <input
                                type="text"
                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="joao-silva"
                                value={slug}
                                onChange={e => setSlug(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Seu WhatsApp (Ex: 5511999999999)</label>
                        <input
                            type="text"
                            className="input-field w-full"
                            placeholder="Somente números. Ex: 5511988887777"
                            value={whatsapp}
                            onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                        />
                    </div>
                </div>

                {slug && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Seu Link de Agendamento Público</p>
                            <code className="text-sm text-blue-800 break-all">{window.location.origin}/agendar/{slug}</code>
                        </div>
                        <button
                            onClick={() => {
                                const link = `${window.location.origin}/agendar/${slug}`;
                                navigator.clipboard.writeText(link);
                                setLinkCopied(true);
                                setTimeout(() => setLinkCopied(false), 2000);
                            }}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex-shrink-0 flex items-center gap-2 ${linkCopied ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}`}
                        >
                            {linkCopied ? '✅ Link Copiado!' : '📋 Copiar Link de Agendamento'}
                        </button>
                    </div>
                )}

                <div className="mt-6 flex items-center justify-end gap-4">
                    {profileSaved && <span className="text-green-600 font-medium">Perfil atualizado com sucesso!</span>}
                    <button onClick={handleSaveProfile} className="btn-primary">
                        Salvar Informações
                    </button>
                </div>
            </div>

            {/* Services Management */}
            <div className="card mb-8">
                <div className="flex items-center justify-between mb-6 border-b pb-4">
                    <h2 className="text-xl font-semibold">Meus Serviços e Preços</h2>
                    <button onClick={handleAddService} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-md border border-blue-200 hover:bg-blue-100 font-bold">
                        + Novo Serviço
                    </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    {services.map((service, idx) => (
                        <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm relative group">
                            <button
                                onClick={() => handleRemoveService(idx)}
                                className="absolute -top-2 -right-2 bg-white border border-red-200 text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                title="Remover Serviço"
                            >
                                🗑️
                            </button>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Serviço</label>
                                    <input
                                        type="text"
                                        className="input-field py-1 text-sm font-semibold w-full"
                                        placeholder="Ex: Corte de Cabelo"
                                        value={service.name}
                                        onChange={e => handleServiceChange(idx, 'name', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Preço (Opcional)</label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-xs">R$</span>
                                        <input
                                            type="text"
                                            className="flex-1 input-field !rounded-l-none py-1 text-sm font-bold"
                                            placeholder="0,00"
                                            value={service.price}
                                            onChange={e => handleServiceChange(idx, 'price', e.target.value.replace(/[^0-9,.]/g, ''))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {services.length === 0 && (
                        <div className="col-span-full py-8 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-500">
                            Nenhum serviço cadastrado. Clique em "+ Novo Serviço" para começar.
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-4">
                    {serviceSaved && <span className="text-green-600 font-medium">Serviços salvos!</span>}
                    <button onClick={handleSaveServices} className="btn-primary">Salvar Serviços</button>
                </div>
            </div>

            <div className="card">
                <h2 className="text-xl font-semibold mb-6 border-b pb-4">Horários de Atendimento</h2>
                <p className="text-sm text-gray-600 mb-6">Você pode adicionar vários intervalos num único dia (por exemplo, adicionar um horário de 08:00 às 12:00 e outro de 14:00 às 18:00). Os agendamentos usarão frações de 30 minutos.</p>

                <div className="space-y-6 mb-8">
                    {DAYS_OF_WEEK.map(day => {
                        const daySlots = hours
                            .map((h, idx) => ({ ...h, originalIndex: idx }))
                            .filter(h => h.dayOfWeek === day.id);

                        const isActive = daySlots.length > 0;

                        return (
                            <div key={day.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4 w-48">
                                        <input
                                            type="checkbox"
                                            checked={isActive}
                                            onChange={() => {
                                                if (isActive) {
                                                    setHours(hours.filter(h => h.dayOfWeek !== day.id));
                                                } else {
                                                    handleAddSlot(day.id);
                                                }
                                            }}
                                            className="h-5 w-5 text-blue-600 rounded cursor-pointer"
                                        />
                                        <span className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{day.label}</span>
                                    </div>

                                    {isActive && (
                                        <button onClick={() => handleAddSlot(day.id)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                            + Adicionar Intervalo
                                        </button>
                                    )}
                                </div>

                                {isActive ? (
                                    <div className="pl-10 space-y-3">
                                        {daySlots.map((slot, index) => (
                                            <div key={slot.originalIndex} className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                                                <span className="text-xs font-semibold text-gray-400 w-16 uppercase">Turno {index + 1}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-500">Início</span>
                                                    <input
                                                        type="time"
                                                        value={slot.startTime}
                                                        onChange={e => handleTimeChange(slot.originalIndex, 'startTime', e.target.value)}
                                                        className="input-field py-1"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-500">Fim</span>
                                                    <input
                                                        type="time"
                                                        value={slot.endTime}
                                                        onChange={e => handleTimeChange(slot.originalIndex, 'endTime', e.target.value)}
                                                        className="input-field py-1"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2 ml-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!slot.whatsappEnabled}
                                                        onChange={e => handleToggleWhatsapp(slot.originalIndex, e.target.checked)}
                                                        className="h-4 w-4 text-green-600 rounded cursor-pointer"
                                                    />
                                                    <span className="text-sm font-medium text-gray-600">Habilitar WhatsApp</span>
                                                </div>
                                                <button onClick={() => handleRemoveSlot(slot.originalIndex)} className="ml-auto text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-full" title="Remover Horário">
                                                    🗑️
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="pl-10 text-sm text-gray-400 italic">Folga / Indisponível</div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-end">
                    <button onClick={handleSaveHours} className="btn-primary px-8 text-lg py-3">
                        Salvar Minha Configuração
                    </button>
                </div>
            </div>
        </div>
    );
};
