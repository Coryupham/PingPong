export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Profile = {
  id: string;
  display_name: string;
  email: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type Player = {
  id: string;
  display_name: string;
  email: string;
  pin_hash: string;
  rating: number;
  wins: number;
  losses: number;
  games_played: number;
  points_for: number;
  points_against: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MatchStatus = "final" | "voided" | "corrected";

export type Match = {
  id: string;
  player_one_id: string;
  player_one_name: string | null;
  player_one_email: string | null;
  player_two_id: string;
  player_two_name: string | null;
  player_two_email: string | null;
  player_one_score: number;
  player_two_score: number;
  winner_id: string;
  winner_name: string | null;
  winner_email: string | null;
  first_server_id: string | null;
  first_server_name: string | null;
  first_server_email: string | null;
  status: MatchStatus;
  submitted_by: string;
  confirmed_by: string;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, "id" | "display_name">;
        Update: Partial<Profile>;
      };
      players: {
        Row: Player;
        Insert: Partial<Player> & Pick<Player, "display_name" | "email" | "pin_hash">;
        Update: Partial<Player>;
      };
      matches: {
        Row: Match;
        Insert: Partial<Match> &
          Pick<
            Match,
            "player_one_id" | "player_two_id" | "player_one_score" | "player_two_score" | "winner_id" | "submitted_by" | "confirmed_by"
          >;
        Update: Partial<Match>;
      };
      rating_events: {
        Row: {
          id: string;
          match_id: string;
          player_id: string;
          rating_before: number;
          rating_after: number;
          rating_delta: number;
          created_at: string;
        };
        Insert: {
          match_id: string;
          player_id: string;
          rating_before: number;
          rating_after: number;
          rating_delta: number;
        };
        Update: never;
      };
      admin_audit_log: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          target_table: string;
          target_id: string | null;
          before_data: Json | null;
          after_data: Json | null;
          created_at: string;
        };
        Insert: {
          admin_id: string;
          action: string;
          target_table: string;
          target_id?: string | null;
          before_data?: Json | null;
          after_data?: Json | null;
        };
        Update: never;
      };
    };
  };
};
