import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ADMIN_EMAIL = 'linopereira.sergio@gmail.com';

interface BusinessHours {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

interface UserService {
    id: string;
    name: string;
    price: string | number | null;
}

interface Professional {
    id: string;
    name: string;
    email: string;
    whatsapp: string | null;
    slug: string | null;
    createdAt: string;
    status: 'ACTIVE' | 'PENDING_APPROVAL';
    profession: string | null;
    autoConfirm: boolean;
    showInDirectory: boolean;
    businessHours: BusinessHours[];
    services: UserService[];
}

const DAYS_NAME = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const AdminProfissionais: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [expandedProfId, setExpandedProfId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!user || user.email !== ADMIN_EMAIL) {
            navigate('/restricted');
            return;
        }
        fetchProfessionals();
    }, [user]);

    const fetchProfessionals = async () => {
        try {
            const res = await api.get('/admin/users');
            setProfessionals(res.data.data.users);
        } catch {
            setMessage('Erro ao carregar profissionais.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await api.put(`/admin/users/${id}/approve`);
            setProfessionals(prev => prev.map(p => p.id === id ? { ...p, status: 'ACTIVE' } : p));
            setMessage('Profissional aprovado com sucesso!');
        } catch {
            setMessage('Erro ao aprovar profissional.');
        }
    };

    const handleDelete = async (id: string) => {
        // ... existing delete logic ...
        setDeleting(true);
        try {
            await api.delete(`/admin/users/${id}`);
            setProfessionals(prev => prev.filter(p => p.id !== id));
            setMessage('Profissional excluído com sucesso!');
            setConfirmDeleteId(null);
        } catch {
            setMessage('Erro ao excluir profissional.');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20 text-gray-500">Carregando...</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">⚙️ Gerenciar Profissionais</h1>
                    <p className="text-gray-500 mt-1">Painel exclusivo do Administrador</p>
                </div>
                <button onClick={() => navigate('/restricted')} className="btn-secondary text-sm">
                    ← Voltar
                </button>
            </div>

            {message && (
                <div className={`mb-4 p-4 rounded-lg text-sm font-medium ${message.includes('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message}
                </div>
            )}

            {professionals.length === 0 ? (
                <div className="card text-center text-gray-500 py-12">
                    Nenhum profissional cadastrado além do administrador.
                </div>
            ) : (
                <div className="space-y-4">
                    {professionals.map(prof => (
                        <div key={prof.id} className="flex flex-col gap-0">
                            <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-l-4" style={{
                                borderLeftColor: prof.status === 'ACTIVE' ? '#10b981' : '#f59e0b',
                                borderBottomLeftRadius: expandedProfId === prof.id ? 0 : '1rem',
                                borderBottomRightRadius: expandedProfId === prof.id ? 0 : '1rem'
                            }}>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-gray-900">{prof.name}</p>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${prof.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {prof.status === 'ACTIVE' ? 'Ativo' : 'Pendente'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">{prof.email} &bull; <span className="font-medium text-blue-600">{prof.profession || 'Sem profissão'}</span></p>
                                    <p className="text-sm text-gray-400">
                                        WhatsApp: {prof.whatsapp || '—'} &nbsp;|&nbsp; Slug: {prof.slug || '—'}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Cadastrado em: {new Date(prof.createdAt).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setExpandedProfId(expandedProfId === prof.id ? null : prof.id)}
                                        className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${expandedProfId === prof.id ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                                    >
                                        {expandedProfId === prof.id ? '🔼 Ocultar Config' : '⚙️ Ver Config'}
                                    </button>

                                    {prof.status === 'PENDING_APPROVAL' && (
                                        <button
                                            onClick={() => handleApprove(prof.id)}
                                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-bold shadow-sm"
                                        >
                                            ✅ Aprovar
                                        </button>
                                    )}

                                    {confirmDeleteId === prof.id ? (
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => handleDelete(prof.id)}
                                                disabled={deleting}
                                                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 font-bold"
                                            >
                                                {deleting ? 'Excluindo...' : 'Confirmar'}
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteId(null)}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmDeleteId(prof.id)}
                                            className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 flex-shrink-0 font-medium"
                                        >
                                            🗑️ Excluir
                                        </button>
                                    )}
                                </div>
                            </div>

                            {expandedProfId === prof.id && (
                                <div className="bg-white border-x border-b border-gray-100 rounded-b-2xl p-6 shadow-sm animate-in slide-in-from-top-2 duration-200 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Business Hours */}
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                📅 Horários de Atendimento
                                            </h4>
                                            {prof.businessHours && prof.businessHours.length > 0 ? (
                                                <div className="space-y-2">
                                                    {prof.businessHours.map((bh, idx) => (
                                                        <div key={idx} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                                                            <span className="text-sm font-medium text-gray-700">{DAYS_NAME[bh.dayOfWeek]}</span>
                                                            <span className="text-sm text-gray-500 tabular-nums">{bh.startTime} - {bh.endTime}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-400 italic">Nenhum horário configurado.</p>
                                            )}
                                        </div>

                                        {/* Services */}
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                💼 Serviços Oferecidos
                                            </h4>
                                            {prof.services && prof.services.length > 0 ? (
                                                <div className="space-y-2">
                                                    {prof.services.map((svc) => (
                                                        <div key={svc.id} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                                                            <span className="text-sm text-gray-700">{svc.name}</span>
                                                            <span className="text-sm font-semibold text-green-600">
                                                                {svc.price ? `R$ ${svc.price.toString().replace('.', ',')}` : 'Grátis'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-400 italic">Nenhum serviço cadastrado.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Link & Settings indicator */}
                                    <div className="pt-4 border-t border-gray-50 flex flex-col gap-4">
                                        {prof.slug && (
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tight mb-1">Link de Agendamento Online</p>
                                                    <code className="text-xs text-blue-800 break-all">{window.location.origin}/agendar/{prof.slug}</code>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const link = `${window.location.origin}/agendar/${prof.slug}`;
                                                        navigator.clipboard.writeText(link);
                                                        setCopiedId(prof.id);
                                                        setTimeout(() => setCopiedId(null), 2000);
                                                    }}
                                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex-shrink-0 flex items-center gap-2 ${copiedId === prof.id ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}`}
                                                >
                                                    {copiedId === prof.id ? '✅ Copiado!' : '📋 Copiar Link'}
                                                </button>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-4">
                                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                                <span className={prof.autoConfirm ? 'text-green-600' : 'text-gray-400'}>{prof.autoConfirm ? '✅' : '❌'}</span>
                                                <span className="text-xs font-medium text-gray-600">Auto-confirmar agendamentos</span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                                <span className={prof.showInDirectory ? 'text-green-600' : 'text-gray-400'}>{prof.showInDirectory ? '✅' : '❌'}</span>
                                                <span className="text-xs font-medium text-gray-600">Visível no diretório</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
