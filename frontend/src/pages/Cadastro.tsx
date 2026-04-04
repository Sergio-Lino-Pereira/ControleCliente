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
        watch,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const couponValue = watch('coupon');
    const isFree = couponValue?.toUpperCase() === 'GRATIS';

    const onSubmit = async (data: RegisterFormData) => {
        setIsSubmitting(true);
        setRegisterError('');

        try {
            // Append 55 to whatsapp since the UI isolates the prefix
            const cleanWhatsapp = data.whatsapp.replace(/\D/g, '');
            const finalData = {
                ...data,
                whatsapp: `55${cleanWhatsapp}`
            };

            await registerUser(finalData);
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Cadastro Profissional</h1>
                    <p className="text-gray-600">Crie sua conta e configure sua agenda</p>
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
                                Receber clientes no WhatsApp
                            </label>
                            <div className="flex">
                                <span className="inline-flex items-center px-4 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-600 font-medium sm:text-sm">
                                    +55
                                </span>
                                <input
                                    {...register('whatsapp')}
                                    type="text"
                                    id="whatsapp"
                                    className="flex-1 input-field !rounded-l-none"
                                    placeholder="DDD e Número (ex: 11999999999)"
                                />
                            </div>
                            {errors.whatsapp && <p className="error-text">{errors.whatsapp.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Senha de Acesso
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

                        <hr className="my-6 border-gray-200" />
                        
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Pagamento da Assinatura</h3>
                            
                            <div className="mb-4">
                                <label htmlFor="coupon" className="block text-sm font-medium text-gray-700 mb-2">
                                    Tem um Cupom de Desconto?
                                </label>
                                <input
                                    {...register('coupon')}
                                    type="text"
                                    id="coupon"
                                    className="input-field uppercase"
                                    placeholder="Ex: GRATIS"
                                />
                            </div>

                            {!isFree && (
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
                                            Número do Cartão de Crédito
                                        </label>
                                        <input
                                            {...register('cardNumber')}
                                            type="text"
                                            id="cardNumber"
                                            maxLength={19}
                                            className="input-field"
                                            placeholder="0000 0000 0000 0000"
                                        />
                                        {errors.cardNumber && <p className="error-text">{errors.cardNumber.message}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700 mb-2">
                                                Validade
                                            </label>
                                            <input
                                                {...register('cardExpiry')}
                                                type="text"
                                                id="cardExpiry"
                                                maxLength={5}
                                                className="input-field"
                                                placeholder="MM/AA"
                                            />
                                            {errors.cardExpiry && <p className="error-text">{errors.cardExpiry.message}</p>}
                                        </div>
                                        <div>
                                            <label htmlFor="cardCvv" className="block text-sm font-medium text-gray-700 mb-2">
                                                CVV
                                            </label>
                                            <input
                                                {...register('cardCvv')}
                                                type="text"
                                                id="cardCvv"
                                                maxLength={4}
                                                className="input-field"
                                                placeholder="123"
                                            />
                                            {errors.cardCvv && <p className="error-text">{errors.cardCvv.message}</p>}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 text-center">🔐 Transação Simulada e Segura</p>
                                </div>
                            )}

                            {isFree && (
                                <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded text-sm text-center font-medium">
                                    ✅ Cupom aplicado! Assinatura Gratuita.
                                </div>
                            )}
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
