import React from 'react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Bem-vindo ao ControleCliente
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                    Sistema completo de gerenciamento de clientes com autenticação segura
                </p>
                <div className="flex justify-center space-x-4">
                    <Link to="/servicos" className="btn-primary">
                        Ver Serviços
                    </Link>
                    <Link to="/contato" className="btn-secondary">
                        Entre em Contato
                    </Link>
                </div>
            </div>

            <div className="mt-16 grid md:grid-cols-3 gap-8">
                <div className="card text-center">
                    <div className="text-blue-600 text-4xl mb-4">🔒</div>
                    <h3 className="text-lg font-semibold mb-2">Segurança</h3>
                    <p className="text-gray-600">
                        Autenticação robusta com JWT e criptografia de senhas
                    </p>
                </div>
                <div className="card text-center">
                    <div className="text-blue-600 text-4xl mb-4">⚡</div>
                    <h3 className="text-lg font-semibold mb-2">Rápido</h3>
                    <p className="text-gray-600">
                        Interface moderna e responsiva construída com React
                    </p>
                </div>
                <div className="card text-center">
                    <div className="text-blue-600 text-4xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold mb-2">Completo</h3>
                    <p className="text-gray-600">
                        Todas as funcionalidades que você precisa em um só lugar
                    </p>
                </div>
            </div>
        </div>
    );
};
