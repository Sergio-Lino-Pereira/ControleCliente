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

    private getCleanSessionName(session: string): string {
        return session.replace(/^RemoteAuth-/, '');
    }

    private getAuthBaseDir(): string {
        return path.join(process.cwd(), '.wwebjs_auth');
    }

    private getSessionDir(session: string): string {
        const cleanSessionName = this.getCleanSessionName(session);
        return path.join(this.getAuthBaseDir(), `session-${cleanSessionName}`);
    }

    private getZipPath(session: string): string {
        return path.join(this.getAuthBaseDir(), `${session}.zip`);
    }

    private async zipFolder(sourceDir: string, outPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(outPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => resolve());
            output.on('error', (err) => reject(err));
            archive.on('error', (err) => reject(err));

            archive.pipe(output);
            archive.directory(sourceDir, false);
            archive.finalize();
        });
    }

    async save(options: StoreOptions): Promise<void> {
        if (!process.env.SUPABASE_URL) return;

        const sessionDir = this.getSessionDir(options.session);
        const zipPath = this.getZipPath(options.session);
        const fileName = `${options.session}.zip`;

        try {
            console.log(`[SupabaseStore] 🔄 Iniciando persistência da sessão: ${options.session}`);

            if (!await fs.pathExists(sessionDir)) {
                console.warn(`[SupabaseStore] ⚠️ Pasta de sessão ${sessionDir} não encontrada para compactação. Abortando save.`);
                return;
            }

            await fs.ensureDir(this.getAuthBaseDir());

            console.log(`[SupabaseStore] 📦 Compactando pasta de sessão: ${sessionDir}...`);
            await this.zipFolder(sessionDir, zipPath);

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
        }
    }

    async extract(options: StoreOptions): Promise<void> {
        if (!process.env.SUPABASE_URL) return;

        console.log(`[SupabaseStore] 🔍 Verificando se existe sessão remota para: ${options.session}...`);

        const fileName = `${options.session}.zip`;
        const authBaseDir = this.getAuthBaseDir();
        const zipPath = this.getZipPath(options.session);
        const sessionDir = this.getSessionDir(options.session);

        try {
            await fs.ensureDir(authBaseDir);

            console.log(`[SupabaseStore] 📥 Tentando baixar arquivo da sessão (${fileName}) do Supabase...`);

            const downloadPromise = this.supabase.storage
                .from(this.bucketName)
                .download(fileName);

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT_EXCEEDED')), 20000)
            );

            const result: any = await Promise.race([downloadPromise, timeoutPromise]);
            const { data, error } = result;

            if (error) {
                console.log(`[SupabaseStore] ℹ️ Sessão remota (${fileName}) não disponível ou erro no download:`, error.message);
                return;
            }

            if (!data) {
                console.log(`[SupabaseStore] ℹ️ Nenhum dado retornado para ${fileName}.`);
                return;
            }

            console.log(`[SupabaseStore] 💾 Gravando arquivo temporário/local: ${zipPath}`);
            const buffer = Buffer.from(await data.arrayBuffer());
            await fs.writeFile(zipPath, buffer);

            await fs.ensureDir(sessionDir);
            await fs.emptyDir(sessionDir);

            console.log(`[SupabaseStore] 📂 Descompactando sessão em: ${sessionDir}...`);
            await extract(zipPath, { dir: sessionDir });

            console.log(`[SupabaseStore] ✨ Sessão ${options.session} restaurada com sucesso do Supabase.`);
            console.log(`[SupabaseStore] ℹ️ ZIP mantido em ${zipPath} para uso do RemoteAuth.`);
        } catch (err: any) {
            console.error('[SupabaseStore] ❌ Erro ao extrair sessão:', err.message);
        }
    }

    async delete(options: StoreOptions): Promise<void> {
        if (!process.env.SUPABASE_URL) return;

        const fileName = `${options.session}.zip`;
        const zipPath = this.getZipPath(options.session);
        const sessionDir = this.getSessionDir(options.session);

        try {
            const { error } = await this.supabase.storage
                .from(this.bucketName)
                .remove([fileName]);

            if (error) {
                console.error('[SupabaseStore] ❌ Erro ao deletar sessão no Supabase:', error.message);
            } else {
                console.log(`[SupabaseStore] 🗑️ Sessão remota removida do Supabase: ${fileName}`);
            }
        } catch (err: any) {
            console.error('[SupabaseStore] ❌ Erro ao deletar sessão remota:', err.message);
        }

        try {
            if (await fs.pathExists(zipPath)) {
                await fs.remove(zipPath);
                console.log(`[SupabaseStore] 🧹 ZIP local removido: ${zipPath}`);
            }

            if (await fs.pathExists(sessionDir)) {
                await fs.remove(sessionDir);
                console.log(`[SupabaseStore] 🧹 Pasta de sessão local removida: ${sessionDir}`);
            }
        } catch (err: any) {
            console.error('[SupabaseStore] ❌ Erro ao limpar arquivos locais da sessão:', err.message);
        }
    }
}