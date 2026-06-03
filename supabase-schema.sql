-- Schema Meta AI

-- Table des profils (synchronisée avec auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger : créer automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Table des clés API (chiffrées)
CREATE TABLE public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Table des conversations
CREATE TABLE public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  title TEXT DEFAULT 'Nouvelle conversation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des messages
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  ai_responses JSONB,
  selected_ais TEXT[],
  arbitrator_ai TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table d'utilisation quotidienne (limite 5 questions/jour)
CREATE TABLE public.daily_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  count INTEGER DEFAULT 0 NOT NULL,
  UNIQUE(identifier, date)
);

-- ==============================
-- ROW LEVEL SECURITY (RLS)
-- ==============================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

-- Profils
CREATE POLICY "Lecture profil personnel" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Mise à jour profil personnel" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Clés API
CREATE POLICY "Gestion clés API personnelles" ON public.api_keys
  FOR ALL USING (auth.uid() = user_id);

-- Conversations
CREATE POLICY "Gestion conversations personnelles" ON public.conversations
  FOR ALL USING (auth.uid() = user_id);

-- Messages
CREATE POLICY "Lecture messages personnels" ON public.messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Insertion messages personnels" ON public.messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

-- daily_usage : accessible uniquement via service_role (API serveur)
-- Pas de policy utilisateur direct
