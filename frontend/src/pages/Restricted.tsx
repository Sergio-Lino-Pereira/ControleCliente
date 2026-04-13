import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { agendaService } from '../services/agenda.service';

export const Restricted: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    
    const [appointments, setAppointments] = useState<any[]>([]);
    const hoje = new Date().toISOString().split('T')[0];

    useEffect(() => {
        agendaService.getAppointments(hoje).then(res => {
            setAppointments(res.data.appointments);
        }).catch(err => console.error(err));
    }, [hoje]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Bem-vindo, {user?.name}! 👋
                </h1>
                <p className="text-xl text-gray-600">Área Restrita - Dashboard</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="card">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">Informações da Conta</h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-600">Nome</p>
                            <p className="font-medium text-gray-900">{user?.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium text-gray-900">{user?.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Membro desde</p>
                            <p className="font-medium text-gray-900">
                                {user?.createdAt && formatDate(user.createdAt)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">Ações Rápidas</h2>
                    <div className="space-y-3">
                        <Link to="/agenda" className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors font-medium">
                            📅 Minha Agenda
                        </Link>
                        <Link to="/config-horarios" className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors font-medium">
                            ⚙️ Horários de Atendimento & Link Público
                        </Link>
                        {user?.email === 'linopereira.sergio@gmail.com' && (
                            <Link to="/admin/profissionais" className="block w-full text-left px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium text-red-700">
                                🛡️ Gerenciar Profissionais (Admin)
                            </Link>
                        )}
                        <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors font-medium">
                            👥 Gerenciar Clientes (Em Breve)
                        </button>
                        <a 
                            href={`${process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001'}/api/whatsapp/qr`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors font-medium text-green-700"
                        >
                            📱 Conectar WhatsApp (QR ou Código)
                        </a>
                    </div>
                </div>
            </div>

            <div className="card">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Resumo de Hoje ({hoje.split('-').reverse().join('/')})</h2>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-3xl font-bold text-blue-600">{appointments.length}</p>
                        <p className="text-sm text-gray-600 mt-1">Total de Agend.</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-3xl font-bold text-green-600">
                            {appointments.filter(a => a.status === 'CONFIRMED').length}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Confirmados</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-3xl font-bold text-red-600">
                            {appointments.filter(a => a.status === 'CANCELLED').length}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Cancelados</p>
                    </div>
                </div>

                {appointments.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Próximos Clientes Hoje</h3>
                        <div className="space-y-3">
                            {appointments.filter(a => a.status === 'CONFIRMED').slice(0, 3).map(appt => (
                                <div key={appt.id} className="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-md">
                                            {appt.startTime}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{appt.clientName}</p>
                                            <p className="text-xs text-gray-500">{appt.clientEmail}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {appointments.filter(a => a.status === 'CONFIRMED').length === 0 && (
                                <p className="text-sm text-gray-500 italic">Nenhum cliente confirmado para hoje.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 text-center">
                <button
                    onClick={handleLogout}
                    className="btn-secondary"
                >
                    Sair da Conta
                </button>
            </div>
        </div>
    );
};
