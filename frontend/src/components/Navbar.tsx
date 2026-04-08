import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export const Navbar: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [wsStatus, setWsStatus] = useState<string>('INITIALIZING');

    useEffect(() => {
        if (isAuthenticated && user?.isAdmin) {
            const checkStatus = async () => {
                try {
                    const res = await api.get('/health');
                    setWsStatus(res.data.whatsappStatus);
                } catch (e) {
                    setWsStatus('OFFLINE');
                }
            };
            checkStatus();
            const interval = setInterval(checkStatus, 60000); // Check every minute
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, user]);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const navLinks = [
        { to: '/', label: 'Home' },
        { to: '/servicos', label: 'Serviços' },
        { to: '/profissionais', label: 'Profissionais' },
        { to: '/contato', label: 'Contato' },
    ];

    if (isAuthenticated) {
        navLinks.push({ to: '/restricted', label: 'Área Restrita' });
    }

    return (
        <nav className="bg-white shadow-md relative z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Left Side */}
                    <div className="flex items-center">
                        <button
                            className="sm:hidden mr-2 p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                        <span className="text-xl font-bold text-blue-600 truncate">ControleCliente</span>

                        {/* Desktop Links */}
                        <div className="hidden sm:flex sm:ml-8 sm:space-x-8">
                            {navLinks.map(link => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    className={({ isActive }) =>
                                        `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${isActive
                                            ? 'border-blue-500 text-gray-900'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                        }`
                                    }
                                >
                                    {link.label}
                                </NavLink>
                            ))}
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {isAuthenticated ? (
                            <>
                                {user?.isAdmin && (
                                    <div className="flex items-center mr-2 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100" title={`WhatsApp: ${wsStatus}`}>
                                        <div className={`w-2.5 h-2.5 rounded-full ${wsStatus === 'CONNECTED' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : wsStatus === 'QR_READY' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`}></div>
                                        <span className="ml-2 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest hidden lg:inline">WhatsApp Bot</span>
                                    </div>
                                )}
                                <span className="hidden sm:inline text-sm text-gray-700">Olá, {user?.name}</span>
                                <button
                                    onClick={handleLogout}
                                    className="text-sm text-gray-700 hover:text-gray-900 font-medium"
                                >
                                    Sair
                                </button>
                            </>
                        ) : (
                            <>
                                <NavLink
                                    to="/login"
                                    className="text-sm text-gray-700 hover:text-gray-900 font-medium"
                                >
                                    Login
                                </NavLink>
                                <NavLink
                                    to="/cadastro"
                                    className="btn-primary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                                >
                                    Cadastrar
                                </NavLink>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="sm:hidden absolute top-16 left-0 w-full bg-white border-t border-gray-100 shadow-lg border-b">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {navLinks.map(link => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                onClick={() => setIsMenuOpen(false)}
                                className={({ isActive }) =>
                                    `block px-3 py-2 rounded-md text-base font-medium ${isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                    }`
                                }
                            >
                                {link.label}
                            </NavLink>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
};
