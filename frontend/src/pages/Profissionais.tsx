import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { agendaService } from '../services/agenda.service';

export const Profissionais: React.FC = () => {
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        agendaService.getProfessionalsList().then(res => {
            setProfessionals(res.data.professionals);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Profissionais</h1>
                <p className="text-xl text-gray-600">Escolha um especialista e agende seu horário online.</p>
            </div>

            {loading ? (
                <div className="text-center text-gray-500 py-10">Carregando lista de profissionais...</div>
            ) : professionals.length === 0 ? (
                <div className="text-center bg-gray-50 p-10 rounded-xl border">
                    <p className="text-lg text-gray-600">Nenhum profissional disponível para agendamento no momento.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {professionals.map(prof => (
                        <div key={prof.id} className="card flex flex-col items-center hover:shadow-xl transition-shadow border border-gray-100">
                            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600 text-3xl font-bold shadow-sm">
                                {prof.name.charAt(0).toUpperCase()}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{prof.name}</h3>
                            <p className="text-gray-500 mb-6 text-sm font-medium">✨ Atendimento Online & Presencial</p>
                            <Link
                                to={`/agendar/${prof.slug}`}
                                className="btn-primary w-full text-center py-3 text-lg shadow hover:shadow-lg transition-all"
                            >
                                Agendar Horário
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
