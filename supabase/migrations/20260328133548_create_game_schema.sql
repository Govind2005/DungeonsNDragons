/*
  # Dungeons & Dragons Game Schema

  ## Tables Created
  
  1. **profiles**
    - `id` (uuid, references auth.users)
    - `username` (text, unique)
    - `level` (integer, default 1)
    - `xp` (integer, default 0)
    - `total_wins` (integer, default 0)
    - `total_losses` (integer, default 0)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  2. **matches**
    - `id` (uuid, primary key)
    - `lobby_code` (text, unique)
    - `status` (text: waiting, ready, in_progress, completed)
    - `current_turn` (integer, tracks turn order 0-3)
    - `team_blue_player1_id` (uuid)
    - `team_blue_player2_id` (uuid)
    - `team_red_player1_id` (uuid)
    - `team_red_player2_id` (uuid)
    - `winner_team` (text: blue, red, null)
    - `created_at` (timestamptz)
    - `started_at` (timestamptz)
    - `completed_at` (timestamptz)

  3. **match_players**
    - `id` (uuid, primary key)
    - `match_id` (uuid, references matches)
    - `user_id` (uuid, references profiles)
    - `team` (text: blue, red)
    - `character_class` (text: barbarian, knight, ranger, wizard)
    - `current_hp` (integer)
    - `max_hp` (integer)
    - `current_mana` (integer)
    - `max_mana` (integer)
    - `attack_power_buff` (integer, default 0)
    - `is_ready` (boolean, default false)
    - `is_invisible` (boolean, default false)
    - `is_bound` (boolean, default false)
    - `is_weakened` (boolean, default false)
    - `position` (integer, 0-3 for turn order)

  4. **match_actions**
    - `id` (uuid, primary key)
    - `match_id` (uuid, references matches)
    - `turn_number` (integer)
    - `player_id` (uuid, references profiles)
    - `action_type` (text: attack, defense)
    - `ability_name` (text)
    - `target_ids` (text array)
    - `damage_dealt` (integer)
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can read their own profile
  - Users can update their own profile
  - Users can view matches they're part of
  - Match actions are readable by match participants
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  level integer DEFAULT 1 NOT NULL,
  xp integer DEFAULT 0 NOT NULL,
  total_wins integer DEFAULT 0 NOT NULL,
  total_losses integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_code text UNIQUE NOT NULL,
  status text DEFAULT 'waiting' NOT NULL,
  current_turn integer DEFAULT 0 NOT NULL,
  team_blue_player1_id uuid REFERENCES profiles(id),
  team_blue_player2_id uuid REFERENCES profiles(id),
  team_red_player1_id uuid REFERENCES profiles(id),
  team_red_player2_id uuid REFERENCES profiles(id),
  winner_team text,
  created_at timestamptz DEFAULT now() NOT NULL,
  started_at timestamptz,
  completed_at timestamptz
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read matches they're in"
  ON matches FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (team_blue_player1_id, team_blue_player2_id, team_red_player1_id, team_red_player2_id)
  );

CREATE POLICY "Users can create matches"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update matches they're in"
  ON matches FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (team_blue_player1_id, team_blue_player2_id, team_red_player1_id, team_red_player2_id)
  )
  WITH CHECK (
    auth.uid() IN (team_blue_player1_id, team_blue_player2_id, team_red_player1_id, team_red_player2_id)
  );

-- Match players table
CREATE TABLE IF NOT EXISTS match_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  team text NOT NULL,
  character_class text NOT NULL,
  current_hp integer NOT NULL,
  max_hp integer NOT NULL,
  current_mana integer NOT NULL,
  max_mana integer NOT NULL,
  attack_power_buff integer DEFAULT 0 NOT NULL,
  is_ready boolean DEFAULT false NOT NULL,
  is_invisible boolean DEFAULT false NOT NULL,
  is_bound boolean DEFAULT false NOT NULL,
  is_weakened boolean DEFAULT false NOT NULL,
  position integer NOT NULL,
  UNIQUE(match_id, user_id)
);

ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read match players in their matches"
  ON match_players FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
      AND auth.uid() IN (m.team_blue_player1_id, m.team_blue_player2_id, m.team_red_player1_id, m.team_red_player2_id)
    )
  );

CREATE POLICY "Users can insert match players"
  ON match_players FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their match player data"
  ON match_players FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Match actions table
CREATE TABLE IF NOT EXISTS match_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  turn_number integer NOT NULL,
  player_id uuid REFERENCES profiles(id) NOT NULL,
  action_type text NOT NULL,
  ability_name text NOT NULL,
  target_ids text[] NOT NULL,
  damage_dealt integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE match_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read actions in their matches"
  ON match_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
      AND auth.uid() IN (m.team_blue_player1_id, m.team_blue_player2_id, m.team_red_player1_id, m.team_red_player2_id)
    )
  );

CREATE POLICY "Users can insert actions in their matches"
  ON match_actions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = player_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_lobby_code ON matches(lobby_code);
CREATE INDEX IF NOT EXISTS idx_match_players_match_id ON match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_match_actions_match_id ON match_actions(match_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);