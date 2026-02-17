export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      communities: {
        Row: {
          id: string
          name: string
          slug: string
          type: string
          config: Json
          rules: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          type: string
          config?: Json
          rules?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          type?: string
          config?: Json
          rules?: Json
          updated_at?: string
        }
      }
      members: {
        Row: {
          id: string
          community_id: string
          user_id: string
          role: string
          status: string
          voting_weight: number
          financial_standing: string
          custom_attributes: Json
          joined_at: string
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          user_id: string
          role?: string
          status?: string
          voting_weight?: number
          financial_standing?: string
          custom_attributes?: Json
          joined_at?: string
          created_at?: string
        }
        Update: {
          role?: string
          status?: string
          voting_weight?: number
          financial_standing?: string
          custom_attributes?: Json
        }
      }
      roles: {
        Row: {
          id: string
          community_id: string
          name: string
          permissions: Json
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          name: string
          permissions?: Json
          created_at?: string
        }
        Update: {
          name?: string
          permissions?: Json
        }
      }
      invitations: {
        Row: {
          id: string
          community_id: string
          email: string
          role: string
          status: string
          token: string
          expires_at: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          email: string
          role?: string
          status?: string
          token?: string
          expires_at?: string
          created_by: string
          created_at?: string
        }
        Update: {
          status?: string
        }
      }
      categories: {
        Row: {
          id: string
          community_id: string
          name: string
          type: string
          parent_id: string | null
          is_system: boolean
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          name: string
          type: string
          parent_id?: string | null
          is_system?: boolean
          is_active?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          type?: string
          parent_id?: string | null
          is_active?: boolean
        }
      }
      transactions: {
        Row: {
          id: string
          community_id: string
          type: string
          amount: number
          category_id: string | null
          description: string
          date: string
          source_id: string | null
          evidence_url: string | null
          external_ref: string | null
          import_job_id: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          type: string
          amount: number
          category_id?: string | null
          description: string
          date: string
          source_id?: string | null
          evidence_url?: string | null
          external_ref?: string | null
          import_job_id?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          type?: string
          amount?: number
          category_id?: string | null
          description?: string
          date?: string
          evidence_url?: string | null
          import_job_id?: string | null
        }
      }
      budgets: {
        Row: {
          id: string
          community_id: string
          category_id: string
          period: string
          amount: number
          approved_by_proposal_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          category_id: string
          period: string
          amount: number
          approved_by_proposal_id?: string | null
          created_at?: string
        }
        Update: {
          amount?: number
          period?: string
        }
      }
      payment_obligations: {
        Row: {
          id: string
          community_id: string
          member_id: string
          amount: number
          due_date: string
          status: string
          concept: string
          payment_transaction_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          member_id: string
          amount: number
          due_date: string
          status?: string
          concept: string
          payment_transaction_id?: string | null
          created_at?: string
        }
        Update: {
          amount?: number
          status?: string
          due_date?: string
          payment_transaction_id?: string | null
        }
      }
      proposals: {
        Row: {
          id: string
          community_id: string
          title: string
          description: string
          type: string
          status: string
          quorum_required: number
          majority_required: number
          voting_start: string | null
          voting_end: string | null
          result: string | null
          closed_at: string | null
          closed_by: string | null
          financial_instruction: Json | null
          execution_status: string | null
          executed_at: string | null
          cool_down_until: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          title: string
          description: string
          type?: string
          status?: string
          quorum_required?: number
          majority_required?: number
          voting_start?: string | null
          voting_end?: string | null
          result?: string | null
          closed_at?: string | null
          closed_by?: string | null
          financial_instruction?: Json | null
          execution_status?: string | null
          executed_at?: string | null
          cool_down_until?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          title?: string
          description?: string
          status?: string
          voting_start?: string
          voting_end?: string
          result?: string | null
          closed_at?: string | null
          closed_by?: string | null
          financial_instruction?: Json | null
          execution_status?: string | null
          executed_at?: string | null
          cool_down_until?: string | null
        }
      }
      votes: {
        Row: {
          id: string
          proposal_id: string
          member_id: string
          value: string
          weight: number
          delegated_from: string | null
          cast_at: string
        }
        Insert: {
          id?: string
          proposal_id: string
          member_id: string
          value: string
          weight?: number
          delegated_from?: string | null
          cast_at?: string
        }
        Update: {
          value?: string
        }
      }
      delegations: {
        Row: {
          id: string
          community_id: string
          from_member_id: string
          to_member_id: string
          scope: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          from_member_id: string
          to_member_id: string
          scope?: string
          active?: boolean
          created_at?: string
        }
        Update: {
          active?: boolean
          scope?: string
        }
      }
      minutes: {
        Row: {
          id: string
          community_id: string
          proposal_id: string | null
          content: string
          generated_at: string
          approved: boolean
          approved_at: string | null
          approved_by: string | null
          signatures: Json
        }
        Insert: {
          id?: string
          community_id: string
          proposal_id?: string | null
          content: string
          generated_at?: string
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          signatures?: Json
          created_at?: string
        }
        Update: {
          content?: string
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          signatures?: Json
        }
      }
      documents: {
        Row: {
          id: string
          community_id: string
          title: string
          file_url: string
          category: string
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          title: string
          file_url: string
          category: string
          uploaded_by: string
          created_at?: string
        }
        Update: {
          title?: string
          category?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          community_id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          details?: Json
          created_at?: string
        }
        Update: {
          details?: Json
        }
      }
      census_snapshots: {
        Row: {
          id: string
          community_id: string
          total_members: number
          active_members: number
          members_good_standing: number
          members_delinquent: number
          total_income: number
          total_expenses: number
          active_proposals: number
          snapshot_date: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          total_members?: number
          active_members?: number
          members_good_standing?: number
          members_delinquent?: number
          total_income?: number
          total_expenses?: number
          active_proposals?: number
          snapshot_date?: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          total_members?: number
          active_members?: number
          members_good_standing?: number
          members_delinquent?: number
          total_income?: number
          total_expenses?: number
          active_proposals?: number
          metadata?: Json
        }
      }
      data_sources: {
        Row: {
          id: string
          community_id: string
          name: string
          type: string
          config: Json
          last_sync_at: string | null
          status: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          name: string
          type: string
          config?: Json
          last_sync_at?: string | null
          status?: string
          created_by: string
          created_at?: string
        }
        Update: {
          name?: string
          config?: Json
          last_sync_at?: string | null
          status?: string
        }
      }
      import_jobs: {
        Row: {
          id: string
          community_id: string
          source_id: string
          status: string
          file_url: string | null
          rows_total: number
          rows_imported: number
          rows_skipped: number
          error_log: Json
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          community_id: string
          source_id: string
          status?: string
          file_url?: string | null
          rows_total?: number
          rows_imported?: number
          rows_skipped?: number
          error_log?: Json
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          status?: string
          rows_total?: number
          rows_imported?: number
          rows_skipped?: number
          error_log?: Json
          completed_at?: string | null
        }
      }
      category_mappings: {
        Row: {
          id: string
          community_id: string
          source_id: string
          external_name: string
          internal_category_id: string
          auto_matched: boolean
        }
        Insert: {
          id?: string
          community_id: string
          source_id: string
          external_name: string
          internal_category_id: string
          auto_matched?: boolean
        }
        Update: {
          internal_category_id?: string
          auto_matched?: boolean
        }
      }
      column_mappings: {
        Row: {
          id: string
          community_id: string
          source_id: string
          external_column: string
          internal_field: string
          transform: Json
        }
        Insert: {
          id?: string
          community_id: string
          source_id: string
          external_column: string
          internal_field: string
          transform?: Json
        }
        Update: {
          internal_field?: string
          transform?: Json
        }
      }
      units: {
        Row: {
          id: string
          community_id: string
          member_id: string | null
          unit_number: string
          floor: number | null
          tower: string | null
          indiviso_pct: number | null
          area_m2: number | null
        }
        Insert: {
          id?: string
          community_id: string
          member_id?: string | null
          unit_number: string
          floor?: number | null
          tower?: string | null
          indiviso_pct?: number | null
          area_m2?: number | null
        }
        Update: {
          member_id?: string | null
          unit_number?: string
          floor?: number | null
          tower?: string | null
          indiviso_pct?: number | null
          area_m2?: number | null
        }
      }
      common_areas: {
        Row: {
          id: string
          community_id: string
          name: string
          rules: string | null
          reservation_enabled: boolean
        }
        Insert: {
          id?: string
          community_id: string
          name: string
          rules?: string | null
          reservation_enabled?: boolean
        }
        Update: {
          name?: string
          rules?: string | null
          reservation_enabled?: boolean
        }
      }
      maintenance_requests: {
        Row: {
          id: string
          community_id: string
          unit_id: string
          description: string
          status: string
          priority: string
          assigned_to: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          unit_id: string
          description: string
          status?: string
          priority?: string
          assigned_to?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          description?: string
          status?: string
          priority?: string
          assigned_to?: string | null
        }
      }
      entities: {
        Row: {
          id: string
          community_id: string
          name: string
          type: string
          rfc: string | null
          email: string | null
          phone: string | null
          address: string | null
          clabe: string | null
          bank_name: string | null
          contact_person: string | null
          status: string
          notes: string | null
          metadata: Json
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          community_id: string
          name: string
          type?: string
          rfc?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          clabe?: string | null
          bank_name?: string | null
          contact_person?: string | null
          status?: string
          notes?: string | null
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          type?: string
          rfc?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          clabe?: string | null
          bank_name?: string | null
          contact_person?: string | null
          status?: string
          notes?: string | null
          metadata?: Json
        }
      }
      entity_contacts: {
        Row: {
          id: string
          entity_id: string
          name: string
          role: string | null
          email: string | null
          phone: string | null
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          entity_id: string
          name: string
          role?: string | null
          email?: string | null
          phone?: string | null
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          role?: string | null
          email?: string | null
          phone?: string | null
          is_primary?: boolean
        }
      }
      recurring_schedules: {
        Row: {
          id: string
          community_id: string
          name: string
          description: string | null
          type: string
          frequency: string
          custom_interval_days: number | null
          amount: number
          currency: string
          category_id: string | null
          target_type: string
          target_entity_id: string | null
          target_member_ids: Json
          day_of_month: number
          start_date: string
          end_date: string | null
          next_run_date: string
          last_run_date: string | null
          is_active: boolean
          auto_generate: boolean
          runs_completed: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          community_id: string
          name: string
          description?: string | null
          type?: string
          frequency?: string
          custom_interval_days?: number | null
          amount: number
          currency?: string
          category_id?: string | null
          target_type?: string
          target_entity_id?: string | null
          target_member_ids?: Json
          day_of_month?: number
          start_date: string
          end_date?: string | null
          next_run_date: string
          last_run_date?: string | null
          is_active?: boolean
          auto_generate?: boolean
          runs_completed?: number
          created_by?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          type?: string
          frequency?: string
          custom_interval_days?: number | null
          amount?: number
          category_id?: string | null
          target_type?: string
          target_entity_id?: string | null
          target_member_ids?: Json
          day_of_month?: number
          start_date?: string
          end_date?: string | null
          next_run_date?: string
          is_active?: boolean
          auto_generate?: boolean
        }
      }
      contracts: {
        Row: {
          id: string
          community_id: string
          name: string
          description: string | null
          type: string
          entity_id: string | null
          member_id: string | null
          total_amount: number
          currency: string
          payment_frequency: string
          number_of_installments: number
          start_date: string
          end_date: string | null
          status: string
          compliance_score: number
          terms: Json
          document_ids: Json
          approved_by_proposal_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          community_id: string
          name: string
          description?: string | null
          type?: string
          entity_id?: string | null
          member_id?: string | null
          total_amount: number
          currency?: string
          payment_frequency?: string
          number_of_installments?: number
          start_date: string
          end_date?: string | null
          status?: string
          compliance_score?: number
          terms?: Json
          document_ids?: Json
          approved_by_proposal_id?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          type?: string
          entity_id?: string | null
          member_id?: string | null
          total_amount?: number
          payment_frequency?: string
          number_of_installments?: number
          start_date?: string
          end_date?: string | null
          status?: string
          compliance_score?: number
          terms?: Json
          document_ids?: Json
          approved_by_proposal_id?: string | null
        }
      }
      contract_installments: {
        Row: {
          id: string
          contract_id: string
          community_id: string
          installment_number: number
          amount: number
          due_date: string
          status: string
          payment_obligation_id: string | null
          transaction_id: string | null
          paid_amount: number
          paid_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          contract_id: string
          community_id: string
          installment_number: number
          amount: number
          due_date: string
          status?: string
          payment_obligation_id?: string | null
          transaction_id?: string | null
          paid_amount?: number
          paid_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          amount?: number
          due_date?: string
          status?: string
          payment_obligation_id?: string | null
          transaction_id?: string | null
          paid_amount?: number
          paid_at?: string | null
          notes?: string | null
        }
      }
      ratings: {
        Row: {
          id: string
          community_id: string
          target_type: string
          target_id: string
          rated_by: string
          overall_score: number
          dimensions: Json
          comment: string | null
          contract_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          community_id: string
          target_type: string
          target_id: string
          rated_by: string
          overall_score: number
          dimensions?: Json
          comment?: string | null
          contract_id?: string | null
          created_at?: string
        }
        Update: {
          overall_score?: number
          dimensions?: Json
          comment?: string | null
        }
      }
    }
    Views: {
      member_profiles: {
        Row: {
          id: string
          community_id: string
          user_id: string
          role: string
          status: string
          custom_attributes: Json
          joined_at: string
          created_at: string
          email: string
          full_name: string
        }
      }
      entity_ratings_summary: {
        Row: {
          community_id: string
          target_type: string
          target_id: string
          total_ratings: number
          avg_score: number
          avg_punctuality: number | null
          avg_quality: number | null
          avg_communication: number | null
          avg_compliance: number | null
          avg_value: number | null
        }
      }
    }
    Functions: {
      get_user_community_ids: {
        Args: Record<string, never>
        Returns: string[]
      }
      get_user_role: {
        Args: { p_community_id: string }
        Returns: string | null
      }
      accept_invitation: {
        Args: { p_token: string; p_user_id: string }
        Returns: void
      }
      compute_financial_standing: {
        Args: { p_member_id: string; p_community_id: string }
        Returns: string
      }
      refresh_financial_standings: {
        Args: { p_community_id: string }
        Returns: void
      }
      take_census_snapshot: {
        Args: { p_community_id: string }
        Returns: Database['public']['Tables']['census_snapshots']['Row']
      }
      get_platform_census: {
        Args: Record<string, never>
        Returns: Json
      }
      generate_recurring_obligations: {
        Args: { p_schedule_id: string }
        Returns: number
      }
      process_recurring_schedules: {
        Args: { p_community_id: string }
        Returns: number
      }
      update_contract_compliance: {
        Args: { p_contract_id: string }
        Returns: number
      }
    }
    Enums: Record<string, never>
  }
}
