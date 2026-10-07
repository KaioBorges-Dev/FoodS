// ====================================================================
// FoodS — Supabase Integration & Enterprise Auth Service
// ====================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../shared/index.js';
import { Profile } from '../types/index.js';

class SupabaseServiceManager {
  private client: SupabaseClient | null = null;
  private configured: boolean = false;
  private supabaseUrl: string | null = null;

  constructor() {
    this.initialize();
  }

  public initialize() {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (
      url && 
      key && 
      !url.includes('placeholder') && 
      !url.includes('seu-projeto') && 
      !key.includes('placeholder') && 
      !key.includes('sua-anon')
    ) {
      try {
        this.client = createClient(url, key, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        this.configured = true;
        this.supabaseUrl = url;
        logger.info(`[Supabase Service] Conectado com sucesso ao Supabase Cloud: ${url}`);
      } catch (err) {
        logger.error('[Supabase Service] Erro ao inicializar cliente Supabase:', err);
        this.configured = false;
        this.client = null;
      }
    } else {
      this.configured = false;
      this.client = null;
      logger.warn('[Supabase Service] Supabase não configurado ou variáveis de ambiente ausentes. Operando em Modo Local de Contingência.');
    }
  }

  public isConfigured(): boolean {
    return this.configured && this.client !== null;
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  public getStatus() {
    return {
      configured: this.isConfigured(),
      url: this.supabaseUrl,
      mode: this.isConfigured() ? 'SUPABASE_CLOUD' : 'LOCAL_CONTINGENCY',
      message: this.isConfigured()
        ? 'Supabase conectado e sincronizado com PostgreSQL e RLS.'
        : 'Atenção: Supabase não está configurado. O sistema está operando em Modo de Contingência Local com o usuário Owner padrão (admin@admin / admin123). Configure as chaves no arquivo .env para persistência na nuvem.',
    };
  }

  /**
   * Autentica credenciais via Supabase Auth e retorna perfil associado
   */
  public async authenticate(email: string, password?: string): Promise<Profile | null> {
    if (!this.isConfigured() || !this.client) {
      return null;
    }

    try {
      if (password) {
        const { data: authData, error: authError } = await this.client.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (authError || !authData.user) {
          logger.warn(`[Supabase Auth] Falha na autenticação para ${email}: ${authError?.message}`);
          return null;
        }

        // Buscar perfil do usuário na tabela profiles
        const { data: profileData, error: profError } = await this.client
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profError || !profileData) {
          logger.warn(`[Supabase Auth] Perfil não encontrado no banco para usuário ${authData.user.id}`);
          // Criar perfil padrão se o login auth foi bem sucedido
          return {
            id: authData.user.id,
            email: authData.user.email || email,
            first_name: authData.user.user_metadata?.first_name || 'Usuário',
            last_name: authData.user.user_metadata?.last_name || 'Supabase',
            phone: authData.user.phone || '',
            organization_id: 'org_foods_default_001',
            role: (authData.user.user_metadata?.role as any) || 'owner',
            status: 'active',
            created_at: authData.user.created_at || new Date().toISOString(),
          };
        }

        return profileData as Profile;
      } else {
        // Busca apenas perfil se já autenticado
        const { data, error } = await this.client
          .from('profiles')
          .select('*')
          .eq('email', email.trim().toLowerCase())
          .single();

        if (error || !data) return null;
        return data as Profile;
      }
    } catch (err) {
      logger.error('[Supabase Auth] Erro ao autenticar no Supabase:', err);
      return null;
    }
  }

  /**
   * Busca perfis diretamente no Supabase
   */
  public async fetchProfiles(): Promise<Profile[] | null> {
    if (!this.isConfigured() || !this.client) return null;

    try {
      const { data, error } = await this.client.from('profiles').select('*');
      if (error) {
        logger.error('[Supabase DB] Erro ao buscar profiles:', error);
        return null;
      }
      return data as Profile[];
    } catch (err) {
      logger.error('[Supabase DB] Exceção ao buscar profiles:', err);
      return null;
    }
  }

  /**
   * Salva ou atualiza perfil no Supabase
   */
  public async upsertProfile(profile: Profile): Promise<boolean> {
    if (!this.isConfigured() || !this.client) return false;

    try {
      const { error } = await this.client.from('profiles').upsert(profile);
      if (error) {
        logger.error('[Supabase DB] Erro no upsert de profile:', error);
        return false;
      }
      return true;
    } catch (err) {
      logger.error('[Supabase DB] Exceção no upsert de profile:', err);
      return false;
    }
  }

  /**
   * Busca dados de uma tabela genérica do Supabase
   */
  public async fetchTableData<T>(table: string): Promise<T[] | null> {
    if (!this.isConfigured() || !this.client) return null;

    try {
      const { data, error } = await this.client.from(table).select('*');
      if (error) {
        logger.warn(`[Supabase DB] Tabela ${table} não acessível ou sem dados: ${error.message}`);
        return null;
      }
      return data as T[];
    } catch (err) {
      logger.warn(`[Supabase DB] Erro ao consultar ${table}:`, err);
      return null;
    }
  }

  /**
   * Salva registro em tabela do Supabase
   */
  public async upsertTableData(table: string, data: any): Promise<boolean> {
    if (!this.isConfigured() || !this.client) return false;

    try {
      const { error } = await this.client.from(table).upsert(data);
      if (error) {
        logger.warn(`[Supabase DB] Falha no upsert da tabela ${table}: ${error.message}`);
        return false;
      }
      return true;
    } catch (err) {
      logger.warn(`[Supabase DB] Erro no upsert da tabela ${table}:`, err);
      return false;
    }
  }
}

export const SupabaseService = new SupabaseServiceManager();
