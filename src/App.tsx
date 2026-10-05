import React, { useState, useEffect, useMemo } from 'react';
import { Trip } from './types';
import { StorageService, IStorageService } from './services/StorageService';
import { SupabaseStorageService } from './services/SupabaseStorageService';
import { MigrationService, MigrationStatus } from './services/MigrationService';
import { useAuth } from './contexts/AuthContext';
import { Navbar } from './components/common/Navbar';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { MoreMenuModal } from './components/common/MoreMenuModal';
import { MigrationBanner } from './components/common/MigrationBanner';
import { AuthModal } from './components/auth/AuthModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { ItineraryView } from './components/itinerary/ItineraryView';
import { MapView } from './components/map/MapView';
import { BudgetView } from './components/budget/BudgetView';
import { TravelModeView } from './components/travelmode/TravelModeView';
import { ChecklistView } from './components/checklist/ChecklistView';
import { MemoriesView } from './components/memories/MemoriesView';
import { TripsListView } from './components/trips/TripsListView';
import { ProfileView } from './components/profile/ProfileView';
import { TravelWizardModal } from './components/wizard/TravelWizardModal';
import { AIChatDrawer } from './components/ai/AIChatDrawer';

export default function App() {
  const { user, isConfigured } = useAuth();

  // Active Storage provider: Supabase when authenticated, LocalStorage for demo/offline
  const activeStorage: IStorageService = useMemo(() => {
    if (user && isConfigured) {
      return new SupabaseStorageService();
    }
    return StorageService;
  }, [user, isConfigured]);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Migration status
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>({
    hasLocalData: false,
    localTripCount: 0,
    isMigrated: true,
  });

  // Dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('itinera_dark_mode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('itinera_dark_mode', 'true');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('itinera_dark_mode', 'false');
      }
    } catch {}
  }, [darkMode]);

  // Load trips whenever active storage or user changes
  const loadTrips = async () => {
    setLoading(true);
    try {
      const loadedTrips = await activeStorage.getTrips();
      setTrips(loadedTrips);
      const activeId = await activeStorage.getActiveTripId();
      if (activeId && loadedTrips.some((t) => t.id === activeId)) {
        setActiveTripId(activeId);
      } else if (loadedTrips.length > 0) {
        setActiveTripId(loadedTrips[0].id);
      }
    } catch (e) {
      console.error('Failed to load trips', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, [activeStorage]);

  // Check migration status when user logs in
  useEffect(() => {
    if (user && isConfigured) {
      MigrationService.checkMigrationStatus().then(setMigrationStatus);
    }
  }, [user, isConfigured]);

  const activeTrip: Trip | null =
    trips.find((t) => t.id === activeTripId) || (trips.length > 0 ? trips[0] : null);

  // Update Trip handler
  const handleUpdateTrip = async (updated: Trip) => {
    await activeStorage.saveTrip(updated);
    setTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  // Trip Created via Wizard
  const handleTripCreated = async (newTrip: Trip) => {
    await activeStorage.saveTrip(newTrip);
    await activeStorage.setActiveTripId(newTrip.id);
    setTrips((prev) => [newTrip, ...prev]);
    setActiveTripId(newTrip.id);
    setCurrentView('itinerary');
  };

  // Select Active Trip
  const handleSelectTrip = async (tripId: string) => {
    await activeStorage.setActiveTripId(tripId);
    setActiveTripId(tripId);
    setCurrentView('itinerary');
  };

  // Duplicate Trip
  const handleDuplicateTrip = async (tripId: string) => {
    const dup = await activeStorage.duplicateTrip(tripId);
    if (dup) {
      setTrips((prev) => [dup, ...prev]);
      setActiveTripId(dup.id);
      setCurrentView('itinerary');
    }
  };

  // Delete Trip
  const handleDeleteTrip = async (tripId: string) => {
    const success = await activeStorage.deleteTrip(tripId);
    if (success) {
      const remaining = trips.filter((t) => t.id !== tripId);
      setTrips(remaining);
      if (activeTripId === tripId && remaining.length > 0) {
        setActiveTripId(remaining[0].id);
      }
    }
  };

  // Reset to Demo
  const handleResetDemo = async () => {
    const demo = await activeStorage.resetToDemo();
    setTrips(demo);
    if (demo.length > 0) {
      setActiveTripId(demo[0].id);
    }
    setCurrentView('dashboard');
  };

  // Callback after migration complete
  const handleMigrationComplete = async () => {
    await loadTrips();
    setMigrationStatus((prev) => ({ ...prev, isMigrated: true }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf8] dark:bg-[#0c1211] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center mx-auto animate-pulse">
            <span className="font-serif font-bold text-lg">IT</span>
          </div>
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-widest block">
            Cargando Itinera...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8] dark:bg-[#0c1211] text-[#1c2221] dark:text-[#ecf3f1] flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        activeTrip={activeTrip}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenAIChat={() => setIsAIChatOpen(true)}
        onOpenWizard={() => setIsWizardOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Migration Banner if user logged in and local data not yet migrated */}
        {user && migrationStatus.hasLocalData && !migrationStatus.isMigrated && (
          <MigrationBanner
            localTripCount={migrationStatus.localTripCount}
            onMigrationComplete={handleMigrationComplete}
          />
        )}

        {currentView === 'dashboard' && (
          <DashboardView
            activeTrip={activeTrip}
            trips={trips}
            onOpenTrip={handleSelectTrip}
            onOpenWizard={() => setIsWizardOpen(true)}
            onOpenTravelMode={() => setCurrentView('travel-mode')}
            onOpenAI={() => setIsAIChatOpen(true)}
          />
        )}

        {currentView === 'itinerary' && activeTrip && (
          <ItineraryView
            trip={activeTrip}
            onUpdateTrip={handleUpdateTrip}
            onOpenMap={() => setCurrentView('map')}
            onOpenAI={() => setIsAIChatOpen(true)}
            onOpenTravelMode={() => setCurrentView('travel-mode')}
          />
        )}

        {currentView === 'map' && activeTrip && (
          <MapView
            trip={activeTrip}
            onSelectActivity={() => setCurrentView('itinerary')}
          />
        )}

        {currentView === 'budget' && activeTrip && (
          <BudgetView
            trip={activeTrip}
            onUpdateTrip={handleUpdateTrip}
          />
        )}

        {currentView === 'travel-mode' && activeTrip && (
          <TravelModeView
            trip={activeTrip}
            onExitTravelMode={() => setCurrentView('itinerary')}
            onUpdateTrip={handleUpdateTrip}
            onOpenMap={() => setCurrentView('map')}
          />
        )}

        {currentView === 'checklist' && activeTrip && (
          <ChecklistView
            trip={activeTrip}
            onUpdateTrip={handleUpdateTrip}
          />
        )}

        {currentView === 'memories' && activeTrip && (
          <MemoriesView
            trip={activeTrip}
            onUpdateTrip={handleUpdateTrip}
          />
        )}

        {currentView === 'trips' && (
          <TripsListView
            trips={trips}
            activeTripId={activeTripId}
            onSelectTrip={handleSelectTrip}
            onDuplicateTrip={handleDuplicateTrip}
            onDeleteTrip={handleDeleteTrip}
            onOpenWizard={() => setIsWizardOpen(true)}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
            onResetDemo={handleResetDemo}
          />
        )}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenMoreMenu={() => setIsMoreMenuOpen(true)}
      />

      {/* Mobile "Más" Modal */}
      <MoreMenuModal
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        onNavigate={(view) => setCurrentView(view)}
        onOpenAI={() => setIsAIChatOpen(true)}
        onOpenWizard={() => setIsWizardOpen(true)}
      />

      {/* 7-Step Travel Wizard */}
      <TravelWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onTripCreated={handleTripCreated}
      />

      {/* AI Assistant Drawer */}
      {activeTrip && (
        <AIChatDrawer
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
          trip={activeTrip}
          onUpdateTrip={handleUpdateTrip}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={() => loadTrips()}
      />
    </div>
  );
}
