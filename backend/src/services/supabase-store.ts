import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs-extra';
import path from 'path';
import AdmZip from 'adm-zip';

interface StoreOptions {
    session: string;
}

export class SupabaseStore {
    private _supabase: SupabaseClient | null = null;
    private bucketName: string = 'whatsapp-sessions';

    constructor() {}

    private get supabase(): SupabaseClient {
        if (this._supabase) return this._supabase;

        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !key) {
            throw new Error('[SupabaseStore] ❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados!');
        }

        console.log('[SupabaseStore] 🟢 Conectando ao Supabase...');
        this._supabase = createClient(url, key);
        return this._supabase;
    }

    private getAuthBaseDir(): string {
        return path.join(process.cwd(), '.baileys_auth');
    }

    private getZipPath(session: string): string {
        return path.join(process.cwd(), `${session}.zip`);
    }

    async sessionExists(options: StoreOptions): Promise<boolean> {
        if (!process.env.SUPABASE_URL) return false;

        const fileName = `${options.session}.zip`;
        const { data, error } = await this.supabase.storage
            .from(this.bucketName)
            .list('', {
                limit: 100,
                search: fileName
            });

        if (error) {
            console.error(`[SupabaseStore] ❌ Erro ao verificar existência da sessão (${fileName}):`, error.message);
            return false;
        }

        const exists = Array.isArray(data) && data.some((item) => item.name === fileName);
        console.log(`[SupabaseStore] 🔍 Verificação de arquivo (${fileName}): ${exists ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
        return exists;
    }

    async save(options: StoreOptions): Promise<void> {
        if (!process.env.SUPABASE_URL) return;

        const sessionDir = this.getAuthBaseDir();
        const zipPath = this.getZipPath(options.session);
        const fileName = `${options.session}.zip`;

        try {
            if (!await fs.pathExists(sessionDir)) {
                console.warn(`[SupabaseStore] ⚠️ Pasta de sessão ${sessionDir} não encontrada. Abortando save.`);
                return;
            }

            console.log(`[SupabaseStore] 📦 Compactando pasta de sessão Baileys...`);
            const zip = new AdmZip();
            zip.addLocalFolder(sessionDir);
            zip.writeZip(zipPath);

            console.log(`[SupabaseStore] 📤 Enviando arquivo zip (${fileName}) para o Supabase...`);
            const fileBuffer = await fs.readFile(zipPath);

            const { error } = await this.supabase.storage
                .from(this.bucketName)
                .upload(fileName, fileBuffer, {
                    upsert: true,
                    contentType: 'application/zip'
                });

            if (error) {
                console.error('[SupabaseStore] ❌ Erro ao salvar zip no Supabase:', error.message);
            } else {
                console.log(`[SupabaseStore] ✅ UPLOAD CONCLUÍDO: Sessão ${options.session} persistida com sucesso.`);
            }
        } catch (err: any) {
            console.error('[SupabaseStore] ❌ Erro durante o processo de save:', err.message);
        } finally {
            if (await fs.pathExists(zipPath)) {
                await fs.remove(zipPath);
            }
        }
    }

    async extract(options: StoreOptions): Promise<void> {
        if (!process.env.SUPABASE_URL) return;

        const fileName = `${options.session}.zip`;
        const zipPath = this.getZipPath(options.session);
        const sessionDir = this.getAuthBaseDir();

        try {
            console.log(`[SupabaseStore] 📥 Tentando baixar arquivo da sessão (${fileName}) do Supabase...`);

            const { data, error } = await this.supabase.storage
                .from(this.bucketName)
                .download(fileName);

            if (error) {
                console.log(`[SupabaseStore] ℹ️ Sessão remota (${fileName}) não disponível ou erro no download:`, error.message);
                return;
            }

            if (!data) return;

            const buffer = Buffer.from(await data.arrayBuffer());
            await fs.writeFile(zipPath, buffer);

            await fs.ensureDir(sessionDir);
            await fs.emptyDir(sessionDir);

            console.log(`[SupabaseStore] 📂 Descompactando sessão Baileys...`);
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(sessionDir, true);

            console.log(`[SupabaseStore] ✨ Sessão ${options.session} restaurada com sucesso.`);
        } catch (err: any) {
            console.error('[SupabaseStore] ❌ Erro ao extrair sessão:', err.message);
        } finally {
            if (await fs.pathExists(zipPath)) {
                await fs.remove(zipPath);
            }
        }
    }

    async delete(options: StoreOptions): Promise<void> {
        if (!process.env.SUPABASE_URL) return;

        const fileName = `${options.session}.zip`;
        try {
            await this.supabase.storage.from(this.bucketName).remove([fileName]);
            console.log(`[SupabaseStore] 🗑️ Sessão remota removida: ${fileName}`);
        } catch (err: any) {
            console.error('[SupabaseStore] ❌ Erro ao deletar sessão remota:', err.message);
        }
    }
}