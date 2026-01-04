-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL, -- E.164 format (+1XXXXXXXXXX)
  first_name VARCHAR(100) NOT NULL,
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create nominations table
CREATE TABLE nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nominator_id UUID NOT NULL REFERENCES users(id),
  person_a_phone VARCHAR(20) NOT NULL,
  person_a_name VARCHAR(100) NOT NULL,
  person_b_phone VARCHAR(20) NOT NULL,
  person_b_name VARCHAR(100) NOT NULL,
  rationale TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, unlocked, expired, completed
  pair_key VARCHAR(50) NOT NULL, -- normalized: min(phoneA,phoneB)||'-'||max(phoneA,phoneB)
  share_token VARCHAR(100) UNIQUE NOT NULL, -- for sharing endorsement links
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unlocked_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '48 hours'),
  outcome VARCHAR(20), -- talked, dated, nothing
  outcome_submitted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT no_self_nomination CHECK (person_a_phone != person_b_phone)
);

-- Create endorsements table
CREATE TABLE endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomination_id UUID NOT NULL REFERENCES nominations(id) ON DELETE CASCADE,
  endorser_phone VARCHAR(20) NOT NULL,
  is_positive BOOLEAN NOT NULL, -- true = 👍, false = 👎
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(nomination_id, endorser_phone) -- one endorsement per phone per nomination
);

-- Create messages table (for unlocked chat)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomination_id UUID NOT NULL REFERENCES nominations(id) ON DELETE CASCADE,
  sender_phone VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_nominations_nominator ON nominations(nominator_id);
CREATE INDEX idx_nominations_pair_key ON nominations(pair_key);
CREATE INDEX idx_nominations_share_token ON nominations(share_token);
CREATE INDEX idx_nominations_status ON nominations(status);
CREATE INDEX idx_endorsements_nomination ON endorsements(nomination_id);
CREATE INDEX idx_endorsements_phone ON endorsements(endorser_phone);
CREATE INDEX idx_messages_nomination ON messages(nomination_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Function to generate unique share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 12-character alphanumeric token
    token := encode(gen_random_bytes(9), 'base64');
    token := replace(replace(replace(token, '+', ''), '/', ''), '=', '');
    token := substring(token, 1, 12);

    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM nominations WHERE share_token = token) INTO exists;

    EXIT WHEN NOT exists;
  END LOOP;

  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Function to normalize pair key
CREATE OR REPLACE FUNCTION normalize_pair_key(phone_a TEXT, phone_b TEXT)
RETURNS TEXT AS $$
BEGIN
  IF phone_a < phone_b THEN
    RETURN phone_a || '-' || phone_b;
  ELSE
    RETURN phone_b || '-' || phone_a;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check endorsement threshold
CREATE OR REPLACE FUNCTION check_endorsement_threshold(nom_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  positive_count INT;
  negative_count INT;
  total_count INT;
  negative_ratio DECIMAL;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE is_positive = true),
    COUNT(*) FILTER (WHERE is_positive = false),
    COUNT(*)
  INTO positive_count, negative_count, total_count
  FROM endorsements
  WHERE nomination_id = nom_id;

  -- Need at least 3 positive endorsements
  IF positive_count < 3 THEN
    RETURN FALSE;
  END IF;

  -- Calculate negative ratio (avoid division by zero)
  IF total_count = 0 THEN
    RETURN FALSE;
  END IF;

  negative_ratio := negative_count::DECIMAL / total_count::DECIMAL;

  -- Negative share must be less than 25%
  RETURN negative_ratio < 0.25;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive for MVP, can be tightened later)
-- Users: anyone can read, users can update their own record
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert themselves" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update themselves" ON users FOR UPDATE USING (true);

-- Nominations: viewable by everyone (for endorsements), insertable by authenticated users
CREATE POLICY "Nominations are viewable by everyone" ON nominations FOR SELECT USING (true);
CREATE POLICY "Users can create nominations" ON nominations FOR INSERT WITH CHECK (true);
CREATE POLICY "Nominators can update their nominations" ON nominations FOR UPDATE USING (true);

-- Endorsements: viewable by everyone, insertable once per phone
CREATE POLICY "Endorsements are viewable by everyone" ON endorsements FOR SELECT USING (true);
CREATE POLICY "Anyone can create endorsements" ON endorsements FOR INSERT WITH CHECK (true);

-- Messages: viewable by participants, insertable by participants
CREATE POLICY "Messages viewable by everyone" ON messages FOR SELECT USING (true);
CREATE POLICY "Anyone can send messages" ON messages FOR INSERT WITH CHECK (true);

-- Trigger to auto-unlock nomination when threshold is met
CREATE OR REPLACE FUNCTION auto_unlock_nomination()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if nomination meets threshold and isn't already unlocked
  IF (SELECT status FROM nominations WHERE id = NEW.nomination_id) = 'pending' THEN
    IF check_endorsement_threshold(NEW.nomination_id) THEN
      UPDATE nominations
      SET status = 'unlocked', unlocked_at = NOW()
      WHERE id = NEW.nomination_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_unlock
AFTER INSERT ON endorsements
FOR EACH ROW
EXECUTE FUNCTION auto_unlock_nomination();

-- Comments for documentation
COMMENT ON TABLE users IS 'Registered users with verified phone numbers';
COMMENT ON TABLE nominations IS 'Blind date nominations with rationale';
COMMENT ON TABLE endorsements IS 'Binary endorsements (👍/👎) for nominations';
COMMENT ON TABLE messages IS 'Chat messages between matched pairs after unlock';
COMMENT ON COLUMN nominations.pair_key IS 'Normalized key to prevent duplicate pair nominations';
COMMENT ON COLUMN nominations.share_token IS 'Unique token for shareable endorsement link';
COMMENT ON COLUMN nominations.status IS 'pending = gathering endorsements, unlocked = threshold met, expired = timed out, completed = outcome submitted';
