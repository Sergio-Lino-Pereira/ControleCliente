import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import extract from 'extract-zip';

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
            console.error(`[SupabaseStore] ❌ Erro ao verificar existência da sessão (${fileName}):`, error.message);
            return false;
        }

        const exists = data.length > 0;
        console.log(`[SupabaseStore] 🔍 Verificação de arquivo (${fileName}): ${exists ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
        return exists;
    }

    private async zipFolder(sourceDir: string, outPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(outPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => resolve());
            archive.on('error', (err) => reject(err));

            archive.pipe(output);
            archive.directory(sourceDir, false);
            archive.finalize();
        });
    }

    async save(options: StoreOptions): Promise<void> {
        if (!process.env.SUPABASE_URL) return;

        // Corrigindo: O whatsapp-web.js cria a pasta sem o prefixo 'RemoteAuth-'
        const cleanSessionName = options.session.replace('RemoteAuth-', '');
        const sessionDir = path.join(process.cwd(), '.wwebjs_auth', `session-${cleanSessionName}`);
        const zipPath = path.join(process.cwd(), `${options.session}.zip`);

        try {
            console.log(`[SupabaseStore] 🔄 Iniciando persistência da sessão: ${options.session}`);

            if (!await fs.pathExists(sessionDir)) {
                console.warn(`[SupabaseStore] ⚠️ Pasta de sessão ${sessionDir} não encontrada para compactação. Abortando save.`);
                return;
            }

            console.log(`[SupabaseStore] 📦 Compactando pasta de sessão: ${sessionDir}...`);
            await this.zipFolder(sessionDir, zipPath);

            console.log(`[SupabaseStore] 📤 Enviando arquivo zip (${options.session}.zip) para o Supabase...`);
            const fileBuffer = await fs.readFile(zipPath);
            const { error } = await this.supabase.storage
                .from(this.bucketName)
                .upload(`${options.session}.zip`, fileBuffer, {
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

        console.log(`[SupabaseStore] 🔍 Verificando se existe sessão remota para: ${options.session}...`);
        const fileName = `${options.session}.zip`;
        const zipPath = path.join(process.cwd(), fileName);

        // Remove o prefixo RemoteAuth- se existir para encontrar a pasta correta
        const sessionDir = path.join(process.cwd(), '.wwebjs_auth', `session-${options.session.replace('RemoteAuth-', '')}`);

        try {
            console.log(`[SupabaseStore] 📥 Tentando baixar arquivo da sessão (${fileName}) do Supabase...`);

            // Adicionando um timeout manual para o download (20 segundos)
            const downloadPromise = this.supabase.storage.from(this.bucketName).download(fileName);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_EXCEEDED')), 20000));

            const result: any = await Promise.race([downloadPromise, timeoutPromise]);
            const { data, error } = result;

            if (error) {
                console.log(`[SupabaseStore] ℹ️ Sessão remota (${fileName}) não disponível ou erro no download:`, error.message);
                return;
            }

            if (data) {
                console.log(`[SupabaseStore] 💾 Gravando arquivo temporário: ${zipPath}`);
                const buffer = Buffer.from(await data.arrayBuffer());
                await fs.writeFile(zipPath, buffer);

                // Garantir que a pasta de destino existe e está limpa
                await fs.ensureDir(sessionDir);
                await fs.emptyDir(sessionDir);

                console.log(`[SupabaseStore] 📂 Descompactando sessão em: ${sessionDir}...`);
                await extract(zipPath, { dir: sessionDir });

                console.log(`[SupabaseStore] ✨ Sessão ${options.session} restaurada com sucesso do Supabase.`);
            }
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
        const { error } = await this.supabase.storage
            .from(this.bucketName)
            .remove([fileName]);

        if (error) {
            console.error('[SupabaseStore] Erro ao deletar sessão no Supabase:', error.message);
        }
    }
}
