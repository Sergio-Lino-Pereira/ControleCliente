import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, ContactFormData } from '../schemas/contact.schema';
import { contactService } from '../services/contact.service';

export const Contato: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
    });

    const onSubmit = async (data: ContactFormData) => {
        setIsSubmitting(true);
        setSubmitError('');
        setSubmitSuccess(false);

        try {
            await contactService.sendMessage(data);
            setSubmitSuccess(true);
            reset();
        } catch (error: any) {
            setSubmitError(
                error.response?.data?.message || 'Erro ao enviar mensagem. Tente novamente.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Entre em Contato</h1>
                <p className="text-xl text-gray-600">
                    Envie sua mensagem e entraremos em contato em breve
                </p>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Nome
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
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                            Mensagem
                        </label>
                        <textarea
                            {...register('message')}
                            id="message"
                            rows={5}
                            className="input-field"
                            placeholder="Escreva sua mensagem aqui..."
                        />
                        {errors.message && <p className="error-text">{errors.message.message}</p>}
                    </div>

                    {submitSuccess && (
                        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                            ✅ Mensagem enviada com sucesso! Entraremos em contato em breve.
                        </div>
                    )}

                    {submitError && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                            ❌ {submitError}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary w-full"
                    >
                        {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                    </button>
                </form>
            </div>
        </div>
    );
};
