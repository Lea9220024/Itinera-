-- ====================================================================
-- ITINERA TRAVEL PLANNER - SUPABASE INITIAL SCHEMA MIGRATION
-- Migration: 20261004000001_initial_schema.sql
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. PROFILES TABLE (Linked directly to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. USER_PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  travel_style JSONB DEFAULT '{"gastronomy":8,"nature":7,"history":9,"relax":6,"adventure":5,"culture":8}'::jsonb,
  budget_level TEXT DEFAULT 'medium',
  interests JSONB DEFAULT '["Historia", "Gastronomía", "Arte", "Arquitectura"]'::jsonb,
  preferred_currency TEXT NOT NULL DEFAULT '€',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TRIPS TABLE
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  travelers_count INT NOT NULL DEFAULT 2,
  budget_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  budget_currency TEXT NOT NULL DEFAULT '€',
  travel_style TEXT NOT NULL DEFAULT 'balanced',
  status TEXT NOT NULL DEFAULT 'planning', -- 'planning' | 'upcoming' | 'ongoing' | 'completed'
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TRIP_DAYS TABLE
CREATE TABLE IF NOT EXISTS public.trip_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_number INT NOT NULL,
  date DATE NOT NULL,
  city TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_trip_day_number UNIQUE (trip_id, day_number)
);

-- 7. ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_day_id UUID NOT NULL REFERENCES public.trip_days(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  location_name TEXT,
  address TEXT,
  latitude NUMERIC(10,6),
  longitude NUMERIC(10,6),
  estimated_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT '€',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'completed'
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT '€',
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. CHECKLIST_ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. PLACES TABLE
CREATE TABLE IF NOT EXISTS public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  external_id TEXT,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  address TEXT,
  latitude NUMERIC(10,6),
  longitude NUMERIC(10,6),
  rating NUMERIC(3,2),
  image_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. MEMORIES TABLE
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  date DATE NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. ATTACH UPDATED_AT TRIGGERS
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_user_preferences_modtime BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_trips_modtime BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_trip_days_modtime BEFORE UPDATE ON public.trip_days FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_activities_modtime BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_expenses_modtime BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_checklist_items_modtime BEFORE UPDATE ON public.checklist_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_places_modtime BEFORE UPDATE ON public.places FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_memories_modtime BEFORE UPDATE ON public.memories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 13. AUTOMATIC PROFILE CREATION TRIGGER ON AUTH.USERS SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: Users can ONLY access their own data via auth.uid()
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Profiles: Own profile access only
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- User Preferences: Own preferences only
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Trips: Own trips only
CREATE POLICY "Users can view own trips" ON public.trips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips" ON public.trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips" ON public.trips
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips" ON public.trips
  FOR DELETE USING (auth.uid() = user_id);

-- Trip Days: Cascaded ownership through trip.user_id = auth.uid()
CREATE POLICY "Users can view own trip days" ON public.trip_days
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_days.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own trip days" ON public.trip_days
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_days.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "Users can update own trip days" ON public.trip_days
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_days.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own trip days" ON public.trip_days
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_days.trip_id AND trips.user_id = auth.uid())
  );

-- Activities: Cascaded ownership through trip_days -> trips
CREATE POLICY "Users can view own activities" ON public.activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trip_days td
      JOIN public.trips t ON td.trip_id = t.id
      WHERE td.id = activities.trip_day_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own activities" ON public.activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_days td
      JOIN public.trips t ON td.trip_id = t.id
      WHERE td.id = activities.trip_day_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own activities" ON public.activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trip_days td
      JOIN public.trips t ON td.trip_id = t.id
      WHERE td.id = activities.trip_day_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own activities" ON public.activities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.trip_days td
      JOIN public.trips t ON td.trip_id = t.id
      WHERE td.id = activities.trip_day_id AND t.user_id = auth.uid()
    )
  );

-- Expenses: Cascaded ownership
CREATE POLICY "Users can view own expenses" ON public.expenses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = expenses.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own expenses" ON public.expenses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = expenses.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "Users can update own expenses" ON public.expenses
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = expenses.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own expenses" ON public.expenses
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = expenses.trip_id AND trips.user_id = auth.uid())
  );

-- Checklist Items: Cascaded ownership
CREATE POLICY "Users can view own checklist items" ON public.checklist_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = checklist_items.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own checklist items" ON public.checklist_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = checklist_items.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "Users can update own checklist items" ON public.checklist_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = checklist_items.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own checklist items" ON public.checklist_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = checklist_items.trip_id AND trips.user_id = auth.uid())
  );

-- Places: Cascaded ownership
CREATE POLICY "Users can view own places" ON public.places
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = places.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own places" ON public.places
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = places.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "Users can update own places" ON public.places
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = places.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own places" ON public.places
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = places.trip_id AND trips.user_id = auth.uid())
  );

-- Memories: Cascaded ownership
CREATE POLICY "Users can view own memories" ON public.memories
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = memories.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own memories" ON public.memories
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = memories.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "Users can update own memories" ON public.memories
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = memories.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own memories" ON public.memories
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = memories.trip_id AND trips.user_id = auth.uid())
  );
