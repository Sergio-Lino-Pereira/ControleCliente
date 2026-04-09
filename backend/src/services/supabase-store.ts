import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs-extra';
import path from 'path';

interface StoreOptions {
    session: string;
}

export class SupabaseStore {
    private supabase: SupabaseClient;
    private bucketName: string;

    constructor() {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        this.bucketName = 'whatsapp-sessions';

        if (!url || !key) {
            console.warn('[SupabaseStore] ⚠️ CRITICAL: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados no ambiente!');
        } else {
            console.log('[SupabaseStore] 🟢 Configurações do Supabase detectadas.');
        }

        this.supabase = createClient(url || '', key || '');
    }

    async sessionExists(options: StoreOptions): Promise<boolean> {
        if (!process.env.SUPABASE_URL) return false;
        
        const fileName = `${options.session}.zip`;
        const { data, error } = await this.supabase.storage
            .from(this.bucketName)
            .list('', {
                limit: 1,
                search: fileName
            });

        if (error) {
            console.error('[SupabaseStore] Erro ao verificar existência da sessão:', error.message);
            return false;
        }

        return data.length > 0;
    }

    async save(options: StoreOptions): Promise<void> {
        if (!process.env.SUPABASE_URL) return;

        const fileName = `${options.session}.zip`;
        const filePath = path.join(process.cwd(), fileName);

        if (!await fs.pathExists(filePath)) {
            console.warn(`[SupabaseStore] Arquivo de sessão ${fileName} não encontrado para upload.`);
            return;
        }

        const fileBuffer = await fs.readFile(filePath);
        const { error } = await this.supabase.storage
            .from(this.bucketName)
            .upload(fileName, fileBuffer, {
                upsert: true,
                contentType: 'application/zip'
            });

        if (error) {
            console.error('[SupabaseStore] ❌ Erro ao salvar sessão no Supabase:', error.message);
        } else {
            console.log(`[SupabaseStore] ✅ UPLOAD CONCLUÍDO: Sessão ${options.session} persistida no Supabase.`);
            // Optionally delete local zip after upload
            await fs.remove(filePath);
        }
    }

    async extract(options: StoreOptions): Promise<void> {
        if (!process.env.SUPABASE_URL) return;

        const fileName = `${options.session}.zip`;
        const filePath = path.join(process.cwd(), fileName);

        const { data, error } = await this.supabase.storage
            .from(this.bucketName)
            .download(fileName);

        if (error) {
            console.error('[SupabaseStore] Erro ao baixar sessão do Supabase:', error.message);
            return;
        }

        if (data) {
            const buffer = Buffer.from(await data.arrayBuffer());
            await fs.writeFile(filePath, buffer);
            console.log(`[SupabaseStore] 📥 Sessão ${options.session} baixada e preparada localmente.`);
        }
    }

    async delete(options: StoreOptions): Promise<void> {
        if (!process.env.SUPABASE_URL) return;

        const fileName = `${options.session}.zip`;
        const { error } = await this.supabase.storage
            .from(this.bucketName)
            .remove([fileName]);

        if (error) {
            console.error('[SupabaseStore] Erro ao deletar sessão no Supabase:', error.message);
        }
    }
}
