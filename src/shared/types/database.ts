export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_terms: {
        Row: {
          community_id: string
          created_at: string | null
          elected_in_assembly: string | null
          id: string
          member_id: string
          role: string
          status: string
          term_end: string | null
          term_number: number
          term_start: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          elected_in_assembly?: string | null
          id?: string
          member_id: string
          role: string
          status?: string
          term_end?: string | null
          term_number?: number
          term_start?: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          elected_in_assembly?: string | null
          id?: string
          member_id?: string
          role?: string
          status?: string
          term_end?: string | null
          term_number?: number
          term_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_terms_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      arco_requests: {
        Row: {
          created_at: string | null
          deadline: string
          description: string
          id: string
          requested_data: Json | null
          responded_at: string | null
          responded_by: string | null
          response: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deadline: string
          description: string
          id?: string
          requested_data?: Json | null
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          deadline?: string
          description?: string
          id?: string
          requested_data?: Json | null
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      assemblies: {
        Row: {
          agenda: Json
          attendance: Json | null
          called_by: string
          community_id: string
          created_at: string | null
          current_call: number
          first_call_at: string | null
          id: string
          location: string
          notes: string | null
          quorum_met: boolean | null
          quorum_pct: number | null
          scheduled_date: string
          second_call_at: string | null
          status: string
          third_call_at: string | null
          title: string
          type: string
        }
        Insert: {
          agenda?: Json
          attendance?: Json | null
          called_by: string
          community_id: string
          created_at?: string | null
          current_call?: number
          first_call_at?: string | null
          id?: string
          location?: string
          notes?: string | null
          quorum_met?: boolean | null
          quorum_pct?: number | null
          scheduled_date: string
          second_call_at?: string | null
          status?: string
          third_call_at?: string | null
          title: string
          type?: string
        }
        Update: {
          agenda?: Json
          attendance?: Json | null
          called_by?: string
          community_id?: string
          created_at?: string | null
          current_call?: number
          first_call_at?: string | null
          id?: string
          location?: string
          notes?: string | null
          quorum_met?: boolean | null
          quorum_pct?: number | null
          scheduled_date?: string
          second_call_at?: string | null
          status?: string
          third_call_at?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "assemblies_called_by_fkey"
            columns: ["called_by"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assemblies_called_by_fkey"
            columns: ["called_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assemblies_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      assembly_proxies: {
        Row: {
          assembly_id: string
          community_id: string
          created_at: string | null
          granted_at: string | null
          grantor_id: string
          id: string
          is_active: boolean | null
          representative_id: string
          revoked_at: string | null
        }
        Insert: {
          assembly_id: string
          community_id: string
          created_at?: string | null
          granted_at?: string | null
          grantor_id: string
          id?: string
          is_active?: boolean | null
          representative_id: string
          revoked_at?: string | null
        }
        Update: {
          assembly_id?: string
          community_id?: string
          created_at?: string | null
          granted_at?: string | null
          grantor_id?: string
          id?: string
          is_active?: boolean | null
          representative_id?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assembly_proxies_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          community_id: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          community_id: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          community_id?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          approved_by_proposal_id: string | null
          category_id: string
          community_id: string
          created_at: string
          fund_type: string
          id: string
          period: string
        }
        Insert: {
          amount: number
          approved_by_proposal_id?: string | null
          category_id: string
          community_id: string
          created_at?: string
          fund_type?: string
          id?: string
          period: string
        }
        Update: {
          amount?: number
          approved_by_proposal_id?: string | null
          category_id?: string
          community_id?: string
          created_at?: string
          fund_type?: string
          id?: string
          period?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_proposal_fk"
            columns: ["approved_by_proposal_id"]
            isOneToOne: false
            referencedRelation: "decision_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_proposal_fk"
            columns: ["approved_by_proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          community_id: string
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          parent_id: string | null
          type: string
        }
        Insert: {
          community_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          parent_id?: string | null
          type: string
        }
        Update: {
          community_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          parent_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_mappings: {
        Row: {
          auto_matched: boolean
          community_id: string
          external_name: string
          id: string
          internal_category_id: string
          source_id: string
        }
        Insert: {
          auto_matched?: boolean
          community_id: string
          external_name: string
          id?: string
          internal_category_id: string
          source_id: string
        }
        Update: {
          auto_matched?: boolean
          community_id?: string
          external_name?: string
          id?: string
          internal_category_id?: string
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_mappings_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_mappings_internal_category_id_fkey"
            columns: ["internal_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_mappings_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      census_snapshots: {
        Row: {
          active_members: number
          active_proposals: number
          community_id: string
          created_at: string
          id: string
          members_delinquent: number
          members_good_standing: number
          metadata: Json
          snapshot_date: string
          total_expenses: number
          total_income: number
          total_members: number
        }
        Insert: {
          active_members?: number
          active_proposals?: number
          community_id: string
          created_at?: string
          id?: string
          members_delinquent?: number
          members_good_standing?: number
          metadata?: Json
          snapshot_date?: string
          total_expenses?: number
          total_income?: number
          total_members?: number
        }
        Update: {
          active_members?: number
          active_proposals?: number
          community_id?: string
          created_at?: string
          id?: string
          members_delinquent?: number
          members_good_standing?: number
          metadata?: Json
          snapshot_date?: string
          total_expenses?: number
          total_income?: number
          total_members?: number
        }
        Relationships: [
          {
            foreignKeyName: "census_snapshots_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      column_mappings: {
        Row: {
          community_id: string
          external_column: string
          id: string
          internal_field: string
          source_id: string
          transform: Json
        }
        Insert: {
          community_id: string
          external_column: string
          id?: string
          internal_field: string
          source_id: string
          transform?: Json
        }
        Update: {
          community_id?: string
          external_column?: string
          id?: string
          internal_field?: string
          source_id?: string
          transform?: Json
        }
        Relationships: [
          {
            foreignKeyName: "column_mappings_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "column_mappings_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          member_id: string
          reaction: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          member_id: string
          reaction: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          member_id?: string
          reaction?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "discussion_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_reactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_reactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      common_areas: {
        Row: {
          community_id: string
          id: string
          name: string
          reservation_enabled: boolean
          rules: string | null
        }
        Insert: {
          community_id: string
          id?: string
          name: string
          reservation_enabled?: boolean
          rules?: string | null
        }
        Update: {
          community_id?: string
          id?: string
          name?: string
          reservation_enabled?: boolean
          rules?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "common_areas_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          name: string
          rules: Json
          slug: string
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          name: string
          rules?: Json
          slug: string
          type?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          rules?: Json
          slug?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      contract_installments: {
        Row: {
          amount: number
          community_id: string
          contract_id: string
          created_at: string | null
          due_date: string
          id: string
          installment_number: number
          notes: string | null
          paid_amount: number | null
          paid_at: string | null
          payment_obligation_id: string | null
          status: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          community_id: string
          contract_id: string
          created_at?: string | null
          due_date: string
          id?: string
          installment_number: number
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_obligation_id?: string | null
          status?: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          community_id?: string
          contract_id?: string
          created_at?: string | null
          due_date?: string
          id?: string
          installment_number?: number
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_obligation_id?: string | null
          status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_installments_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_installments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_installments_payment_obligation_id_fkey"
            columns: ["payment_obligation_id"]
            isOneToOne: false
            referencedRelation: "payment_obligations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_installments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          approved_by_proposal_id: string | null
          community_id: string
          compliance_score: number | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          document_ids: Json | null
          end_date: string | null
          entity_id: string | null
          id: string
          member_id: string | null
          name: string
          number_of_installments: number
          payment_frequency: string | null
          start_date: string
          status: string
          terms: Json | null
          total_amount: number
          type: string
          updated_at: string | null
        }
        Insert: {
          approved_by_proposal_id?: string | null
          community_id: string
          compliance_score?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          document_ids?: Json | null
          end_date?: string | null
          entity_id?: string | null
          id?: string
          member_id?: string | null
          name: string
          number_of_installments?: number
          payment_frequency?: string | null
          start_date: string
          status?: string
          terms?: Json | null
          total_amount: number
          type?: string
          updated_at?: string | null
        }
        Update: {
          approved_by_proposal_id?: string | null
          community_id?: string
          compliance_score?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          document_ids?: Json | null
          end_date?: string | null
          entity_id?: string | null
          id?: string
          member_id?: string | null
          name?: string
          number_of_installments?: number
          payment_frequency?: string | null
          start_date?: string
          status?: string
          terms?: Json | null
          total_amount?: number
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_approved_by_proposal_id_fkey"
            columns: ["approved_by_proposal_id"]
            isOneToOne: false
            referencedRelation: "decision_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_approved_by_proposal_id_fkey"
            columns: ["approved_by_proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      convocatorias: {
        Row: {
          agenda: Json
          assembly_id: string
          call_number: number
          called_by: string
          community_id: string
          created_at: string | null
          delivery_log: Json | null
          delivery_method: string
          id: string
          is_valid: boolean | null
          issued_at: string
          location: string
          minimum_notice_days: number
          scheduled_date: string
          type: string
        }
        Insert: {
          agenda?: Json
          assembly_id: string
          call_number?: number
          called_by: string
          community_id: string
          created_at?: string | null
          delivery_log?: Json | null
          delivery_method?: string
          id?: string
          is_valid?: boolean | null
          issued_at?: string
          location?: string
          minimum_notice_days?: number
          scheduled_date: string
          type: string
        }
        Update: {
          agenda?: Json
          assembly_id?: string
          call_number?: number
          called_by?: string
          community_id?: string
          created_at?: string | null
          delivery_log?: Json | null
          delivery_method?: string
          id?: string
          is_valid?: boolean | null
          issued_at?: string
          location?: string
          minimum_notice_days?: number
          scheduled_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "convocatorias_assembly_id_fkey"
            columns: ["assembly_id"]
            isOneToOne: false
            referencedRelation: "assemblies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convocatorias_called_by_fkey"
            columns: ["called_by"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convocatorias_called_by_fkey"
            columns: ["called_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convocatorias_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          community_id: string
          config: Json
          created_at: string
          created_by: string
          id: string
          last_sync_at: string | null
          name: string
          status: string
          type: string
        }
        Insert: {
          community_id: string
          config?: Json
          created_at?: string
          created_by: string
          id?: string
          last_sync_at?: string | null
          name: string
          status?: string
          type?: string
        }
        Update: {
          community_id?: string
          config?: Json
          created_at?: string
          created_by?: string
          id?: string
          last_sync_at?: string | null
          name?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_sources_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      delegations: {
        Row: {
          active: boolean
          community_id: string
          created_at: string
          from_member_id: string
          id: string
          scope: string
          to_member_id: string
        }
        Insert: {
          active?: boolean
          community_id: string
          created_at?: string
          from_member_id: string
          id?: string
          scope?: string
          to_member_id: string
        }
        Update: {
          active?: boolean
          community_id?: string
          created_at?: string
          from_member_id?: string
          id?: string
          scope?: string
          to_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delegations_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegations_from_member_id_fkey"
            columns: ["from_member_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegations_from_member_id_fkey"
            columns: ["from_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegations_to_member_id_fkey"
            columns: ["to_member_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegations_to_member_id_fkey"
            columns: ["to_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_comments: {
        Row: {
          attachments: Json | null
          author_id: string
          community_id: string
          content: string
          content_format: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          mentions: Json | null
          parent_comment_id: string | null
          proposal_id: string
          sentiment: string | null
        }
        Insert: {
          attachments?: Json | null
          author_id: string
          community_id: string
          content: string
          content_format?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          mentions?: Json | null
          parent_comment_id?: string | null
          proposal_id: string
          sentiment?: string | null
        }
        Update: {
          attachments?: Json | null
          author_id?: string
          community_id?: string
          content?: string
          content_format?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          mentions?: Json | null
          parent_comment_id?: string | null
          proposal_id?: string
          sentiment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discussion_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_comments_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "discussion_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_comments_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "decision_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_comments_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      document_retention: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          community_id: string
          created_at: string | null
          document_id: string
          document_type: string
          expires_at: string
          id: string
          integrity_hash: string | null
          retention_years: number
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          community_id: string
          created_at?: string | null
          document_id: string
          document_type: string
          expires_at: string
          id?: string
          integrity_hash?: string | null
          retention_years?: number
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          community_id?: string
          created_at?: string | null
          document_id?: string
          document_type?: string
          expires_at?: string
          id?: string
          integrity_hash?: string | null
          retention_years?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_retention_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          community_id: string
          created_at: string
          file_url: string
          id: string
          title: string
          uploaded_by: string
        }
        Insert: {
          category?: string
          community_id: string
          created_at?: string
          file_url: string
          id?: string
          title: string
          uploaded_by: string
        }
        Update: {
          category?: string
          community_id?: string
          created_at?: string
          file_url?: string
          id?: string
          title?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          address: string | null
          bank_name: string | null
          clabe: string | null
          community_id: string
          contact_person: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          metadata: Json | null
          name: string
          notes: string | null
          phone: string | null
          rfc: string | null
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          bank_name?: string | null
          clabe?: string | null
          community_id: string
          contact_person?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name: string
          notes?: string | null
          phone?: string | null
          rfc?: string | null
          status?: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          bank_name?: string | null
          clabe?: string | null
          community_id?: string
          contact_person?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          notes?: string | null
          phone?: string | null
          rfc?: string | null
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entities_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_contacts: {
        Row: {
          created_at: string | null
          email: string | null
          entity_id: string
          id: string
          is_primary: boolean | null
          name: string
          phone: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          entity_id: string
          id?: string
          is_primary?: boolean | null
          name: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          entity_id?: string
          id?: string
          is_primary?: boolean | null
          name?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_contacts_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_statements: {
        Row: {
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          closing_balance: number | null
          community_id: string
          created_at: string | null
          fund_type: string
          generated_at: string | null
          generated_by: string | null
          id: string
          line_items: Json | null
          opening_balance: number | null
          period: string
          total_expense: number | null
          total_income: number | null
        }
        Insert: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          closing_balance?: number | null
          community_id: string
          created_at?: string | null
          fund_type?: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          line_items?: Json | null
          opening_balance?: number | null
          period: string
          total_expense?: number | null
          total_income?: number | null
        }
        Update: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          closing_balance?: number | null
          community_id?: string
          created_at?: string | null
          fund_type?: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          line_items?: Json | null
          opening_balance?: number | null
          period?: string
          total_expense?: number | null
          total_income?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_statements_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_events: {
        Row: {
          id: string
          community_id: string
          member_id: string
          event_type: string
          points: number
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          member_id: string
          event_type: string
          points?: number
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          member_id?: string
          event_type?: string
          points?: number
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      ifpe_webhook_events: {
        Row: {
          id: string
          community_id: string
          event_type: string
          clabe_destino: string | null
          clabe_origen: string | null
          monto: number | null
          referencia_numerica: string | null
          concepto: string | null
          nombre_ordenante: string | null
          rfc_ordenante: string | null
          fecha_operacion: string | null
          clave_rastreo: string | null
          raw_payload: Json
          reconciliation_status: string
          matched_obligation_id: string | null
          matched_transaction_id: string | null
          processed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          event_type: string
          clabe_destino?: string | null
          clabe_origen?: string | null
          monto?: number | null
          referencia_numerica?: string | null
          concepto?: string | null
          nombre_ordenante?: string | null
          rfc_ordenante?: string | null
          fecha_operacion?: string | null
          clave_rastreo?: string | null
          raw_payload?: Json
          reconciliation_status?: string
          matched_obligation_id?: string | null
          matched_transaction_id?: string | null
          processed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          event_type?: string
          clabe_destino?: string | null
          clabe_origen?: string | null
          monto?: number | null
          referencia_numerica?: string | null
          concepto?: string | null
          nombre_ordenante?: string | null
          rfc_ordenante?: string | null
          fecha_operacion?: string | null
          clave_rastreo?: string | null
          raw_payload?: Json
          reconciliation_status?: string
          matched_obligation_id?: string | null
          matched_transaction_id?: string | null
          processed_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ifpe_webhook_events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      implementation_tasks: {
        Row: {
          community_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          progress_pct: number | null
          proposal_id: string
          responsible_member_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          community_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          progress_pct?: number | null
          proposal_id: string
          responsible_member_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          community_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          progress_pct?: number | null
          proposal_id?: string
          responsible_member_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "implementation_tasks_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "implementation_tasks_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "decision_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "implementation_tasks_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "implementation_tasks_responsible_member_id_fkey"
            columns: ["responsible_member_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "implementation_tasks_responsible_member_id_fkey"
            columns: ["responsible_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          community_id: string
          completed_at: string | null
          error_log: Json
          file_url: string | null
          id: string
          rolled_back: boolean
          rolled_back_at: string | null
          rows_imported: number
          rows_skipped: number
          rows_total: number
          source_id: string
          started_at: string
          status: string
        }
        Insert: {
          community_id: string
          completed_at?: string | null
          error_log?: Json
          file_url?: string | null
          id?: string
          rolled_back?: boolean
          rolled_back_at?: string | null
          rows_imported?: number
          rows_skipped?: number
          rows_total?: number
          source_id: string
          started_at?: string
          status?: string
        }
        Update: {
          community_id?: string
          completed_at?: string | null
          error_log?: Json
          file_url?: string | null
          id?: string
          rolled_back?: boolean
          rolled_back_at?: string | null
          rows_imported?: number
          rows_skipped?: number
          rows_total?: number
          source_id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_jobs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          community_id: string
          created_at: string
          created_by: string
          email: string
          expires_at: string
          id: string
          role: string
          status: string
          token: string
        }
        Insert: {
          community_id: string
          created_at?: string
          created_by: string
          email: string
          expires_at?: string
          id?: string
          role?: string
          status?: string
          token?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          id?: string
          role?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          assigned_to: string | null
          community_id: string
          created_at: string
          created_by: string
          description: string
          id: string
          priority: string
          status: string
          unit_id: string
        }
        Insert: {
          assigned_to?: string | null
          community_id: string
          created_at?: string
          created_by: string
          description: string
          id?: string
          priority?: string
          status?: string
          unit_id: string
        }
        Update: {
          assigned_to?: string | null
          community_id?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          priority?: string
          status?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          community_id: string
          created_at: string
          custom_attributes: Json
          financial_standing: string
          id: string
          joined_at: string
          moroso_notified_at: string | null
          moroso_since: string | null
          role: string
          status: string
          user_id: string
          voting_weight: number
        }
        Insert: {
          community_id: string
          created_at?: string
          custom_attributes?: Json
          financial_standing?: string
          id?: string
          joined_at?: string
          moroso_notified_at?: string | null
          moroso_since?: string | null
          role?: string
          status?: string
          user_id: string
          voting_weight?: number
        }
        Update: {
          community_id?: string
          created_at?: string
          custom_attributes?: Json
          financial_standing?: string
          id?: string
          joined_at?: string
          moroso_notified_at?: string | null
          moroso_since?: string | null
          role?: string
          status?: string
          user_id?: string
          voting_weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      member_gamification: {
        Row: {
          id: string
          community_id: string
          member_id: string
          total_xp: number
          level: number
          badges: Json
          streak_days: number
          last_active_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          community_id: string
          member_id: string
          total_xp?: number
          level?: number
          badges?: Json
          streak_days?: number
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          member_id?: string
          total_xp?: number
          level?: number
          badges?: Json
          streak_days?: number
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_gamification_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      minutes: {
        Row: {
          approved: boolean
          approved_at: string | null
          approved_by: string | null
          assembly_id: string | null
          assembly_type: string | null
          attendee_count: number | null
          community_id: string
          content: string
          generated_at: string
          id: string
          integrity_hash: string | null
          legal_type: string | null
          proposal_id: string | null
          quorum_pct: number | null
          retention_until: string | null
          signatures: Json
        }
        Insert: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          assembly_id?: string | null
          assembly_type?: string | null
          attendee_count?: number | null
          community_id: string
          content: string
          generated_at?: string
          id?: string
          integrity_hash?: string | null
          legal_type?: string | null
          proposal_id?: string | null
          quorum_pct?: number | null
          retention_until?: string | null
          signatures?: Json
        }
        Update: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          assembly_id?: string | null
          assembly_type?: string | null
          attendee_count?: number | null
          community_id?: string
          content?: string
          generated_at?: string
          id?: string
          integrity_hash?: string | null
          legal_type?: string | null
          proposal_id?: string | null
          quorum_pct?: number | null
          retention_until?: string | null
          signatures?: Json
        }
        Relationships: [
          {
            foreignKeyName: "minutes_assembly_id_fkey"
            columns: ["assembly_id"]
            isOneToOne: false
            referencedRelation: "assemblies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "minutes_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "minutes_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "decision_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "minutes_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      moroso_notices: {
        Row: {
          assembly_id: string | null
          community_id: string
          created_at: string
          deadline: string | null
          id: string
          issued_at: string
          member_id: string
          notice_type: string
          outstanding_amount: number
          outstanding_obligations: Json | null
          response_at: string | null
          status: string
        }
        Insert: {
          assembly_id?: string | null
          community_id: string
          created_at?: string
          deadline?: string | null
          id?: string
          issued_at?: string
          member_id: string
          notice_type?: string
          outstanding_amount?: number
          outstanding_obligations?: Json | null
          response_at?: string | null
          status?: string
        }
        Update: {
          assembly_id?: string | null
          community_id?: string
          created_at?: string
          deadline?: string | null
          id?: string
          issued_at?: string
          member_id?: string
          notice_type?: string
          outstanding_amount?: number
          outstanding_obligations?: Json | null
          response_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "moroso_notices_assembly_id_fkey"
            columns: ["assembly_id"]
            isOneToOne: false
            referencedRelation: "assemblies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moroso_notices_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moroso_notices_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moroso_notices_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          community_id: string
          created_at: string | null
          delivered_at: string | null
          delivery_channel: string | null
          delivery_status: string | null
          id: string
          member_id: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          community_id: string
          created_at?: string | null
          delivered_at?: string | null
          delivery_channel?: string | null
          delivery_status?: string | null
          id?: string
          member_id: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
        }
        Update: {
          body?: string | null
          community_id?: string
          created_at?: string | null
          delivered_at?: string | null
          delivery_channel?: string | null
          delivery_status?: string | null
          id?: string
          member_id?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_obligations: {
        Row: {
          amount: number
          community_id: string
          concept: string
          created_at: string
          due_date: string
          fund_type: string
          id: string
          member_id: string
          obligation_type: string
          payment_transaction_id: string | null
          status: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          community_id: string
          concept: string
          created_at?: string
          due_date: string
          fund_type?: string
          id?: string
          member_id: string
          obligation_type?: string
          payment_transaction_id?: string | null
          status?: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          community_id?: string
          concept?: string
          created_at?: string
          due_date?: string
          fund_type?: string
          id?: string
          member_id?: string
          obligation_type?: string
          payment_transaction_id?: string | null
          status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obligations_transaction_fk"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_obligations_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_obligations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_obligations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_obligations_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_plan_installments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          installment_number: number
          paid_amount: number | null
          paid_at: string | null
          payment_obligation_id: string | null
          plan_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          paid_amount?: number | null
          paid_at?: string | null
          payment_obligation_id?: string | null
          plan_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          paid_amount?: number | null
          paid_at?: string | null
          payment_obligation_id?: string | null
          plan_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_plan_installments_payment_obligation_id_fkey"
            columns: ["payment_obligation_id"]
            isOneToOne: false
            referencedRelation: "payment_obligations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plan_installments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_plans: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          cancelled_at: string | null
          cancelled_reason: string | null
          community_id: string
          created_at: string
          frequency: string
          id: string
          installment_amount: number
          member_id: string
          notes: string | null
          number_of_installments: number
          proposed_by: string | null
          start_date: string
          status: string
          total_debt: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          community_id: string
          created_at?: string
          frequency?: string
          id?: string
          installment_amount: number
          member_id: string
          notes?: string | null
          number_of_installments: number
          proposed_by?: string | null
          start_date: string
          status?: string
          total_debt: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          community_id?: string
          created_at?: string
          frequency?: string
          id?: string
          installment_amount?: number
          member_id?: string
          notes?: string | null
          number_of_installments?: number
          proposed_by?: string | null
          start_date?: string
          status?: string
          total_debt?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_plans_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_consents: {
        Row: {
          consent_type: string
          created_at: string | null
          granted: boolean
          granted_at: string | null
          id: string
          ip_address: string | null
          revoked_at: string | null
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          consent_type: string
          created_at?: string | null
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          user_agent?: string | null
          user_id: string
          version: string
        }
        Update: {
          consent_type?: string
          created_at?: string | null
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          appealed: boolean | null
          assembly_id: string | null
          closed_at: string | null
          closed_by: string | null
          community_id: string
          cool_down_until: string | null
          created_at: string
          created_by: string
          description: string
          discussion_end: string | null
          discussion_min_hours: number | null
          discussion_start: string | null
          executed_at: string | null
          execution_status: string | null
          financial_instruction: Json | null
          grace_period_end: string | null
          id: string
          majority_required: number
          outcome_declared: string | null
          outcome_declared_at: string | null
          outcome_declared_by: string | null
          quorum_required: number
          result: string | null
          status: string
          template_id: string | null
          title: string
          type: string
          voting_end: string | null
          voting_model: string
          voting_options: Json | null
          voting_start: string | null
        }
        Insert: {
          appealed?: boolean | null
          assembly_id?: string | null
          closed_at?: string | null
          closed_by?: string | null
          community_id: string
          cool_down_until?: string | null
          created_at?: string
          created_by: string
          description?: string
          discussion_end?: string | null
          discussion_min_hours?: number | null
          discussion_start?: string | null
          executed_at?: string | null
          execution_status?: string | null
          financial_instruction?: Json | null
          grace_period_end?: string | null
          id?: string
          majority_required?: number
          outcome_declared?: string | null
          outcome_declared_at?: string | null
          outcome_declared_by?: string | null
          quorum_required?: number
          result?: string | null
          status?: string
          template_id?: string | null
          title: string
          type?: string
          voting_end?: string | null
          voting_model?: string
          voting_options?: Json | null
          voting_start?: string | null
        }
        Update: {
          appealed?: boolean | null
          assembly_id?: string | null
          closed_at?: string | null
          closed_by?: string | null
          community_id?: string
          cool_down_until?: string | null
          created_at?: string
          created_by?: string
          description?: string
          discussion_end?: string | null
          discussion_min_hours?: number | null
          discussion_start?: string | null
          executed_at?: string | null
          execution_status?: string | null
          financial_instruction?: Json | null
          grace_period_end?: string | null
          id?: string
          majority_required?: number
          outcome_declared?: string | null
          outcome_declared_at?: string | null
          outcome_declared_by?: string | null
          quorum_required?: number
          result?: string | null
          status?: string
          template_id?: string | null
          title?: string
          type?: string
          voting_end?: string | null
          voting_model?: string
          voting_options?: Json | null
          voting_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_assembly_id_fkey"
            columns: ["assembly_id"]
            isOneToOne: false
            referencedRelation: "assemblies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_endorsements: {
        Row: {
          id: string
          proposal_id: string
          member_id: string
          community_id: string
          endorsed_at: string
        }
        Insert: {
          id?: string
          proposal_id: string
          member_id: string
          community_id: string
          endorsed_at?: string
        }
        Update: {
          id?: string
          proposal_id?: string
          member_id?: string
          community_id?: string
          endorsed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_endorsements_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_endorsements_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "decision_archive"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          keys: Json
          member_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          keys?: Json
          member_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          keys?: Json
          member_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          comment: string | null
          community_id: string
          contract_id: string | null
          created_at: string | null
          dimensions: Json | null
          id: string
          overall_score: number
          rated_by: string
          target_id: string
          target_type: string
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          community_id: string
          contract_id?: string | null
          created_at?: string | null
          dimensions?: Json | null
          id?: string
          overall_score: number
          rated_by: string
          target_id: string
          target_type: string
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          community_id?: string
          contract_id?: string | null
          created_at?: string | null
          dimensions?: Json | null
          id?: string
          overall_score?: number
          rated_by?: string
          target_id?: string
          target_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ratings_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rated_by_fkey"
            columns: ["rated_by"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rated_by_fkey"
            columns: ["rated_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_schedules: {
        Row: {
          amount: number
          auto_generate: boolean | null
          category_id: string | null
          community_id: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          custom_interval_days: number | null
          day_of_month: number | null
          description: string | null
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean | null
          last_run_date: string | null
          name: string
          next_run_date: string
          runs_completed: number | null
          start_date: string
          target_entity_id: string | null
          target_member_ids: Json | null
          target_type: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          auto_generate?: boolean | null
          category_id?: string | null
          community_id: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          custom_interval_days?: number | null
          day_of_month?: number | null
          description?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_run_date?: string | null
          name: string
          next_run_date: string
          runs_completed?: number | null
          start_date: string
          target_entity_id?: string | null
          target_member_ids?: Json | null
          target_type?: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          auto_generate?: boolean | null
          category_id?: string | null
          community_id?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          custom_interval_days?: number | null
          day_of_month?: number | null
          description?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_run_date?: string | null
          name?: string
          next_run_date?: string
          runs_completed?: number | null
          start_date?: string
          target_entity_id?: string | null
          target_member_ids?: Json | null
          target_type?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_schedules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_schedules_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_schedules_target_entity_id_fkey"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          community_id: string
          created_at: string
          id: string
          name: string
          permissions: Json
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          name: string
          permissions?: Json
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          name?: string
          permissions?: Json
        }
        Relationships: [
          {
            foreignKeyName: "roles_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      rule_versions: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          community_id: string
          created_at: string
          id: string
          proposal_id: string | null
          rules: Json
          version_number: number
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          community_id: string
          created_at?: string
          id?: string
          proposal_id?: string | null
          rules: Json
          version_number: number
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          community_id?: string
          created_at?: string
          id?: string
          proposal_id?: string | null
          rules?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "rule_versions_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rule_versions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "decision_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rule_versions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          community_id: string
          created_at: string
          created_by: string | null
          date: string
          description: string
          evidence_url: string | null
          external_ref: string | null
          fund_type: string
          id: string
          import_job_id: string | null
          origin: string
          source_id: string | null
          type: string
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          community_id: string
          created_at?: string
          created_by?: string | null
          date: string
          description?: string
          evidence_url?: string | null
          external_ref?: string | null
          fund_type?: string
          id?: string
          import_job_id?: string | null
          origin?: string
          source_id?: string | null
          type: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          community_id?: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string
          evidence_url?: string | null
          external_ref?: string | null
          fund_type?: string
          id?: string
          import_job_id?: string | null
          origin?: string
          source_id?: string | null
          type?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_import_job_id_fkey"
            columns: ["import_job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_source_fk"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          area_m2: number | null
          community_id: string
          floor: number | null
          id: string
          indiviso_pct: number | null
          member_id: string | null
          tower: string | null
          unit_number: string
        }
        Insert: {
          area_m2?: number | null
          community_id: string
          floor?: number | null
          id?: string
          indiviso_pct?: number | null
          member_id?: string | null
          tower?: string | null
          unit_number: string
        }
        Update: {
          area_m2?: number | null
          community_id?: string
          floor?: number | null
          id?: string
          indiviso_pct?: number | null
          member_id?: string | null
          tower?: string | null
          unit_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      vigilancia_reports: {
        Row: {
          author_id: string
          community_id: string
          content: string
          created_at: string | null
          findings: Json | null
          id: string
          period: string
          recommendations: Json | null
          report_type: string
          reviewed_at: string | null
          status: string
          submitted_at: string | null
          title: string
        }
        Insert: {
          author_id: string
          community_id: string
          content: string
          created_at?: string | null
          findings?: Json | null
          id?: string
          period: string
          recommendations?: Json | null
          report_type?: string
          reviewed_at?: string | null
          status?: string
          submitted_at?: string | null
          title: string
        }
        Update: {
          author_id?: string
          community_id?: string
          content?: string
          created_at?: string | null
          findings?: Json | null
          id?: string
          period?: string
          recommendations?: Json | null
          report_type?: string
          reviewed_at?: string | null
          status?: string
          submitted_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "vigilancia_reports_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          block_reason: string | null
          cast_at: string
          delegated_from: string | null
          id: string
          is_override: boolean | null
          member_id: string
          proposal_id: string
          value: string
          weight: number
        }
        Insert: {
          block_reason?: string | null
          cast_at?: string
          delegated_from?: string | null
          id?: string
          is_override?: boolean | null
          member_id: string
          proposal_id: string
          value: string
          weight?: number
        }
        Update: {
          block_reason?: string | null
          cast_at?: string
          delegated_from?: string | null
          id?: string
          is_override?: boolean | null
          member_id?: string
          proposal_id?: string
          value?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "votes_delegated_from_fkey"
            columns: ["delegated_from"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_delegated_from_fkey"
            columns: ["delegated_from"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "decision_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      comment_sentiment_summary: {
        Row: {
          con_count: number | null
          neutral_count: number | null
          pro_count: number | null
          proposal_id: string | null
          question_count: number | null
          total_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discussion_comments_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "decision_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_comments_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_archive: {
        Row: {
          avg_progress: number | null
          closed_at: string | null
          comment_count: number | null
          community_id: string | null
          created_at: string | null
          description: string | null
          executed_at: string | null
          id: string | null
          majority_required: number | null
          outcome_declared: string | null
          quorum_required: number | null
          result: string | null
          status: string | null
          task_count: number | null
          tasks_completed: number | null
          template_id: string | null
          title: string | null
          type: string | null
          vote_count: number | null
          voting_model: string | null
        }
        Insert: {
          avg_progress?: never
          closed_at?: string | null
          comment_count?: never
          community_id?: string | null
          created_at?: string | null
          description?: string | null
          executed_at?: string | null
          id?: string | null
          majority_required?: number | null
          outcome_declared?: string | null
          quorum_required?: number | null
          result?: string | null
          status?: string | null
          task_count?: never
          tasks_completed?: never
          template_id?: string | null
          title?: string | null
          type?: string | null
          vote_count?: never
          voting_model?: string | null
        }
        Update: {
          avg_progress?: never
          closed_at?: string | null
          comment_count?: never
          community_id?: string | null
          created_at?: string | null
          description?: string | null
          executed_at?: string | null
          id?: string | null
          majority_required?: number | null
          outcome_declared?: string | null
          quorum_required?: number | null
          result?: string | null
          status?: string | null
          task_count?: never
          tasks_completed?: never
          template_id?: string | null
          title?: string | null
          type?: string | null
          vote_count?: never
          voting_model?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_ratings_summary: {
        Row: {
          avg_communication: number | null
          avg_compliance: number | null
          avg_punctuality: number | null
          avg_quality: number | null
          avg_score: number | null
          avg_value: number | null
          community_id: string | null
          target_id: string | null
          target_type: string | null
          total_ratings: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ratings_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      member_profiles: {
        Row: {
          community_id: string | null
          created_at: string | null
          custom_attributes: Json | null
          email: string | null
          financial_standing: string | null
          full_name: string | null
          id: string | null
          joined_at: string | null
          role: string | null
          status: string | null
          user_id: string | null
          voting_weight: number | null
        }
        Relationships: [
          {
            foreignKeyName: "members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_invitation: {
        Args: { p_token: string; p_user_id: string }
        Returns: undefined
      }
      close_expired_proposal: {
        Args: { p_proposal_id: string }
        Returns: undefined
      }
      compute_financial_standing: {
        Args: { p_community_id: string; p_member_id: string }
        Returns: string
      }
      compute_moroso_status: {
        Args: { p_community_id: string }
        Returns: {
          extraordinary_unpaid: number
          member_id: string
          new_standing: string
          old_standing: string
          ordinary_unpaid: number
        }[]
      }
      compute_moroso_status_all: { Args: never; Returns: undefined }
      create_community_with_admin: {
        Args: {
          p_description?: string
          p_name: string
          p_slug: string
          p_type?: string
          p_user_id: string
        }
        Returns: Json
      }
      generate_monthly_statement: {
        Args: {
          p_community_id: string
          p_fund_type?: string
          p_generated_by?: string
          p_period: string
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
          extraordinary_unpaid: number
          is_moroso: boolean
          moroso_since: string
          ordinary_unpaid: number
          restrictions: Json
          total_debt: number
        }[]
      }
      get_next_rule_version: {
        Args: { p_community_id: string }
        Returns: number
      }
      get_platform_census: { Args: never; Returns: Json }
      get_user_community_ids: { Args: never; Returns: string[] }
      get_user_role: { Args: { p_community_id: string }; Returns: string }
      notify_community: {
        Args: {
          p_body?: string
          p_community_id: string
          p_metadata?: Json
          p_title: string
          p_type: string
        }
        Returns: number
      }
      notify_member: {
        Args: {
          p_body?: string
          p_community_id: string
          p_member_id: string
          p_metadata?: Json
          p_title: string
          p_type: string
        }
        Returns: string
      }
      notify_pending_executions: { Args: never; Returns: undefined }
      process_auto_executions: { Args: never; Returns: number }
      process_expired_proposals: { Args: never; Returns: number }
      process_recurring_schedules: {
        Args: { p_community_id: string }
        Returns: number
      }
      refresh_financial_standings: {
        Args: { p_community_id: string }
        Returns: undefined
      }
      search_decisions: {
        Args: { p_community_id: string; p_query: string }
        Returns: {
          closed_at: string
          created_at: string
          description: string
          id: string
          rank: number
          result: string
          status: string
          title: string
          type: string
        }[]
      }
      take_census_snapshot: {
        Args: { p_community_id: string }
        Returns: {
          active_members: number
          active_proposals: number
          community_id: string
          created_at: string
          id: string
          members_delinquent: number
          members_good_standing: number
          metadata: Json
          snapshot_date: string
          total_expenses: number
          total_income: number
          total_members: number
        }
        SetofOptions: {
          from: "*"
          to: "census_snapshots"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_contract_compliance: {
        Args: { p_contract_id: string }
        Returns: number
      }
      validate_proxy_limits: {
        Args: {
          p_assembly_id: string
          p_community_id: string
          p_representative_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
