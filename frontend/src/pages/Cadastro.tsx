import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema, RegisterFormData } from '../schemas/auth.schema';
import { useAuth } from '../contexts/AuthContext';
import { agendaService } from '../services/agenda.service';

const CATEGORY_ICONS: Record<string, string> = {
    'Saúde': '🏥',
    'Educação': '📚',
    'Beleza': '💅',
    'Nutrição': '🥗',
    'Negócios & Finanças': '💼',
    'Outros': '🔧',
};

export const Cadastro: React.FC = () => {
    const navigate = useNavigate();
    const { register: registerUser } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [registerError, setRegisterError] = useState('');

    // Profession data states
    const [allProfessions, setAllProfessions] = useState<any[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedProfessionId, setSelectedProfessionId] = useState('');
    const [services, setServices] = useState<{ name: string; price: string }[]>([]);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            category: '',
            profession: '',
            services: [],
        }
    });

    watch('profession');
    watch('category');
    const couponValue = watch('coupon');
    const isFree = couponValue?.toUpperCase() === 'GRATIS100';

    useEffect(() => {
        agendaService.getProfessions().then(res => {
            const profs = res.data.professions || [];
            setAllProfessions(profs);
            const cats = Array.from(new Set(profs.map((p: any) => p.category))) as string[];
            setCategories([...cats, 'Outros']);
        }).catch(err => console.error('Erro ao carregar profissões', err));
    }, []);

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cat = e.target.value;
        setSelectedCategory(cat);
        setValue('category', cat);
        setSelectedProfessionId('');
        setValue('profession', '');
        setServices([]);
        setValue('services', []);
    };

    const handleProfessionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const profId = e.target.value;
        setSelectedProfessionId(profId);
        
        if (profId && profId !== 'custom') {
            const profObj = allProfessions.find(p => p.id === profId);
            const profName = profObj?.name || '';
            setValue('profession', profName);

            try {
                const res = await agendaService.getProfessionServices(profId);
                const defaultServices = (res.data.services || []).map((s: any) => ({ name: s.name, price: '' }));
                setServices(defaultServices);
                setValue('services', defaultServices);
            } catch (err) {
                console.error('Erro ao carregar serviços', err);
            }
        } else {
            setValue('profession', '');
            setServices([]);
            setValue('services', []);
        }
    };

    const handleServicePriceChange = (index: number, price: string) => {
        const newServices = [...services];
        newServices[index].price = price;
        setServices(newServices);
        setValue('services', newServices);
    };

    const filteredProfessions = allProfessions.filter(p => p.category === selectedCategory);

    const onSubmit = async (data: RegisterFormData) => {
        setIsSubmitting(true);
        setRegisterError('');

        try {
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
            <div className="max-w-2xl w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Cadastro Profissional</h1>
                    <p className="text-gray-600">Crie sua conta e configure sua vitrine de serviços</p>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Personal Info */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Identificação</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                    <input {...register('name')} type="text" className="input-field" placeholder="Seu nome" />
                                    {errors.name && <p className="error-text">{errors.name.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input {...register('email')} type="email" className="input-field" placeholder="seu@email.com" />
                                    {errors.email && <p className="error-text">{errors.email.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 font-medium">+55</span>
                                        <input {...register('whatsapp')} type="text" className="flex-1 input-field !rounded-l-none" placeholder="DDD + Número" />
                                    </div>
                                    {errors.whatsapp && <p className="error-text">{errors.whatsapp.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                                    <input {...register('password')} type="password" className="input-field" placeholder="••••••••" />
                                    {errors.password && <p className="error-text">{errors.password.message}</p>}
                                </div>
                            </div>

                            {/* Profession Selection */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Atuação Profissional</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                    <select 
                                        className="input-field" 
                                        value={selectedCategory} 
                                        onChange={handleCategoryChange}
                                    >
                                        <option value="">Selecione a categoria</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{CATEGORY_ICONS[cat] || '🔧'} {cat}</option>
                                        ))}
                                    </select>
                                    {errors.category && <p className="error-text">{errors.category.message}</p>}
                                </div>

                                {selectedCategory && selectedCategory !== 'Outros' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sua Profissão</label>
                                        <select 
                                            className="input-field" 
                                            value={selectedProfessionId} 
                                            onChange={handleProfessionChange}
                                        >
                                            <option value="">Qual sua especialidade?</option>
                                            {filteredProfessions.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                        {errors.profession && <p className="error-text">{errors.profession.message}</p>}
                                    </div>
                                )}

                                {selectedCategory === 'Outros' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Descreva sua Profissão</label>
                                        <input 
                                            type="text" 
                                            className="input-field" 
                                            placeholder="Ex: Arquiteto, Fotógrafo..." 
                                            onChange={(e) => setValue('profession', e.target.value)}
                                        />
                                        <p className="text-xs text-amber-600 mt-1 font-medium">⚠️ Cadastro sujeito a aprovação pelo administrador.</p>
                                        {errors.profession && <p className="error-text">{errors.profession.message}</p>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Services List and Pricing */}
                        {services.length > 0 && (
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 space-y-4">
                                <h3 className="text-lg font-bold text-blue-900">Seus Serviços e Preços</h3>
                                <p className="text-sm text-blue-700">O sistema pré-selecionou os serviços comuns da sua área. Defina o valor se desejar (opcional).</p>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {services.map((service, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
                                            <label className="block text-sm font-bold text-gray-700 mb-1">{service.name}</label>
                                            <div className="flex">
                                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">R$</span>
                                                <input 
                                                    type="text" 
                                                    className="flex-1 input-field !rounded-l-none !py-1 text-sm font-semibold" 
                                                    placeholder="0,00"
                                                    value={service.price}
                                                    onChange={(e) => handleServicePriceChange(idx, e.target.value.replace(/[^0-9,.]/g, ''))}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <hr className="border-gray-200" />
                        
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Pagamento da Assinatura</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cupom de Desconto</label>
                                <input {...register('coupon')} type="text" className="input-field uppercase" placeholder="Ex: GRATIS100" />
                            </div>

                            {!isFree && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cartão de Crédito</label>
                                        <input {...register('cardNumber')} type="text" maxLength={19} className="input-field" placeholder="0000 0000 0000 0000" />
                                        {errors.cardNumber && <p className="error-text">{errors.cardNumber.message}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Validade</label>
                                            <input {...register('cardExpiry')} type="text" maxLength={5} className="input-field" placeholder="MM/AA" />
                                            {errors.cardExpiry && <p className="error-text">{errors.cardExpiry.message}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                                            <input {...register('cardCvv')} type="text" maxLength={4} className="input-field" placeholder="123" />
                                            {errors.cardCvv && <p className="error-text">{errors.cardCvv.message}</p>}
                                        </div>
                                    </div>
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

                        <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-4 text-xl font-bold shadow-lg">
                            {isSubmitting ? 'Cadastrando...' : 'Finalizar Cadastro'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Já tem uma conta? <Link to="/login" className="text-blue-600 hover:text-blue-700 font-bold">Faça login</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

