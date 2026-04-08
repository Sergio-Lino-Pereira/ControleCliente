import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { agendaService } from '../services/agenda.service';

const CATEGORY_ICONS: Record<string, string> = {
    'Saúde': '🏥',
    'Educação': '📚',
    'Beleza': '💅',
    'Nutrição': '🥗',
    'Negócios & Finanças': '💼',
    'Outros': '🔧',
};

export const Profissionais: React.FC = () => {
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('Todos');

    useEffect(() => {
        agendaService.getProfessionalsList().then(res => {
            setProfessionals(res.data.professionals || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const categories = ['Todos', ...Array.from(new Set(professionals.map((p: any) => p.category || 'Outros').filter(Boolean)))];

    const filtered = activeCategory === 'Todos'
        ? professionals
        : professionals.filter((p: any) => (p.category || 'Outros') === activeCategory);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-gray-900 mb-3">Profissionais</h1>
                <p className="text-xl text-gray-600">Escolha um especialista e agende seu horário online.</p>
            </div>

            {!loading && professionals.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mb-10">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat
                                    ? 'bg-blue-600 text-white shadow'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {cat !== 'Todos' ? `${CATEGORY_ICONS[cat] || '🔧'} ` : ''}{cat}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="text-center text-gray-500 py-10">Carregando lista de profissionais...</div>
            ) : filtered.length === 0 ? (
                <div className="text-center bg-gray-50 p-10 rounded-xl border">
                    <p className="text-lg text-gray-600">Nenhum profissional disponível para agendamento no momento.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filtered.map(prof => (
                        <div key={prof.id} className="card flex flex-col items-center hover:shadow-xl transition-shadow border border-gray-100">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600 text-3xl font-bold shadow-sm">
                                {prof.name.charAt(0).toUpperCase()}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{prof.name}</h3>
                            {prof.profession && (
                                <p className="text-blue-600 text-sm font-medium mb-1">
                                    {CATEGORY_ICONS[prof.category] || '🔧'} {prof.profession}
                                </p>
                            )}
                            {prof.category && (
                                <span className="inline-block bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full mb-4">
                                    {prof.category}
                                </span>
                            )}
                            {!prof.profession && (
                                <p className="text-gray-500 mb-4 text-sm font-medium">✨ Atendimento Online & Presencial</p>
                            )}
                            <Link
                                to={`/agendar/${prof.slug}`}
                                className="btn-primary w-full text-center py-3 text-base shadow hover:shadow-lg transition-all mt-auto"
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
