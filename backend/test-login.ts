import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'test@example.com';
    const testPassword = 'Test1234'; // Change this to the password you're trying

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log('Usuário não encontrado no banco com o email:', email);
        return;
    }
    console.log('Usuário encontrado:', user.email);
    
    const isValid = await bcrypt.compare(testPassword, user.passwordHash);
    console.log('Senha válida para', email, ':', isValid);
}

main().catch(console.error).finally(() => prisma.$disconnect());
