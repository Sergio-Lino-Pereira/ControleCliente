import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema, RegisterFormData } from '../schemas/auth.schema';
import { useAuth } from '../contexts/AuthContext';

export const Cadastro: React.FC = () => {
    const navigate = useNavigate();
    const { register: registerUser } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [registerError, setRegisterError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        setIsSubmitting(true);
        setRegisterError('');

        try {
            await registerUser(data);
            navigate('/restricted');
        } catch (error: any) {
            setRegisterError(
                error.response?.data?.message || 'Erro ao cadastrar. Tente novamente.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Cadastro</h1>
                    <p className="text-gray-600">Crie sua conta gratuitamente</p>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Nome Completo
                            </label>
                            <input
                                {...register('name')}
                                type="text"
                                id="name"
                                className="input-field"
                                placeholder="Seu nome completo"
                            />
                            {errors.name && <p className="error-text">{errors.name.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                {...register('email')}
                                type="email"
                                id="email"
                                className="input-field"
                                placeholder="seu@email.com"
                            />
                            {errors.email && <p className="error-text">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-2">
                                Receber clientes no WhatsApp (Ex: 5511999999999)
                            </label>
                            <input
                                {...register('whatsapp')}
                                type="text"
                                id="whatsapp"
                                className="input-field"
                                placeholder="Apenas números"
                            />
                            {errors.whatsapp && <p className="error-text">{errors.whatsapp.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Senha
                            </label>
                            <input
                                {...register('password')}
                                type="password"
                                id="password"
                                className="input-field"
                                placeholder="••••••••"
                            />
                            {errors.password && <p className="error-text">{errors.password.message}</p>}
                            <p className="text-xs text-gray-500 mt-1">
                                Mínimo 8 caracteres, incluindo maiúscula, minúscula e número
                            </p>
                        </div>

                        {registerError && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                                ❌ {registerError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-primary w-full"
                        >
                            {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Já tem uma conta?{' '}
                            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                                Faça login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
