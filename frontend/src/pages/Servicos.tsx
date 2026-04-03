import React from 'react';

export const Servicos: React.FC = () => {
    const services = [
        {
            title: 'Gestão de Clientes',
            description: 'Gerencie todos os seus clientes em um único lugar com facilidade e segurança.',
            icon: '👥',
        },
        {
            title: 'Relatórios Detalhados',
            description: 'Acompanhe métricas e gere relatórios completos sobre seus clientes.',
            icon: '📈',
        },
        {
            title: 'Suporte 24/7',
            description: 'Nossa equipe está sempre disponível para ajudar você.',
            icon: '💬',
        },
        {
            title: 'Integração API',
            description: 'Integre facilmente com outros sistemas através da nossa API RESTful.',
            icon: '🔌',
        },
        {
            title: 'Backup Automático',
            description: 'Seus dados são protegidos com backups automáticos diários.',
            icon: '💾',
        },
        {
            title: 'Personalização',
            description: 'Customize o sistema de acordo com as necessidades do seu negócio.',
            icon: '⚙️',
        },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Nossos Serviços</h1>
                <p className="text-xl text-gray-600">
                    Soluções completas para gerenciamento de clientes
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((service, index) => (
                    <div key={index} className="card hover:shadow-lg transition-shadow duration-200">
                        <div className="text-5xl mb-4">{service.icon}</div>
                        <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                        <p className="text-gray-600">{service.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
