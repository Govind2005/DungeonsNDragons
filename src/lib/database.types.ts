export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          level: number;
          xp: number;
          total_wins: number;
          total_losses: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          level?: number;
          xp?: number;
          total_wins?: number;
          total_losses?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          level?: number;
          xp?: number;
          total_wins?: number;
          total_losses?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          lobby_code: string;
          status: string;
          current_turn: number;
          team_blue_player1_id: string | null;
          team_blue_player2_id: string | null;
          team_red_player1_id: string | null;
          team_red_player2_id: string | null;
          winner_team: string | null;
          created_at: string;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          lobby_code: string;
          status?: string;
          current_turn?: number;
          team_blue_player1_id?: string | null;
          team_blue_player2_id?: string | null;
          team_red_player1_id?: string | null;
          team_red_player2_id?: string | null;
          winner_team?: string | null;
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          lobby_code?: string;
          status?: string;
          current_turn?: number;
          team_blue_player1_id?: string | null;
          team_blue_player2_id?: string | null;
          team_red_player1_id?: string | null;
          team_red_player2_id?: string | null;
          winner_team?: string | null;
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
        };
      };
      match_players: {
        Row: {
          id: string;
          match_id: string;
          user_id: string;
          team: string;
          character_class: string;
          current_hp: number;
          max_hp: number;
          current_mana: number;
          max_mana: number;
          attack_power_buff: number;
          is_ready: boolean;
          is_invisible: boolean;
          is_bound: boolean;
          is_weakened: boolean;
          position: number;
        };
        Insert: {
          id?: string;
          match_id: string;
          user_id: string;
          team: string;
          character_class: string;
          current_hp: number;
          max_hp: number;
          current_mana: number;
          max_mana: number;
          attack_power_buff?: number;
          is_ready?: boolean;
          is_invisible?: boolean;
          is_bound?: boolean;
          is_weakened?: boolean;
          position: number;
        };
        Update: {
          id?: string;
          match_id?: string;
          user_id?: string;
          team?: string;
          character_class?: string;
          current_hp?: number;
          max_hp?: number;
          current_mana?: number;
          max_mana?: number;
          attack_power_buff?: number;
          is_ready?: boolean;
          is_invisible?: boolean;
          is_bound?: boolean;
          is_weakened?: boolean;
          position?: number;
        };
      };
      match_actions: {
        Row: {
          id: string;
          match_id: string;
          turn_number: number;
          player_id: string;
          action_type: string;
          ability_name: string;
          target_ids: string[];
          damage_dealt: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          turn_number: number;
          player_id: string;
          action_type: string;
          ability_name: string;
          target_ids: string[];
          damage_dealt?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          turn_number?: number;
          player_id?: string;
          action_type?: string;
          ability_name?: string;
          target_ids?: string[];
          damage_dealt?: number;
          created_at?: string;
        };
      };
    };
  };
};
