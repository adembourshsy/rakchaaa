import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Gauge,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  LogOut,
  BarChart3,
  XCircle,
  RefreshCw,
  FolderPlus,
  Lock,
  Eye,
  EyeOff,
  Car as CarIcon,
  ArrowLeft,
  Volume2,
  Play,
  Music,
  Image as ImageIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CarData } from '../../types';
import { CAR_DATABASE } from '../../data/carData';
import {
  fetchMecanqueCarsFromFirestore,
  addMecanqueCar,
  updateMecanqueCar,
  deleteMecanqueCar,
} from '../../firebase/mecanqueCardsService';
import { playEngineRevSound } from '../../utils/engineSound';

export const MecanqueAdminView: React.FC = () => {
  const { isAdminLoggedIn, authReady, adminLogin, adminLogout, setActiveView, firebaseUser } = useApp();

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Car list & async state
  const [cars, setCars] = useState<CarData[]>(CAR_DATABASE);
  const [isLoadingCars, setIsLoadingCars] = useState(false);

  // Search & Filter state
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<CarData | null>(null);
  const [deletingCarId, setDeletingCarId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Form State
  const [formManufacturer, setFormManufacturer] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formCountry, setFormCountry] = useState('Germany');
  const [formFlag, setFormFlag] = useState('🇩🇪');
  const [formEngine, setFormEngine] = useState('');
  const [formCylinders, setFormCylinders] = useState('V8');
  const [formFuelType, setFormFuelType] = useState('Petrol');
  const [formYear, setFormYear] = useState('2023');
  const [formBodyType, setFormBodyType] = useState('Coupe');
  const [formPerformance, setFormPerformance] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<'beginner' | 'intermediate' | 'expert'>('beginner');
  const [formSoundProfile, setFormSoundProfile] = useState<CarData['soundProfile']>('v8_naturally_aspirated');
  const [formCustomAudioUrl, setFormCustomAudioUrl] = useState('');
  const [formCustomImageUrl, setFormCustomImageUrl] = useState('');
  const [formAcceptedAnswers, setFormAcceptedAnswers] = useState('');
  const [formClues, setFormClues] = useState(['', '', '', '', '']);
  const [testingAudioId, setTestingAudioId] = useState<string | null>(null);

  const handleTestSound = (soundProfile: string, customAudioUrl?: string, carId?: string) => {
    const id = carId || 'modal_test';
    setTestingAudioId(id);
    playEngineRevSound(soundProfile, customAudioUrl);
    setTimeout(() => setTestingAudioId(null), 2800);
  };

  // Load cars when logged in as mecanque admin
  const loadCars = async () => {
    setIsLoadingCars(true);
    try {
      const fetched = await fetchMecanqueCarsFromFirestore();
      setCars(fetched);
    } catch (err) {
      console.warn('Failed to load cars from firestore:', err);
    } finally {
      setIsLoadingCars(false);
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn) {
      loadCars();
    }
  }, [isAdminLoggedIn]);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      await adminLogin(email, password);
    } catch (err: any) {
      setLoginError(err?.message || 'Identifiants invalides ou compte non administrateur.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Guard check & Dedicated Login View
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0E0D0B] text-[#F8F7E8] flex flex-col items-center justify-center p-4 sm:p-6 select-none">
        <div className="w-full max-w-md bg-[#1B1B18] border border-[#FF8600]/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FF8600]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-3 mb-6 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-[#FF8600]/10 border border-[#FF8600]/30 flex items-center justify-center text-3xl shadow-inner text-[#FF8600]">
              <CarIcon size={32} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#FF8600] uppercase bg-[#FF8600]/10 px-3 py-1 rounded-full border border-[#FF8600]/30">
                OMOUR MECANQUE CMS
              </span>
              <h1 className="text-xl sm:text-2xl font-black mt-2 text-white">
                Portail Admin Omour Mecanque
              </h1>
              <p className="text-xs font-mono text-[#B8B5A5] mt-1">
                Connexion requise via Firebase
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 relative z-10">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
                {loginError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[#B8B5A5] uppercase font-semibold">
                Adresse Email Admin
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="medakacha@gmail.com"
                className="w-full px-4 py-3 rounded-xl bg-[#0E0D0B] border border-[#FF8600]/20 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-[#FF8600] transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[#B8B5A5] uppercase font-semibold">
                Mot de Passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-[#0E0D0B] border border-[#FF8600]/20 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-[#FF8600] transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl bg-[#FF8600] hover:bg-[#E87038] text-[#040403] font-mono font-bold text-sm tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Connexion Admin Omour Mecanque</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Return */}
          <div className="mt-6 pt-4 border-t border-[#FF8600]/10 text-center relative z-10">
            <button
              onClick={() => setActiveView('main')}
              className="text-xs font-mono text-[#B8B5A5] hover:text-white hover:underline transition"
            >
              ← Retour à l'application principale
            </button>
          </div>
        </div>
      </div>
    );
  }

  const openCreateModal = () => {
    setFormManufacturer('');
    setFormModel('');
    setFormCountry('Germany');
    setFormFlag('🇩🇪');
    setFormEngine('4.0L Twin-Turbo V8');
    setFormCylinders('V8');
    setFormFuelType('Petrol');
    setFormYear('2023');
    setFormBodyType('Coupe');
    setFormPerformance('510 HP • 0-100 in 3.8s');
    setFormDifficulty('beginner');
    setFormSoundProfile('v8_naturally_aspirated');
    setFormCustomAudioUrl('');
    setFormCustomImageUrl('');
    setFormAcceptedAnswers('');
    setFormClues(['', '', '', '', '']);
    setSaveError('');
    setEditingCar(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (car: CarData) => {
    setEditingCar(car);
    setFormManufacturer(car.manufacturer);
    setFormModel(car.model);
    setFormCountry(car.country);
    setFormFlag(car.flag);
    setFormEngine(car.engine);
    setFormCylinders(car.cylinders);
    setFormFuelType(car.fuelType);
    setFormYear(car.year);
    setFormBodyType(car.bodyType);
    setFormPerformance(car.performance);
    setFormDifficulty(car.difficulty);
    setFormSoundProfile(car.soundProfile);
    setFormCustomAudioUrl(car.customAudioUrl || '');
    setFormCustomImageUrl(car.customImageUrl || '');
    setFormAcceptedAnswers(car.acceptedAnswers.join(', '));
    setFormClues([
      car.clues[0] || '',
      car.clues[1] || '',
      car.clues[2] || '',
      car.clues[3] || '',
      car.clues[4] || '',
    ]);
    setSaveError('');
    setIsCreateModalOpen(true);
  };

  const handleSaveCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formManufacturer.trim() || !formModel.trim()) {
      setSaveError('Le fabricant et le modèle sont obligatoires.');
      return;
    }

    // Guard against the race where the admin panel renders before Firebase
    // Auth has finished resolving the session — writing at that moment gets
    // silently rejected by Firestore rules. Wait briefly for auth to settle
    // instead of failing on the first attempt.
    if (!authReady) {
      setSaveError('Session en cours de chargement, patientez une seconde puis réessayez...');
      setTimeout(() => {
        setSaveError('');
      }, 1500);
      return;
    }

    setIsSaving(true);
    setSaveError('');

    const fullName = `${formManufacturer.trim()} ${formModel.trim()}`;
    const answersArray = formAcceptedAnswers
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (!answersArray.includes(fullName)) {
      answersArray.unshift(fullName);
    }

    const cleanClues = formClues.map((c) => c.trim()).filter((c) => c.length > 0);

    const carDataPayload = {
      manufacturer: formManufacturer.trim(),
      model: formModel.trim(),
      fullName,
      country: formCountry.trim(),
      flag: formFlag.trim(),
      engine: formEngine.trim(),
      cylinders: formCylinders.trim(),
      fuelType: formFuelType.trim(),
      year: formYear.trim(),
      bodyType: formBodyType.trim(),
      performance: formPerformance.trim(),
      difficulty: formDifficulty,
      soundProfile: formSoundProfile,
      customAudioUrl: formCustomAudioUrl.trim() || undefined,
      customImageUrl: formCustomImageUrl.trim() || undefined,
      acceptedAnswers: answersArray,
      clues: cleanClues,
    };

    try {
      if (editingCar) {
        await updateMecanqueCar(editingCar.id, carDataPayload);
      } else {
        await addMecanqueCar(carDataPayload);
      }
      await loadCars();
      setIsCreateModalOpen(false);
      setEditingCar(null);
    } catch (err: any) {
      setSaveError(err?.message || 'Erreur lors de la sauvegarde de la voiture.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCarId) return;
    if (!authReady) {
      alert('Session en cours de chargement, patientez une seconde puis réessayez.');
      return;
    }
    setIsSaving(true);
    try {
      await deleteMecanqueCar(deletingCarId);
      await loadCars();
      setDeletingCarId(null);
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la suppression.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter cars
  const filteredCars = cars.filter((c) => {
    if (selectedDifficultyFilter !== 'all' && c.difficulty !== selectedDifficultyFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.fullName.toLowerCase().includes(q);
      const matchMake = c.manufacturer.toLowerCase().includes(q);
      const matchModel = c.model.toLowerCase().includes(q);
      return matchName || matchMake || matchModel;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#0E0D0B] text-[#F8F7E8] pb-24 font-sans select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#161513]/90 backdrop-blur-md border-b border-[#FF8600]/20 px-4 py-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveView('admin')}
                className="px-3 py-1.5 rounded-xl bg-[#FF8600]/10 hover:bg-[#FF8600]/20 text-[#FF8600] border border-[#FF8600]/30 text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 shrink-0"
              >
                <ArrowLeft size={14} />
                <span>Tableau de Bord</span>
              </button>
              <div className="p-2 bg-[#FF8600]/20 text-[#FF8600] rounded-xl border border-[#FF8600]/30 shadow-lg shrink-0">
                <Gauge className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white">
                  OMOUR MECANQUE CMS
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-[#FF8600]/20 text-[#FF8600] border border-[#FF8600]/30 font-mono">
                  CAR DATABASE
                </span>
              </div>
              <p className="text-[11px] text-[#B8B5A5] font-mono mt-0.5 break-all">
                Connecté en tant que <span className="text-[#FF8600] font-medium">{firebaseUser?.email || 'Admin Authorized'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto">
            <button
              onClick={openCreateModal}
              className="flex-1 lg:flex-none flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 bg-[#FF8600] hover:bg-[#E87038] text-[#040403] rounded-xl font-bold text-xs sm:text-sm shadow-lg font-mono transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Voiture</span>
            </button>

            <button
              onClick={adminLogout}
              className="flex items-center space-x-1.5 sm:space-x-2 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl font-bold text-xs sm:text-sm font-mono border border-rose-500/30 transition active:scale-95 shrink-0"
              title="Déconnexion Admin"
            >
              <LogOut className="w-4 h-4" />
              <span>Quitter</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-8 space-y-6">
        {/* Analytics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
          <div className="bg-[#1B1B18] border border-[#B8B5A5]/20 rounded-2xl p-4 flex items-center space-x-4">
            <div className="p-3 bg-[#FF8600]/10 text-[#FF8600] rounded-xl">
              <CarIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#B8B5A5] uppercase">Total Voitures</p>
              <p className="text-2xl font-black text-white">{cars.length}</p>
            </div>
          </div>

          <div className="bg-[#1B1B18] border border-[#B8B5A5]/20 rounded-2xl p-4 flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Gauge className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#B8B5A5] uppercase">Beginner</p>
              <p className="text-2xl font-black text-emerald-400">
                {cars.filter((c) => c.difficulty === 'beginner').length}
              </p>
            </div>
          </div>

          <div className="bg-[#1B1B18] border border-[#B8B5A5]/20 rounded-2xl p-4 flex items-center space-x-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#B8B5A5] uppercase">Intermediate</p>
              <p className="text-2xl font-black text-amber-400">
                {cars.filter((c) => c.difficulty === 'intermediate').length}
              </p>
            </div>
          </div>

          <div className="bg-[#1B1B18] border border-[#B8B5A5]/20 rounded-2xl p-4 flex items-center space-x-4">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#B8B5A5] uppercase">Expert</p>
              <p className="text-2xl font-black text-rose-400">
                {cars.filter((c) => c.difficulty === 'expert').length}
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Search & Filters */}
        <div className="bg-[#1B1B18] border border-[#FF8600]/20 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 font-mono">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B5A5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une marque, un modèle (BMW, M3, Porsche...)..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#0E0D0B] border border-[#B8B5A5]/20 rounded-xl text-sm text-white placeholder-[#868C98] focus:outline-none focus:border-[#FF8600] transition"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={selectedDifficultyFilter}
              onChange={(e) => setSelectedDifficultyFilter(e.target.value)}
              className="w-full sm:w-auto bg-[#0E0D0B] border border-[#B8B5A5]/20 text-xs sm:text-sm text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#FF8600]"
            >
              <option value="all">Toutes les difficultés</option>
              <option value="beginner">🟢 Beginner (Facile)</option>
              <option value="intermediate">🟡 Intermediate (Moyen)</option>
              <option value="expert">🔴 Expert (Difficile)</option>
            </select>

            <button
              onClick={loadCars}
              disabled={isLoadingCars}
              className="p-2.5 bg-[#0E0D0B] border border-[#B8B5A5]/20 text-[#FF8600] rounded-xl hover:border-[#FF8600] transition shrink-0 self-center sm:self-auto"
              title="Rafraîchir"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingCars ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Cars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCars.map((car, idx) => {
            const diffColor =
              car.difficulty === 'beginner'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : car.difficulty === 'intermediate'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30';

            return (
              <motion.div
                key={`mec-adm-car-${car.id}-${idx}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-[#1B1B18] border border-[#FF8600]/20 hover:border-[#FF8600]/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{car.flag} {car.country}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${diffColor}`}>
                      {car.difficulty}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#FF8600] transition">
                    {car.fullName}
                  </h3>

                  <p className="text-xs font-mono text-[#B8B5A5] mb-2">
                    {car.engine} • {car.performance}
                  </p>

                  <div className="space-y-1 border-t border-[#FFFFFF]/10 pt-2 text-xs text-slate-300">
                    <span className="text-[10px] font-mono font-bold text-[#FF8600] uppercase block">INDICES ({car.clues.length}):</span>
                    {car.clues.slice(0, 3).map((clue, idx) => (
                      <p key={`car-clue-${car.id}-${idx}`} className="text-[11px] text-[#B8B5A5] truncate">
                        • {clue}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#FFFFFF]/10 flex items-center justify-between text-xs font-mono text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleTestSound(car.soundProfile, car.customAudioUrl, car.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition flex items-center gap-1 ${
                        testingAudioId === car.id
                          ? 'bg-[#FF8600] text-black animate-pulse'
                          : 'bg-[#FF8600]/10 hover:bg-[#FF8600]/20 text-[#FF8600] border border-[#FF8600]/30'
                      }`}
                    >
                      <Volume2 size={12} />
                      <span>{testingAudioId === car.id ? 'Écoute...' : 'Test Son'}</span>
                    </button>
                    {car.customAudioUrl && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        MP3
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(car)}
                      className="p-2 text-slate-300 hover:text-white bg-[#0E0D0B] hover:bg-[#FF8600] hover:text-[#040403] rounded-lg transition"
                      title="Modifier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeletingCarId(car.id)}
                      className="p-2 text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-600 rounded-lg transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredCars.length === 0 && (
            <div className="col-span-full py-16 bg-[#1B1B18] border border-[#B8B5A5]/20 rounded-2xl text-center">
              <FolderPlus className="w-12 h-12 text-[#868C98] mx-auto mb-3" />
              <p className="text-white font-bold text-base">Aucune voiture trouvée</p>
              <p className="text-[#B8B5A5] text-xs mt-1 font-mono">
                Ajustez votre recherche ou ajoutez une nouvelle voiture à la base Omour Mecanque.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-xl bg-[#1B1B18] border border-[#FF8600]/30 rounded-3xl p-4 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-[#0E0D0B] rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-[#FF8600]/10 text-[#FF8600] rounded-2xl border border-[#FF8600]/20">
                  <CarIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">
                    {editingCar ? 'Modifier la Voiture' : 'Nouvelle Voiture Omour Mecanque'}
                  </h2>
                  <p className="text-xs text-[#B8B5A5] font-mono">
                    Spécifiez la fiche technique et les indices de la voiture
                  </p>
                </div>
              </div>

              {saveError && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold font-mono">
                  {saveError}
                </div>
              )}

              <form onSubmit={handleSaveCar} className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#B8B5A5] uppercase mb-1">Fabricant / Marque *</label>
                    <input
                      type="text"
                      required
                      value={formManufacturer}
                      onChange={(e) => setFormManufacturer(e.target.value)}
                      placeholder="BMW, Porsche, Ferrari..."
                      className="w-full px-3 py-2.5 bg-[#0E0D0B] border border-[#B8B5A5]/20 rounded-xl text-white focus:outline-none focus:border-[#FF8600]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#B8B5A5] uppercase mb-1">Modèle *</label>
                    <input
                      type="text"
                      required
                      value={formModel}
                      onChange={(e) => setFormModel(e.target.value)}
                      placeholder="M3, 911 GT3, F40..."
                      className="w-full px-3 py-2.5 bg-[#0E0D0B] border border-[#B8B5A5]/20 rounded-xl text-white focus:outline-none focus:border-[#FF8600]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#B8B5A5] uppercase mb-1">Pays</label>
                    <input
                      type="text"
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      placeholder="Germany, Italy..."
                      className="w-full px-3 py-2.5 bg-[#0E0D0B] border border-[#B8B5A5]/20 rounded-xl text-white focus:outline-none focus:border-[#FF8600]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#B8B5A5] uppercase mb-1">Drapeau Emoji</label>
                    <input
                      type="text"
                      value={formFlag}
                      onChange={(e) => setFormFlag(e.target.value)}
                      placeholder="🇩🇪, 🇮🇹, 🇯🇵..."
                      className="w-full px-3 py-2.5 bg-[#0E0D0B] border border-[#B8B5A5]/20 rounded-xl text-white focus:outline-none focus:border-[#FF8600]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#B8B5A5] uppercase mb-1">Difficulté</label>
                    <select
                      value={formDifficulty}
                      onChange={(e) => setFormDifficulty(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-[#0E0D0B] border border-[#B8B5A5]/20 rounded-xl text-white focus:outline-none focus:border-[#FF8600]"
                    >
                      <option value="beginner">Beginner (Facile)</option>
                      <option value="intermediate">Intermediate (Moyen)</option>
                      <option value="expert">Expert (Difficile)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#B8B5A5] uppercase mb-1">Moteur / Spec</label>
                    <input
                      type="text"
                      value={formEngine}
                      onChange={(e) => setFormEngine(e.target.value)}
                      placeholder="3.0L Twin-Turbo Inline-6"
                      className="w-full px-3 py-2.5 bg-[#0E0D0B] border border-[#B8B5A5]/20 rounded-xl text-white focus:outline-none focus:border-[#FF8600]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#B8B5A5] uppercase mb-1">Performance</label>
                    <input
                      type="text"
                      value={formPerformance}
                      onChange={(e) => setFormPerformance(e.target.value)}
                      placeholder="510 HP • 0-100 in 3.8s"
                      className="w-full px-3 py-2.5 bg-[#0E0D0B] border border-[#B8B5A5]/20 rounded-xl text-white focus:outline-none focus:border-[#FF8600]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#B8B5A5] uppercase">Profile Sonore Moteur Synthetisé</label>
                    <button
                      type="button"
                      onClick={() => handleTestSound(formSoundProfile, formCustomAudioUrl)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition flex items-center gap-1 ${
                        testingAudioId === 'modal_test'
                          ? 'bg-[#FF8600] text-black animate-pulse'
                          : 'bg-[#FF8600]/10 hover:bg-[#FF8600]/20 text-[#FF8600] border border-[#FF8600]/30'
                      }`}
                    >
                      <Volume2 size={12} />
                      <span>{testingAudioId === 'modal_test' ? 'Écoute en cours...' : 'Tester le Son'}</span>
                    </button>
                  </div>
                  <select
                    value={formSoundProfile}
                    onChange={(e) => setFormSoundProfile(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-[#0E0D0B] border border-[#B8B5A5]/20 rounded-xl text-white focus:outline-none focus:border-[#FF8600]"
                  >
                    <option value="v8_naturally_aspirated">V8 Atmosférique (v8_naturally_aspirated)</option>
                    <option value="v6_turbo">V6 Turbo (v6_turbo)</option>
                    <option value="v10_high_rev">V10 High-Rev (v10_high_rev)</option>
                    <option value="inline4_turbo">4 Cylindres Turbo (inline4_turbo)</option>
                    <option value="boxer6">Flat-6 / Boxer6 (boxer6)</option>
                    <option value="v12_exotic">V12 Exotique (v12_exotic)</option>
                  </select>
                </div>

                {/* Custom Audio URL Field */}
                <div>
                  <label className="block text-[#B8B5A5] uppercase mb-1">
                    🔊 Lien Audio Personnalisé (MP3 / WAV) <span className="text-[#B8B5A5]/60 font-normal">(Optionnel)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={formCustomAudioUrl}
                      onChange={(e) => setFormCustomAudioUrl(e.target.value)}
                      placeholder="https://example.com/engine-rev.mp3"
                      className="w-full px-3 py-2.5 bg-[#0E0D0B] border border-[#B8B5A5]/20 rounded-xl text-white focus:outline-none focus:border-[#FF8600] pl-8"
                    />
                    <Music className="w-4 h-4 text-[#FF8600] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Custom Image URL Field */}
                <div>
                  <label className="block text-[#B8B5A5] uppercase mb-1">
                    🖼️ Lien Image Voiture <span className="text-[#B8B5A5]/60 font-normal">(Optionnel)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={formCustomImageUrl}
                      onChange={(e) => setFormCustomImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-car.jpg"
                      className="w-full px-3 py-2.5 bg-[#0E0D0B] border border-[#B8B5A5]/20 rounded-xl text-white focus:outline-none focus:border-[#FF8600] pl-8"
                    />
                    <ImageIcon className="w-4 h-4 text-[#FF8600] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-[#B8B5A5] uppercase mb-1">Réponses Acceptées (séparées par virgules)</label>
                  <input
                    type="text"
                    value={formAcceptedAnswers}
                    onChange={(e) => setFormAcceptedAnswers(e.target.value)}
                    placeholder="BMW M3, M3, BMW M 3"
                    className="w-full px-3 py-2.5 bg-[#0E0D0B] border border-[#B8B5A5]/20 rounded-xl text-white focus:outline-none focus:border-[#FF8600]"
                  />
                </div>

                {/* 5 Clues */}
                <div className="space-y-2 border-t border-[#FFFFFF]/10 pt-3">
                  <label className="block text-[#FF8600] uppercase font-bold">5 Indices Progressifs:</label>
                  {formClues.map((clue, i) => (
                    <div key={`form-clue-${i}`} className="flex items-center gap-2">
                      <span className="text-[#FF8600] font-bold w-6">#{i + 1}</span>
                      <input
                        type="text"
                        value={clue}
                        onChange={(e) => {
                          const next = [...formClues];
                          next[i] = e.target.value;
                          setFormClues(next);
                        }}
                        placeholder={`Indice stage ${i + 1}...`}
                        className="flex-1 px-3 py-2 bg-[#0E0D0B] border border-[#B8B5A5]/20 rounded-xl text-white focus:outline-none focus:border-[#FF8600]"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-5 py-2.5 bg-[#0E0D0B] text-[#B8B5A5] rounded-xl font-bold transition"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-[#FF8600] hover:bg-[#E87038] text-[#040403] rounded-xl font-bold shadow-lg transition flex items-center space-x-2"
                  >
                    {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>{editingCar ? 'Enregistrer' : 'Créer Voiture'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingCarId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-[#1B1B18] border border-rose-500/30 rounded-3xl p-6 text-center shadow-2xl font-mono"
            >
              <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-black text-white mb-2">Supprimer cette voiture ?</h3>
              <p className="text-xs text-[#B8B5A5] mb-6">
                Cette action retirera définitivement cette voiture de la base de données Omour Mecanque.
              </p>

              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => setDeletingCarId(null)}
                  className="px-5 py-2.5 bg-[#0E0D0B] text-[#B8B5A5] rounded-xl font-bold text-sm transition"
                >
                  Annuler
                </button>

                <button
                  onClick={handleDeleteConfirm}
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-600/30 transition flex items-center space-x-2"
                >
                  {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>Supprimer</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
