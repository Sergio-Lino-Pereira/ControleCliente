import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ADMIN_EMAIL = 'linopereira.sergio@gmail.com';

interface Professional {
    id: string;
    name: string;
    email: string;
    whatsapp: string | null;
    slug: string | null;
    createdAt: string;
}

export const AdminProfissionais: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
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

    const handleDelete = async (id: string) => {
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
                        <div key={prof.id} className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="space-y-1">
                                <p className="font-semibold text-gray-900">{prof.name}</p>
                                <p className="text-sm text-gray-500">{prof.email}</p>
                                <p className="text-sm text-gray-400">
                                    WhatsApp: {prof.whatsapp || '—'} &nbsp;|&nbsp; Slug: {prof.slug || '—'}
                                </p>
                                <p className="text-xs text-gray-400">
                                    Cadastrado em: {new Date(prof.createdAt).toLocaleDateString('pt-BR')}
                                </p>
                            </div>

                            {confirmDeleteId === prof.id ? (
                                <div className="flex gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => handleDelete(prof.id)}
                                        disabled={deleting}
                                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
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
                                    className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 flex-shrink-0"
                                >
                                    🗑️ Excluir
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
