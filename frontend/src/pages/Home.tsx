import React from 'react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-800 tracking-tight mb-4 leading-tight">
                    Bem-vindo ao ControleCliente
                </h1>
                <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto px-2">
                    Sistema completo de gerenciamento de clientes com autenticação segura
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <Link to="/servicos" className="btn-primary">
                        Ver Serviços
                    </Link>
                    <Link to="/contato" className="btn-secondary">
                        Entre em Contato
                    </Link>
                </div>
            </div>

            <div className="mt-10 md:mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
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
