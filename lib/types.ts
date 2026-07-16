export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Profile = {
  id: string;
  display_name: string;
  email: string | null;
  pin_hash: string;
  is_admin: boolean;
  rating: number;
  wins: number;
  losses: number;
  games_played: number;
  points_for: number;
  points_against: number;
  created_at: string;
  updated_at: string;
};

export type InviteStatus = "pending" | "accepted" | "declined" | "canceled" | "expired";
export type MatchStatus = "final" | "voided" | "corrected";

export type GameInvite = {
  id: string;
  challenger_id: string;
  opponent_id: string;
  status: InviteStatus;
  message: string | null;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
};

export type Match = {
  id: string;
  player_one_id: string;
  player_two_id: string;
  player_one_score: number;
  player_two_score: number;
  winner_id: string;
  first_server_id: string | null;
  invite_id: string | null;
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
        Insert: Partial<Profile> & Pick<Profile, "id" | "display_name" | "pin_hash">;
        Update: Partial<Profile>;
      };
      game_invites: {
        Row: GameInvite;
        Insert: Partial<GameInvite> & Pick<GameInvite, "challenger_id" | "opponent_id">;
        Update: Partial<GameInvite>;
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
