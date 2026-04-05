import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
    email: z.string().email('Email inválido'),
    password: z
        .string()
        .min(8, 'Senha deve ter pelo menos 8 caracteres')
        .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
        .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
    whatsapp: z.string().min(10, 'WhatsApp deve ter pelo menos 10 dígitos numéricos'),
    profession: z.string().min(2, 'Profissão é obrigatória'),
    category: z.string().min(2, 'Categoria é obrigatória'),
    services: z.array(z.object({
        name: z.string(),
        price: z.string().optional()
    })).optional(),
    coupon: z.string().optional(),
    cardNumber: z.string().optional(),
    cardExpiry: z.string().optional(),
    cardCvv: z.string().optional(),
}).superRefine((data, ctx) => {
    const isFree = data.coupon?.toUpperCase() === 'GRATIS100';
    if (!isFree) {
        if (!data.cardNumber || data.cardNumber.replace(/\D/g, '').length < 15) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Número de cartão inválido', path: ['cardNumber'] });
        }
        if (!data.cardExpiry || data.cardExpiry.length < 5) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Validade inválida (MM/AA)', path: ['cardExpiry'] });
        }
        if (!data.cardCvv || data.cardCvv.length < 3) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'CVV inválido', path: ['cardCvv'] });
        }
    }
});

export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha é obrigatória'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
