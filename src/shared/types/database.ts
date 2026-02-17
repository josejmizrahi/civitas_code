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
      admin_terms: {
        Row: {
          id: string
          community_id: string
          member_id: string
          role: string
          term_start: string
          term_end: string | null
          term_number: number
          elected_in_assembly: string | null
          status: string
          created_at: string | null
        }
        Insert: {
          id?: string
          community_id: string
          member_id: string
          role: string
          term_start?: string
          term_end?: string | null
          term_number?: number
          elected_in_assembly?: string | null
          status?: string
          created_at?: string | null
        }
        Update: {
          community_id?: string
          member_id?: string
          role?: string
          term_start?: string
          term_end?: string | null
          term_number?: number
          elected_in_assembly?: string | null
          status?: string
          created_at?: string | null
        }
      }
      arco_requests: {
        Row: {
          id: string
          user_id: string
          type: string
          status: string
          description: string
          requested_data: Json | null
          response: string | null
          responded_at: string | null
          responded_by: string | null
          deadline: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          status?: string
          description: string
          requested_data?: Json | null
          response?: string | null
          responded_at?: string | null
          responded_by?: string | null
          deadline: string
          created_at?: string | null
        }
        Update: {
          user_id?: string
          type?: string
          status?: string
          description?: string
          requested_data?: Json | null
          response?: string | null
          responded_at?: string | null
          responded_by?: string | null
          deadline?: string
          created_at?: string | null
        }
      }
      assemblies: {
        Row: {
          id: string
          community_id: string
          type: string
          title: string
          scheduled_date: string
          location: string
          called_by: string
          agenda: Json
          status: string
          current_call: number
          first_call_at: string | null
          second_call_at: string | null
          third_call_at: string | null
          quorum_met: boolean | null
          quorum_pct: number | null
          attendance: Json | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          community_id: string
          type?: string
          title: string
          scheduled_date: string
          location?: string
          called_by: string
          agenda?: Json
          status?: string
          current_call?: number
          first_call_at?: string | null
          second_call_at?: string | null
          third_call_at?: string | null
          quorum_met?: boolean | null
          quorum_pct?: number | null
          attendance?: Json | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          community_id?: string
          type?: string
          title?: string
          scheduled_date?: string
          location?: string
          called_by?: string
          agenda?: Json
          status?: string
          current_call?: number
          first_call_at?: string | null
          second_call_at?: string | null
          third_call_at?: string | null
          quorum_met?: boolean | null
          quorum_pct?: number | null
          attendance?: Json | null
          notes?: string | null
          created_at?: string | null
        }
      }
      assembly_proxies: {
        Row: {
          id: string
          community_id: string
          assembly_id: string
          grantor_id: string
          representative_id: string
          granted_at: string | null
          revoked_at: string | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          community_id: string
          assembly_id: string
          grantor_id: string
          representative_id: string
          granted_at?: string | null
          revoked_at?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          community_id?: string
          assembly_id?: string
          grantor_id?: string
          representative_id?: string
          granted_at?: string | null
          revoked_at?: string | null
          is_active?: boolean | null
          created_at?: string | null
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
          details: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          community_id: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          details?: Json | null
          created_at?: string | null
        }
        Update: {
          community_id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          details?: Json | null
          created_at?: string | null
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
          fund_type: string
        }
        Insert: {
          id?: string
          community_id: string
          category_id: string
          period: string
          amount: number
          approved_by_proposal_id?: string | null
          created_at?: string
          fund_type?: string
        }
        Update: {
          community_id?: string
          category_id?: string
          period?: string
          amount?: number
          approved_by_proposal_id?: string | null
          created_at?: string
          fund_type?: string
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
          created_at: string
          is_active: boolean
          deleted_at: string | null
        }
        Insert: {
          id?: string
          community_id: string
          name: string
          type: string
          parent_id?: string | null
          is_system?: boolean
          created_at?: string
          is_active?: boolean
          deleted_at?: string | null
        }
        Update: {
          community_id?: string
          name?: string
          type?: string
          parent_id?: string | null
          is_system?: boolean
          created_at?: string
          is_active?: boolean
          deleted_at?: string | null
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
          community_id?: string
          source_id?: string
          external_name?: string
          internal_category_id?: string
          auto_matched?: boolean
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
          community_id?: string
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
          community_id?: string
          source_id?: string
          external_column?: string
          internal_field?: string
          transform?: Json
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
          community_id?: string
          name?: string
          rules?: string | null
          reservation_enabled?: boolean
        }
      }
      communities: {
        Row: {
          id: string
          name: string
          slug: string
          type: string
          config: Json
          created_at: string
          updated_at: string
          rules: Json
          description: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          type?: string
          config?: Json
          created_at?: string
          updated_at?: string
          rules?: Json
          description?: string | null
        }
        Update: {
          name?: string
          slug?: string
          type?: string
          config?: Json
          created_at?: string
          updated_at?: string
          rules?: Json
          description?: string | null
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
          paid_amount: number | null
          paid_at: string | null
          notes: string | null
          created_at: string | null
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
          paid_amount?: number | null
          paid_at?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          contract_id?: string
          community_id?: string
          installment_number?: number
          amount?: number
          due_date?: string
          status?: string
          payment_obligation_id?: string | null
          transaction_id?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          notes?: string | null
          created_at?: string | null
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
          currency: string | null
          payment_frequency: string | null
          number_of_installments: number
          start_date: string
          end_date: string | null
          status: string
          compliance_score: number | null
          terms: Json | null
          document_ids: Json | null
          approved_by_proposal_id: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
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
          currency?: string | null
          payment_frequency?: string | null
          number_of_installments?: number
          start_date: string
          end_date?: string | null
          status?: string
          compliance_score?: number | null
          terms?: Json | null
          document_ids?: Json | null
          approved_by_proposal_id?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          community_id?: string
          name?: string
          description?: string | null
          type?: string
          entity_id?: string | null
          member_id?: string | null
          total_amount?: number
          currency?: string | null
          payment_frequency?: string | null
          number_of_installments?: number
          start_date?: string
          end_date?: string | null
          status?: string
          compliance_score?: number | null
          terms?: Json | null
          document_ids?: Json | null
          approved_by_proposal_id?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      convocatorias: {
        Row: {
          id: string
          community_id: string
          assembly_id: string
          call_number: number
          type: string
          scheduled_date: string
          location: string
          agenda: Json
          called_by: string
          issued_at: string
          minimum_notice_days: number
          delivery_method: string
          delivery_log: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          community_id: string
          assembly_id: string
          call_number?: number
          type: string
          scheduled_date: string
          location?: string
          agenda?: Json
          called_by: string
          issued_at?: string
          minimum_notice_days?: number
          delivery_method?: string
          delivery_log?: Json | null
          created_at?: string | null
        }
        Update: {
          community_id?: string
          assembly_id?: string
          call_number?: number
          type?: string
          scheduled_date?: string
          location?: string
          agenda?: Json
          called_by?: string
          issued_at?: string
          minimum_notice_days?: number
          delivery_method?: string
          delivery_log?: Json | null
          created_at?: string | null
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
          type?: string
          config?: Json
          last_sync_at?: string | null
          status?: string
          created_by: string
          created_at?: string
        }
        Update: {
          community_id?: string
          name?: string
          type?: string
          config?: Json
          last_sync_at?: string | null
          status?: string
          created_by?: string
          created_at?: string
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
          community_id?: string
          from_member_id?: string
          to_member_id?: string
          scope?: string
          active?: boolean
          created_at?: string
        }
      }
      document_retention: {
        Row: {
          id: string
          community_id: string
          document_type: string
          document_id: string
          retention_years: number
          created_at: string | null
          expires_at: string
          integrity_hash: string | null
          archived: boolean | null
          archived_at: string | null
        }
        Insert: {
          id?: string
          community_id: string
          document_type: string
          document_id: string
          retention_years?: number
          created_at?: string | null
          expires_at: string
          integrity_hash?: string | null
          archived?: boolean | null
          archived_at?: string | null
        }
        Update: {
          community_id?: string
          document_type?: string
          document_id?: string
          retention_years?: number
          created_at?: string | null
          expires_at?: string
          integrity_hash?: string | null
          archived?: boolean | null
          archived_at?: string | null
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
          category?: string
          uploaded_by: string
          created_at?: string
        }
        Update: {
          community_id?: string
          title?: string
          file_url?: string
          category?: string
          uploaded_by?: string
          created_at?: string
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
          metadata: Json | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
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
          metadata?: Json | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          community_id?: string
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
          metadata?: Json | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
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
          is_primary: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          entity_id: string
          name: string
          role?: string | null
          email?: string | null
          phone?: string | null
          is_primary?: boolean | null
          created_at?: string | null
        }
        Update: {
          entity_id?: string
          name?: string
          role?: string | null
          email?: string | null
          phone?: string | null
          is_primary?: boolean | null
          created_at?: string | null
        }
      }
      financial_statements: {
        Row: {
          id: string
          community_id: string
          period: string
          fund_type: string
          opening_balance: number | null
          total_income: number | null
          total_expense: number | null
          closing_balance: number | null
          line_items: Json | null
          generated_at: string | null
          generated_by: string | null
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          community_id: string
          period: string
          fund_type?: string
          opening_balance?: number | null
          total_income?: number | null
          total_expense?: number | null
          closing_balance?: number | null
          line_items?: Json | null
          generated_at?: string | null
          generated_by?: string | null
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
        }
        Update: {
          community_id?: string
          period?: string
          fund_type?: string
          opening_balance?: number | null
          total_income?: number | null
          total_expense?: number | null
          closing_balance?: number | null
          line_items?: Json | null
          generated_at?: string | null
          generated_by?: string | null
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
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
          rolled_back: boolean
          rolled_back_at: string | null
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
          rolled_back?: boolean
          rolled_back_at?: string | null
        }
        Update: {
          community_id?: string
          source_id?: string
          status?: string
          file_url?: string | null
          rows_total?: number
          rows_imported?: number
          rows_skipped?: number
          error_log?: Json
          started_at?: string
          completed_at?: string | null
          rolled_back?: boolean
          rolled_back_at?: string | null
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
          community_id?: string
          email?: string
          role?: string
          status?: string
          token?: string
          expires_at?: string
          created_by?: string
          created_at?: string
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
          community_id?: string
          unit_id?: string
          description?: string
          status?: string
          priority?: string
          assigned_to?: string | null
          created_by?: string
          created_at?: string
        }
      }
      members: {
        Row: {
          id: string
          community_id: string
          user_id: string
          role: string
          status: string
          custom_attributes: Json
          joined_at: string
          created_at: string
          voting_weight: number
          financial_standing: string
          moroso_since: string | null
          moroso_notified_at: string | null
        }
        Insert: {
          id?: string
          community_id: string
          user_id: string
          role?: string
          status?: string
          custom_attributes?: Json
          joined_at?: string
          created_at?: string
          voting_weight?: number
          financial_standing?: string
          moroso_since?: string | null
          moroso_notified_at?: string | null
        }
        Update: {
          community_id?: string
          user_id?: string
          role?: string
          status?: string
          custom_attributes?: Json
          joined_at?: string
          created_at?: string
          voting_weight?: number
          financial_standing?: string
          moroso_since?: string | null
          moroso_notified_at?: string | null
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
          assembly_id: string | null
          legal_type: string | null
          assembly_type: string | null
          attendee_count: number | null
          quorum_pct: number | null
          integrity_hash: string | null
          retention_until: string | null
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
          assembly_id?: string | null
          legal_type?: string | null
          assembly_type?: string | null
          attendee_count?: number | null
          quorum_pct?: number | null
          integrity_hash?: string | null
          retention_until?: string | null
        }
        Update: {
          community_id?: string
          proposal_id?: string | null
          content?: string
          generated_at?: string
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          signatures?: Json
          assembly_id?: string | null
          legal_type?: string | null
          assembly_type?: string | null
          attendee_count?: number | null
          quorum_pct?: number | null
          integrity_hash?: string | null
          retention_until?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          community_id: string
          member_id: string
          type: string
          title: string
          body: string | null
          metadata: Json | null
          read: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          community_id: string
          member_id: string
          type: string
          title: string
          body?: string | null
          metadata?: Json | null
          read?: boolean | null
          created_at?: string | null
        }
        Update: {
          community_id?: string
          member_id?: string
          type?: string
          title?: string
          body?: string | null
          metadata?: Json | null
          read?: boolean | null
          created_at?: string | null
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
          created_at: string
          payment_transaction_id: string | null
          transaction_id: string | null
          obligation_type: string
          fund_type: string
        }
        Insert: {
          id?: string
          community_id: string
          member_id: string
          amount: number
          due_date: string
          status?: string
          concept: string
          created_at?: string
          payment_transaction_id?: string | null
          transaction_id?: string | null
          obligation_type?: string
          fund_type?: string
        }
        Update: {
          community_id?: string
          member_id?: string
          amount?: number
          due_date?: string
          status?: string
          concept?: string
          created_at?: string
          payment_transaction_id?: string | null
          transaction_id?: string | null
          obligation_type?: string
          fund_type?: string
        }
      }
      privacy_consents: {
        Row: {
          id: string
          user_id: string
          version: string
          consent_type: string
          granted: boolean
          granted_at: string | null
          revoked_at: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          version: string
          consent_type: string
          granted?: boolean
          granted_at?: string | null
          revoked_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Update: {
          user_id?: string
          version?: string
          consent_type?: string
          granted?: boolean
          granted_at?: string | null
          revoked_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
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
          created_by: string
          created_at: string
          result: string | null
          closed_at: string | null
          closed_by: string | null
          financial_instruction: Json | null
          execution_status: string | null
          executed_at: string | null
          cool_down_until: string | null
          assembly_id: string | null
        }
        Insert: {
          id?: string
          community_id: string
          title: string
          description?: string
          type?: string
          status?: string
          quorum_required?: number
          majority_required?: number
          voting_start?: string | null
          voting_end?: string | null
          created_by: string
          created_at?: string
          result?: string | null
          closed_at?: string | null
          closed_by?: string | null
          financial_instruction?: Json | null
          execution_status?: string | null
          executed_at?: string | null
          cool_down_until?: string | null
          assembly_id?: string | null
        }
        Update: {
          community_id?: string
          title?: string
          description?: string
          type?: string
          status?: string
          quorum_required?: number
          majority_required?: number
          voting_start?: string | null
          voting_end?: string | null
          created_by?: string
          created_at?: string
          result?: string | null
          closed_at?: string | null
          closed_by?: string | null
          financial_instruction?: Json | null
          execution_status?: string | null
          executed_at?: string | null
          cool_down_until?: string | null
          assembly_id?: string | null
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
          dimensions: Json | null
          comment: string | null
          contract_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          community_id: string
          target_type: string
          target_id: string
          rated_by: string
          overall_score: number
          dimensions?: Json | null
          comment?: string | null
          contract_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          community_id?: string
          target_type?: string
          target_id?: string
          rated_by?: string
          overall_score?: number
          dimensions?: Json | null
          comment?: string | null
          contract_id?: string | null
          created_at?: string | null
          updated_at?: string | null
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
          currency: string | null
          category_id: string | null
          target_type: string
          target_entity_id: string | null
          target_member_ids: Json | null
          day_of_month: number | null
          start_date: string
          end_date: string | null
          next_run_date: string
          last_run_date: string | null
          is_active: boolean | null
          auto_generate: boolean | null
          runs_completed: number | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
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
          currency?: string | null
          category_id?: string | null
          target_type?: string
          target_entity_id?: string | null
          target_member_ids?: Json | null
          day_of_month?: number | null
          start_date: string
          end_date?: string | null
          next_run_date: string
          last_run_date?: string | null
          is_active?: boolean | null
          auto_generate?: boolean | null
          runs_completed?: number | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          community_id?: string
          name?: string
          description?: string | null
          type?: string
          frequency?: string
          custom_interval_days?: number | null
          amount?: number
          currency?: string | null
          category_id?: string | null
          target_type?: string
          target_entity_id?: string | null
          target_member_ids?: Json | null
          day_of_month?: number | null
          start_date?: string
          end_date?: string | null
          next_run_date?: string
          last_run_date?: string | null
          is_active?: boolean | null
          auto_generate?: boolean | null
          runs_completed?: number | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
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
          community_id?: string
          name?: string
          permissions?: Json
          created_at?: string
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
          created_by: string | null
          created_at: string
          import_job_id: string | null
          fund_type: string
        }
        Insert: {
          id?: string
          community_id: string
          type: string
          amount: number
          category_id?: string | null
          description?: string
          date: string
          source_id?: string | null
          evidence_url?: string | null
          external_ref?: string | null
          created_by?: string | null
          created_at?: string
          import_job_id?: string | null
          fund_type?: string
        }
        Update: {
          community_id?: string
          type?: string
          amount?: number
          category_id?: string | null
          description?: string
          date?: string
          source_id?: string | null
          evidence_url?: string | null
          external_ref?: string | null
          created_by?: string | null
          created_at?: string
          import_job_id?: string | null
          fund_type?: string
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
          community_id?: string
          member_id?: string | null
          unit_number?: string
          floor?: number | null
          tower?: string | null
          indiviso_pct?: number | null
          area_m2?: number | null
        }
      }
      vigilancia_reports: {
        Row: {
          id: string
          community_id: string
          author_id: string
          period: string
          report_type: string
          title: string
          content: string
          findings: Json | null
          recommendations: Json | null
          status: string
          submitted_at: string | null
          reviewed_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          community_id: string
          author_id: string
          period: string
          report_type?: string
          title: string
          content: string
          findings?: Json | null
          recommendations?: Json | null
          status?: string
          submitted_at?: string | null
          reviewed_at?: string | null
          created_at?: string | null
        }
        Update: {
          community_id?: string
          author_id?: string
          period?: string
          report_type?: string
          title?: string
          content?: string
          findings?: Json | null
          recommendations?: Json | null
          status?: string
          submitted_at?: string | null
          reviewed_at?: string | null
          created_at?: string | null
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
          proposal_id?: string
          member_id?: string
          value?: string
          weight?: number
          delegated_from?: string | null
          cast_at?: string
        }
      }
    }
    Views: {
      entity_ratings_summary: {
        Row: {
          community_id: string | null
          target_type: string | null
          target_id: string | null
          total_ratings: number | null
          avg_score: number | null
          avg_punctuality: number | null
          avg_quality: number | null
          avg_communication: number | null
          avg_compliance: number | null
          avg_value: number | null
        }
      }
      member_profiles: {
        Row: {
          id: string | null
          community_id: string | null
          user_id: string | null
          role: string | null
          status: string | null
          custom_attributes: Json | null
          joined_at: string | null
          created_at: string | null
          voting_weight: number | null
          financial_standing: string | null
          email: string | null
          full_name: string | null
        }
      }
    }
    Functions: {
      accept_invitation: {
        Args: { p_token: string; p_user_id: string }
        Returns: void
      }
      close_expired_proposal: {
        Args: { p_proposal_id: string }
        Returns: void
      }
      compute_financial_standing: {
        Args: { p_member_id: string; p_community_id: string }
        Returns: string
      }
      compute_moroso_status: {
        Args: { p_community_id: string }
        Returns: {
          member_id: string
          old_standing: string
          new_standing: string
          ordinary_unpaid: number
          extraordinary_unpaid: number
        }[]
      }
      create_community_with_admin: {
        Args: {
          p_user_id: string
          p_name: string
          p_slug: string
          p_type: string
          p_description: string
        }
        Returns: Json
      }
      generate_monthly_statement: {
        Args: {
          p_community_id: string
          p_period: string
          p_fund_type: string
          p_generated_by: string
        }
        Returns: string
      }
      generate_recurring_obligations: {
        Args: { p_schedule_id: string }
        Returns: number
      }
      get_member_debt_summary: {
        Args: { p_member_id: string }
        Returns: {
          ordinary_unpaid: number
          extraordinary_unpaid: number
          total_debt: number
          is_moroso: boolean
          moroso_since: string
          restrictions: Json
        }[]
      }
      get_platform_census: {
        Args: Record<string, never>
        Returns: Json
      }
      get_user_community_ids: {
        Args: Record<string, never>
        Returns: string[]
      }
      get_user_role: {
        Args: { p_community_id: string }
        Returns: string | null
      }
      notify_community: {
        Args: {
          p_community_id: string
          p_type: string
          p_title: string
          p_body: string
          p_metadata: Json
        }
        Returns: number
      }
      notify_member: {
        Args: {
          p_community_id: string
          p_member_id: string
          p_type: string
          p_title: string
          p_body: string
          p_metadata: Json
        }
        Returns: string
      }
      process_auto_executions: {
        Args: Record<string, never>
        Returns: number
      }
      process_expired_proposals: {
        Args: Record<string, never>
        Returns: number
      }
      process_recurring_schedules: {
        Args: { p_community_id: string }
        Returns: number
      }
      refresh_financial_standings: {
        Args: { p_community_id: string }
        Returns: void
      }
      take_census_snapshot: {
        Args: { p_community_id: string }
        Returns: Database['public']['Tables']['census_snapshots']['Row']
      }
      update_contract_compliance: {
        Args: { p_contract_id: string }
        Returns: number
      }
      validate_proxy_limits: {
        Args: {
          p_community_id: string
          p_assembly_id: string
          p_representative_id: string
        }
        Returns: Json
      }
    }
    Enums: Record<string, never>
  }
}
