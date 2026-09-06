import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  LogOut,
  Shield,
  ShieldCheck,
  Car as CarIcon,
  ChevronRight,
  ArrowLeft,
  Layers,
  CheckCircle2,
  XCircle,
  Globe,
  Sliders,
  RefreshCw,
  Power,
  Upload,
  Brain,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GameCard, CardCategory, CardDifficulty } from '../../types';
import { MainGameCard } from '../game/MainGameCard';
import { uploadToCloudinary } from '../../services/cloudinaryService';

export const AdminView: React.FC = () => {
  const {
    isAdminLoggedIn,
    adminLogin,
    adminLogout,
    gameCards,
    createCard,
    updateCard,
    deleteCard,
    setActiveView,
    activeView,
    firebaseUser,
  } = useApp();

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Filters & Search
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedModeFilter, setSelectedModeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Async States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<GameCard | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State for Create / Edit
  const [formCategory, setFormCategory] = useState<CardCategory>('action');
  const [formMode, setFormMode] = useState<string>('friends');
  const [formDifficulty, setFormDifficulty] = useState<CardDifficulty>('medium');
  const [formOrder, setFormOrder] = useState<number>(0);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formOptionA, setFormOptionA] = useState('REMOVE A PLAYER');
  const [formOptionB, setFormOptionB] = useState('ASK AN EMBARRASSING QUESTION');
  const [formIsActive, setFormIsActive] = useState(true);

  // Quick Preset Images for Shield & Special Cards
  const PRESET_IMAGES = [
    { label: 'Guardian Shield', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80' },
    { label: 'Royal Defense', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80' },
    { label: 'Chaos Gambit', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&auto=format&fit=crop&q=80' },
    { label: 'Destiny Orb', url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=600&auto=format&fit=crop&q=80' },
  ];

  // Dashboard Stats
  const totalCards = gameCards.length;
  const activeCount = gameCards.filter((c) => c.isActive).length;
  const disabledCount = gameCards.filter((c) => !c.isActive).length;
  
  const modeStats = {
    friends: gameCards.filter((c) => c.mode === 'friends' || c.mode === 'couple' || !c.mode).length,
    family: gameCards.filter((c) => c.mode === 'family').length,
    adult: gameCards.filter((c) => c.mode === '18+' || c.mode === 'adult').length,
    mode_fr: gameCards.filter((c) => c.mode === 'mode_fr').length,
    mode_tn: gameCards.filter((c) => c.mode === 'mode_tn').length,
    mode_fun: gameCards.filter((c) => c.mode === 'mode_fun').length,
  };

  // Handle Image File Upload via Cloudinary
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size exceeds 10MB limit.');
      return;
    }
    setIsUploadingImage(true);
    setUploadError('');
    try {
      const url = await uploadToCloudinary(file);
      setFormImageUrl(url);
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload image to Cloudinary.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Admin Login Submission
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

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormCategory('action');
    setFormMode('friends');
    setFormDifficulty('medium');
    setFormOrder(0);
    setFormTitle('NEW CHALLENGE');
    setFormContent('Enter your question or action prompt...');
    setFormDescription('Optional guidelines for players.');
    setFormImageUrl('');
    setFormOptionA('REMOVE A PLAYER');
    setFormOptionB('ASK AN EMBARRASSING QUESTION');
    setFormIsActive(true);
    setSaveError('');
    setUploadError('');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (card: GameCard) => {
    setEditingCard(card);
    setFormCategory(card.category);
    setFormMode(card.mode === 'adult' ? '18+' : (card.mode || 'friends'));
    setFormDifficulty(card.difficulty || 'medium');
    setFormOrder(card.order || 0);
    setFormTitle(card.title);
    setFormContent(card.content);
    setFormDescription(card.description || '');
    setFormImageUrl(card.imageUrl || '');
    setFormOptionA(card.specialOptions?.optionA || 'REMOVE A PLAYER');
    setFormOptionB(card.specialOptions?.optionB || 'ASK AN EMBARRASSING QUESTION');
    setFormIsActive(card.isActive);
    setSaveError('');
    setUploadError('');
  };

  // Submit Create
  const handleSaveCreate = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      setSaveError('Title and content text are required.');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    try {
      await createCard({
        category: formCategory,
        title: formTitle.toUpperCase(),
        content: formContent,
        mode: formMode,
        difficulty: formDifficulty,
        order: formOrder,
        description: formDescription,
        imageUrl: formImageUrl.trim() ? formImageUrl.trim() : undefined,
        specialOptions:
          formCategory === 'special'
            ? { optionA: formOptionA, optionB: formOptionB }
            : undefined,
        isActive: formIsActive,
      });

      setIsCreateModalOpen(false);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save card to Firebase.');
    } finally {
      setIsSaving(false);
    }
  };

  // Submit Edit
  const handleSaveEdit = async () => {
    if (!editingCard || !formTitle.trim() || !formContent.trim()) {
      setSaveError('Title and content text are required.');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    try {
      await updateCard(editingCard.id, {
        category: formCategory,
        title: formTitle.toUpperCase(),
        content: formContent,
        mode: formMode,
        difficulty: formDifficulty,
        order: formOrder,
        description: formDescription,
        imageUrl: formImageUrl.trim() ? formImageUrl.trim() : undefined,
        specialOptions:
          formCategory === 'special'
            ? { optionA: formOptionA, optionB: formOptionB }
            : undefined,
        isActive: formIsActive,
      });

      setEditingCard(null);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to update card in Firebase.');
    } finally {
      setIsSaving(false);
    }
  };

  // One-click Active Toggle directly in list
  const handleToggleActive = async (card: GameCard) => {
    try {
      await updateCard(card.id, { isActive: !card.isActive });
    } catch (err: any) {
      console.warn('[AdminView] Toggle active error:', err);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (deletingCardId) {
      setIsSaving(true);
      try {
        await deleteCard(deletingCardId);
        setDeletingCardId(null);
      } catch (err: any) {
        console.warn('[AdminView] Delete card error:', err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Filtered Cards
  const filteredCards = gameCards.filter((card) => {
    const matchesCategory =
      selectedCategoryFilter === 'all' || card.category === selectedCategoryFilter;
    
    const matchesMode =
      selectedModeFilter === 'all' ||
      (card.mode || 'friends') === selectedModeFilter ||
      card.mode === 'all';

    const matchesStatus =
      selectedStatusFilter === 'all' ||
      (selectedStatusFilter === 'active' && card.isActive) ||
      (selectedStatusFilter === 'disabled' && !card.isActive);

    const matchesSearch =
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.mode || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesMode && matchesStatus && matchesSearch;
  });

  // Live Preview Card Object
  const livePreviewCard: GameCard = {
    id: editingCard?.id || 'preview-card',
    category: formCategory,
    title: formTitle || 'CARD TITLE PREVIEW',
    content: formContent || 'Enter your card text content...',
    mode: formMode,
    difficulty: formDifficulty,
    order: formOrder,
    description: formDescription,
    imageUrl: formImageUrl.trim() ? formImageUrl.trim() : undefined,
    specialOptions:
      formCategory === 'special'
        ? { optionA: formOptionA, optionB: formOptionB }
        : undefined,
    isActive: formIsActive,
  };

  // ================= 1. ADMIN LOGIN SCREEN =================
  if (!isAdminLoggedIn) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto space-y-6 pt-6 pb-28 px-4 text-left select-none"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 rounded-2xl bg-[#FF8600]/15 text-[#FF8600] border border-[#FF8600]/30 shadow-xs">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-xl font-mono font-bold tracking-wider text-[#040403] dark:text-[#F8F7E8] uppercase">
            PORTAIL D'ADMINISTRATION CENTRAL
          </h2>
          <p className="text-xs text-[#989277] dark:text-[#B8B5A5]">
            Authentification requise via Firebase pour accéder au tableau de bord RAKCHA GAME.
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLoginSubmit}
          className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 space-y-4 shadow-sm"
        >
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold text-[#989277] dark:text-[#B8B5A5] uppercase">
              Email Administrateur
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="medakacha@gmail.com"
              className="w-full px-4 py-3 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/30 dark:border-[#B8B5A5]/20 text-xs text-[#040403] dark:text-[#F8F7E8] font-mono focus:outline-none focus:border-[#FF8600]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold text-[#989277] dark:text-[#B8B5A5] uppercase">
              Mot de Passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/30 dark:border-[#B8B5A5]/20 text-xs text-[#040403] dark:text-[#F8F7E8] font-mono focus:outline-none focus:border-[#FF8600]"
            />
          </div>

          {loginError && (
            <p className="text-xs font-mono text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              {loginError}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-3.5 rounded-2xl bg-[#FF8600] text-white text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#FF8600]/90 transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoggingIn ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>AUTHENTIFICATION EN COURS...</span>
              </>
            ) : (
              <span>CONNEXION TABLEAU DE BORD</span>
            )}
          </button>
        </form>

        <button
          onClick={() => setActiveView('main')}
          className="w-full py-2.5 text-center text-xs font-mono text-[#989277] hover:underline uppercase"
        >
          ← Retour au Mode Joueur
        </button>
      </motion.div>
    );
  }

  // ================= 2. CENTRAL ADMIN DASHBOARD =================
  if (isAdminLoggedIn && activeView === 'admin') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6 pt-4 pb-28 px-4 text-left select-none"
      >
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-[#FF8600]/15 text-[#FF8600] border border-[#FF8600]/30 shadow-xs">
              <ShieldCheck size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold uppercase border border-emerald-500/30">
                  ADMIN AUTHENTICATED
                </span>
              </div>
              <h1 className="text-xl font-mono font-bold text-[#040403] dark:text-[#F8F7E8] uppercase mt-1">
                PORTAIL D'ADMINISTRATION CENTRAL
              </h1>
              <p className="text-xs font-mono text-[#989277] dark:text-[#B8B5A5]">
                Connecté en tant que <span className="font-bold text-[#FF8600]">{firebaseUser?.email || 'Admin Authorized'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={adminLogout}
            className="px-4 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 font-mono text-xs font-bold uppercase transition flex items-center justify-center gap-2"
          >
            <LogOut size={14} />
            <span>Déconnexion Admin</span>
          </button>
        </div>

        {/* Admin Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* 1. AI Learning & Heuristics Dashboard */}
          <div className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-emerald-500/40 dark:border-emerald-500/30 shadow-md space-y-4 flex flex-col justify-between hover:border-emerald-500 transition group">
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 w-fit border border-emerald-500/20">
                <Brain size={24} />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Analytics & Visualizer
                </span>
                <h3 className="text-lg font-bold text-[#040403] dark:text-[#F8F7E8] mt-0.5">
                  AI Learning Analytics
                </h3>
                <p className="text-xs text-[#989277] dark:text-[#B8B5A5] mt-1 leading-relaxed">
                  Visualiser l'évolution du taux de victoire, la durée moyenne et la précision décisionnelle de l'IA (Recharts).
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveView('admin_ai_dashboard')}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase transition shadow-sm flex items-center justify-center gap-2 group-hover:scale-[1.02]"
              id="admin-open-ai-learning-btn"
            >
              <span>AI Dashboard</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* 2. Omour Mecanque Admin */}
          <div className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#FF8600]/40 dark:border-[#FF8600]/30 shadow-md space-y-4 flex flex-col justify-between hover:border-[#FF8600] transition group">
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[#FF8600]/10 text-[#FF8600] w-fit border border-[#FF8600]/20">
                <CarIcon size={24} />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FF8600]">
                  Gamme Auto & Visuals
                </span>
                <h3 className="text-lg font-bold text-[#040403] dark:text-[#F8F7E8] mt-0.5">
                  Omour Mecanque
                </h3>
                <p className="text-xs text-[#989277] dark:text-[#B8B5A5] mt-1 leading-relaxed">
                  Gérer la banque de voitures, spécifications, indices visuels et réponses acceptées.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveView('admin_mecanque')}
              className="w-full py-3 rounded-xl bg-[#FF8600] hover:bg-[#FF8600]/90 text-white font-mono text-xs font-bold uppercase transition shadow-sm flex items-center justify-center gap-2 group-hover:scale-[1.02]"
            >
              <span>Mecanque Admin</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* 3. L'Intrus Admin */}
          <div className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-purple-500/40 dark:border-purple-500/30 shadow-md space-y-4 flex flex-col justify-between hover:border-purple-500 transition group">
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 w-fit border border-purple-500/20">
                <Layers size={24} />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
                  Sujets & Mots Intrus
                </span>
                <h3 className="text-lg font-bold text-[#040403] dark:text-[#F8F7E8] mt-0.5">
                  L'Intrus
                </h3>
                <p className="text-xs text-[#989277] dark:text-[#B8B5A5] mt-1 leading-relaxed">
                  Gérer les catégories, titres de sujets, paires de mots et indices bilingues (FR/AR).
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveView('admin_intrus')}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold uppercase transition shadow-sm flex items-center justify-center gap-2 group-hover:scale-[1.02]"
            >
              <span>L'Intrus Admin</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* 4. Action Vérité Admin */}
          <div className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-amber-500/40 dark:border-amber-500/30 shadow-md space-y-4 flex flex-col justify-between hover:border-amber-500 transition group">
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 w-fit border border-amber-500/20">
                <Layers size={24} />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500">
                  Cartes & Boucliers
                </span>
                <h3 className="text-lg font-bold text-[#040403] dark:text-[#F8F7E8] mt-0.5">
                  Action Vérité
                </h3>
                <p className="text-xs text-[#989277] dark:text-[#B8B5A5] mt-1 leading-relaxed">
                  Gérer la banque de cartes, questions, actions, modes de jeu et boucliers de protection.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveView('admin_action_verite')}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold uppercase transition shadow-sm flex items-center justify-center gap-2 group-hover:scale-[1.02]"
            >
              <span>Action Vérité Admin</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ================= 3. ACTION VÉRITÉ ADMIN CMS =================
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-28 pt-2 px-4 text-left max-w-4xl mx-auto"
    >
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#989277]/30 dark:border-[#B8B5A5]/20">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('admin')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FF8600]/10 hover:bg-[#FF8600]/20 text-[#FF8600] border border-[#FF8600]/30 text-xs font-mono font-bold uppercase transition"
            >
              <ArrowLeft size={12} />
              <span>Tableau de Bord</span>
            </button>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-mono text-[9px] font-bold uppercase tracking-widest border border-amber-500/30 flex items-center gap-1">
              <Shield size={10} /> ACTION VÉRITÉ CMS
            </span>
          </div>
          <h2 className="text-lg font-mono font-bold text-[#040403] dark:text-[#F8F7E8] uppercase mt-1">
            ACTION VÉRITÉ CONTENT MANAGEMENT
          </h2>
        </div>

        <button
          onClick={adminLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#040403]/5 dark:bg-[#F8F7E8]/5 text-xs font-mono text-[#989277] dark:text-[#B8B5A5] hover:text-red-500 transition-colors self-start sm:self-auto"
        >
          <LogOut size={12} />
          <span>Exit CMS</span>
        </button>
      </div>

      {/* Overview Stats Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 space-y-1">
          <div className="flex items-center justify-between text-[#989277]">
            <span className="text-[9px] font-mono font-bold uppercase">Total Cards</span>
            <Layers size={14} className="text-[#FF8600]" />
          </div>
          <p className="text-xl font-mono font-bold text-[#040403] dark:text-[#F8F7E8]">
            {totalCards}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 space-y-1">
          <div className="flex items-center justify-between text-[#989277]">
            <span className="text-[9px] font-mono font-bold uppercase">Active Cards</span>
            <CheckCircle2 size={14} className="text-emerald-500" />
          </div>
          <p className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {activeCount}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 space-y-1">
          <div className="flex items-center justify-between text-[#989277]">
            <span className="text-[9px] font-mono font-bold uppercase">Disabled Cards</span>
            <XCircle size={14} className="text-red-500" />
          </div>
          <p className="text-xl font-mono font-bold text-red-500">
            {disabledCount}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 space-y-1">
          <div className="flex items-center justify-between text-[#989277]">
            <span className="text-[9px] font-mono font-bold uppercase">Modes Active</span>
            <Globe size={14} className="text-purple-500" />
          </div>
          <p className="text-xl font-mono font-bold text-[#040403] dark:text-[#F8F7E8]">
            {Object.values(modeStats).filter((c) => c > 0).length} Modes
          </p>
        </div>
      </div>

      {/* Mode Distribution Bar */}
      <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase text-[#989277]">
          <span>Card Mode Distribution</span>
          <span>Scope Scoping Active</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1 text-center">
          {[
            { id: 'friends', label: 'Friends', count: modeStats.friends, color: 'text-blue-500' },
            { id: 'family', label: 'Family', count: modeStats.family, color: 'text-emerald-500' },
            { id: '18+', label: '18+ Adult', count: modeStats.adult, color: 'text-red-500' },
            { id: 'mode_fr', label: 'Mode FR', count: modeStats.mode_fr, color: 'text-amber-500' },
            { id: 'mode_tn', label: 'Mode TN', count: modeStats.mode_tn, color: 'text-[#FF8600]' },
            { id: 'mode_fun', label: 'Mode Fun', count: modeStats.mode_fun, color: 'text-purple-500' },
          ].map((m, idx) => (
            <div
              key={`adm-mode-${m.id}-${idx}`}
              onClick={() => setSelectedModeFilter(selectedModeFilter === m.id ? 'all' : m.id)}
              className={`p-2 rounded-xl border cursor-pointer transition-all ${
                selectedModeFilter === m.id
                  ? 'border-[#FF8600] bg-[#FF8600]/10'
                  : 'border-[#989277]/20 bg-[#040403]/5 dark:bg-[#F8F7E8]/5 hover:border-[#FF8600]/40'
              }`}
            >
              <p className="text-[9px] font-mono uppercase text-[#989277]">{m.label}</p>
              <p className={`text-xs font-mono font-bold ${m.color}`}>{m.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Bar: Create Button & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#989277]"
          />
          <input
            type="text"
            placeholder="Search prompt, title, ID, or mode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 text-xs font-mono text-[#040403] dark:text-[#F8F7E8] focus:outline-none focus:border-[#FF8600]"
          />
        </div>

        {/* Create Card Button */}
        <button
          onClick={handleOpenCreateModal}
          className="py-2.5 px-4 rounded-xl bg-[#FF8600] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#FF8600]/90 transition-transform active:scale-95 shadow-xs whitespace-nowrap"
        >
          <Plus size={15} />
          <span>CREATE NEW CARD</span>
        </button>
      </div>

      {/* Filter Controls Row */}
      <div className="space-y-2">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-mono font-bold text-[#989277] mr-1 uppercase">Category:</span>
          {[
            { id: 'all', label: 'ALL CATEGORIES', color: 'bg-[#FF8600]' },
            { id: 'action', label: 'RED (ACTION)', color: 'bg-red-500' },
            { id: 'truth', label: 'YELLOW (TRUTH)', color: 'bg-amber-400' },
            { id: 'shield', label: 'GREEN (SHIELD)', color: 'bg-emerald-500' },
            { id: 'special', label: 'SPECIAL (MULTI)', color: 'bg-purple-500' },
          ].map((f, idx) => (
            <button
              key={`adm-cat-${f.id}-${idx}`}
              onClick={() => setSelectedCategoryFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
                selectedCategoryFilter === f.id
                  ? `${f.color} text-white shadow-xs`
                  : 'bg-[#040403]/5 dark:bg-[#F8F7E8]/5 text-[#989277] dark:text-[#B8B5A5] hover:bg-[#040403]/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Mode & Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Dropdown Filter */}
          <div className="flex items-center gap-1.5 bg-[#FFFFFF] dark:bg-[#1B1B18] px-3 py-1.5 rounded-xl border border-[#989277]/30 dark:border-[#B8B5A5]/20 text-[10px] font-mono text-[#040403] dark:text-[#F8F7E8]">
            <Globe size={12} className="text-[#989277]" />
            <span className="font-bold uppercase text-[#989277]">Mode:</span>
            <select
              value={selectedModeFilter}
              onChange={(e) => setSelectedModeFilter(e.target.value)}
              className="bg-transparent font-mono text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">ALL MODES</option>
              <option value="friends">Friends Mode</option>
              <option value="family">Family Mode</option>
              <option value="18+">18+ Adult Mode</option>
              <option value="mode_fr">Mode FR (French)</option>
              <option value="mode_tn">Mode TN (Tunisian)</option>
              <option value="mode_fun">Mode Fun</option>
            </select>
          </div>

          {/* Status Dropdown Filter */}
          <div className="flex items-center gap-1.5 bg-[#FFFFFF] dark:bg-[#1B1B18] px-3 py-1.5 rounded-xl border border-[#989277]/30 dark:border-[#B8B5A5]/20 text-[10px] font-mono text-[#040403] dark:text-[#F8F7E8]">
            <Sliders size={12} className="text-[#989277]" />
            <span className="font-bold uppercase text-[#989277]">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-transparent font-mono text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">ALL STATUSES</option>
              <option value="active">Active Only</option>
              <option value="disabled">Disabled Only</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(selectedCategoryFilter !== 'all' || selectedModeFilter !== 'all' || selectedStatusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategoryFilter('all');
                setSelectedModeFilter('all');
                setSelectedStatusFilter('all');
                setSearchQuery('');
              }}
              className="px-2.5 py-1.5 rounded-xl text-[10px] font-mono text-red-500 hover:underline uppercase"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Cards List Grid */}
      <div className="space-y-3">
        {filteredCards.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-[#989277]/30 text-center space-y-2">
            <p className="text-xs font-mono text-[#989277]">
              No cards found matching your query or filter criteria.
            </p>
          </div>
        ) : (
          filteredCards.map((card, idx) => {
            const badgeClass =
              card.category === 'action'
                ? 'bg-red-500/15 text-red-500 border-red-500/30'
                : card.category === 'truth'
                ? 'bg-amber-400/15 text-amber-600 dark:text-amber-400 border-amber-400/30'
                : card.category === 'shield'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';

            return (
              <div
                key={`adm-card-${card.id}-${idx}`}
                className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 space-y-2 shadow-xs transition-all hover:border-[#FF8600]/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full border text-[9px] font-mono font-bold uppercase tracking-wider ${badgeClass}`}
                    >
                      {card.category}
                    </span>

                    <span className="px-2 py-0.5 rounded-full bg-[#040403]/5 dark:bg-[#F8F7E8]/5 text-[9px] font-mono font-semibold uppercase text-[#989277] border border-[#989277]/20">
                      Mode: {card.mode || 'friends'}
                    </span>

                    {card.difficulty && (
                      <span className="px-2 py-0.5 rounded-full bg-[#040403]/5 dark:bg-[#F8F7E8]/5 text-[9px] font-mono uppercase text-[#989277]">
                        {card.difficulty}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Status 1-Click Toggle */}
                    <button
                      onClick={() => handleToggleActive(card)}
                      className={`px-2.5 py-1 rounded-md text-[9px] font-mono uppercase font-bold transition-all flex items-center gap-1 ${
                        card.isActive
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                          : 'bg-red-500/15 text-red-500 hover:bg-red-500/25'
                      }`}
                    >
                      <Power size={10} />
                      <span>{card.isActive ? 'ACTIVE' : 'DISABLED'}</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEditModal(card)}
                      className="p-1.5 rounded-lg text-[#989277] hover:text-[#040403] dark:hover:text-[#F8F7E8] transition-colors"
                      title="Edit Card"
                    >
                      <Edit2 size={14} />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setDeletingCardId(card.id)}
                      className="p-1.5 rounded-lg text-[#989277] hover:text-red-500 transition-colors"
                      title="Delete Card"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-mono font-bold text-[#040403] dark:text-[#F8F7E8] uppercase">
                    {card.title}
                  </p>
                  <p className="text-xs text-[#040403]/80 dark:text-[#F8F7E8]/80 line-clamp-2 mt-0.5">
                    {card.content}
                  </p>
                  {card.description && (
                    <p className="text-[10px] text-[#989277] italic mt-1">
                      Guideline: {card.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= 3. CREATE / EDIT MODAL WITH LIVE PREVIEW ================= */}
      <AnimatePresence>
        {(isCreateModalOpen || editingCard) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040403]/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 p-6 space-y-6 shadow-2xl my-auto text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#989277]/20 dark:border-[#B8B5A5]/15">
                <h3 className="text-sm font-mono font-bold text-[#040403] dark:text-[#F8F7E8] uppercase flex items-center gap-2">
                  <span>{isCreateModalOpen ? 'CREATE NEW CARD' : 'EDIT GAME CARD'}</span>
                </h3>
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingCard(null);
                  }}
                  className="p-1 rounded-full text-[#989277] hover:text-[#040403] dark:hover:text-[#F8F7E8]"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form & Live Preview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Form Inputs */}
                <div className="space-y-3.5">
                  {/* Category & Mode Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-[#989277] dark:text-[#B8B5A5] uppercase">
                        Category
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as CardCategory)}
                        className="w-full px-3 py-2 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/30 dark:border-[#B8B5A5]/20 text-xs font-mono text-[#040403] dark:text-[#F8F7E8] focus:outline-none focus:border-[#FF8600]"
                      >
                        <option value="action">ACTION (Red)</option>
                        <option value="truth">TRUTH (Yellow)</option>
                        <option value="shield">SHIELD (Green)</option>
                        <option value="special">SPECIAL (Multi)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-[#989277] dark:text-[#B8B5A5] uppercase">
                        Target Mode
                      </label>
                      <select
                        value={formMode}
                        onChange={(e) => setFormMode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/30 dark:border-[#B8B5A5]/20 text-xs font-mono text-[#040403] dark:text-[#F8F7E8] focus:outline-none focus:border-[#FF8600]"
                      >
                        <option value="friends">Friends Mode</option>
                        <option value="family">Family Mode</option>
                        <option value="18+">18+ Adult Mode</option>
                        <option value="mode_fr">Mode FR (French)</option>
                        <option value="mode_tn">Mode TN (Tunisian)</option>
                        <option value="mode_fun">Mode Fun</option>
                        <option value="all">Universal (All Modes)</option>
                      </select>
                    </div>
                  </div>

                  {/* Difficulty & Priority Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-[#989277] dark:text-[#B8B5A5] uppercase">
                        Difficulty
                      </label>
                      <select
                        value={formDifficulty}
                        onChange={(e) => setFormDifficulty(e.target.value as CardDifficulty)}
                        className="w-full px-3 py-2 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/30 dark:border-[#B8B5A5]/20 text-xs font-mono text-[#040403] dark:text-[#F8F7E8] focus:outline-none focus:border-[#FF8600]"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-[#989277] dark:text-[#B8B5A5] uppercase">
                        Priority Order
                      </label>
                      <input
                        type="number"
                        value={formOrder}
                        onChange={(e) => setFormOrder(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/30 dark:border-[#B8B5A5]/20 text-xs font-mono text-[#040403] dark:text-[#F8F7E8] focus:outline-none focus:border-[#FF8600]"
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-[#989277] dark:text-[#B8B5A5] uppercase">
                      Card Title / Tag
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. RHYTHM CHALLENGE"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/30 dark:border-[#B8B5A5]/20 text-xs font-mono text-[#040403] dark:text-[#F8F7E8] focus:outline-none focus:border-[#FF8600]"
                    />
                  </div>

                  {/* Content Prompt */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-[#989277] dark:text-[#B8B5A5] uppercase">
                      Question / Action Prompt Text
                    </label>
                    <textarea
                      rows={3}
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="Enter the card question or dare..."
                      className="w-full px-3 py-2.5 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/30 dark:border-[#B8B5A5]/20 text-xs font-mono text-[#040403] dark:text-[#F8F7E8] focus:outline-none focus:border-[#FF8600]"
                    />
                  </div>

                  {/* Description / Guidelines */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-[#989277] dark:text-[#B8B5A5] uppercase">
                      Optional Description / Penalty
                    </label>
                    <input
                      type="text"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="e.g. Forfeit 20 points if skipped..."
                      className="w-full px-3 py-2.5 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/30 dark:border-[#B8B5A5]/20 text-xs font-mono text-[#040403] dark:text-[#F8F7E8] focus:outline-none focus:border-[#FF8600]"
                    />
                  </div>

                  {/* Card Image Control */}
                  <div className="space-y-3 p-3.5 rounded-2xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-black/5 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono font-bold text-[#FF8600] uppercase tracking-wider flex items-center gap-1.5">
                        <span>IMAGE DE CARTE & VISUEL (CLOUDINARY)</span>
                      </label>
                      {formImageUrl && (
                        <button
                          type="button"
                          onClick={() => setFormImageUrl('')}
                          className="text-[9px] font-mono text-red-500 hover:underline uppercase"
                        >
                          Supprimer l'image
                        </button>
                      )}
                    </div>

                    {/* File Upload to Cloudinary */}
                    <div className="space-y-1.5">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                        id="admin-card-file-upload"
                      />
                      <button
                        type="button"
                        disabled={isUploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 px-3 rounded-xl bg-[#FF8600]/10 hover:bg-[#FF8600]/20 border border-[#FF8600]/30 text-[#FF8600] text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      >
                        {isUploadingImage ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Téléversement Cloudinary en cours...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={14} />
                            <span>Importer une image (Fichier local)</span>
                          </>
                        )}
                      </button>
                      {uploadError && (
                        <p className="text-[10px] font-mono text-red-500">{uploadError}</p>
                      )}
                    </div>

                    {/* Image URL Input & Thumbnail */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="url"
                          value={formImageUrl}
                          onChange={(e) => setFormImageUrl(e.target.value)}
                          placeholder="Ou entrez une URL (https://...)"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#11110F] border border-[#989277]/30 dark:border-[#B8B5A5]/20 text-xs font-mono text-[#121316] dark:text-[#F8F7E8] focus:outline-none focus:border-[#FF8600]"
                        />
                      </div>
                      {formImageUrl && (
                        <div className="w-9 h-9 rounded-lg overflow-hidden border border-[#FF8600]/40 flex-shrink-0 bg-black/10">
                          <img loading="lazy" decoding="async" src={formImageUrl}
                            alt="Aperçu"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 pt-1">
                      <p className="text-[9px] font-mono text-[#989277] uppercase">
                        Visuels prédéfinis :
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {PRESET_IMAGES.map((preset, idx) => (
                          <button
                            key={`adm-preset-${preset.label}-${idx}`}
                            type="button"
                            onClick={() => setFormImageUrl(preset.url)}
                            className={`p-1.5 rounded-lg border text-[9px] font-mono truncate text-left transition-all ${
                              formImageUrl === preset.url
                                ? 'border-[#FF8600] bg-[#FF8600]/10 text-[#FF8600] font-bold'
                                : 'border-black/10 dark:border-white/10 bg-white dark:bg-[#11110F] text-[#989277] hover:border-[#FF8600]/50'
                            }`}
                          >
                            ⚡ {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Special Options if Category === special */}
                  {formCategory === 'special' && (
                    <div className="space-y-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <p className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 uppercase">
                        Special Two-Choice Options
                      </p>
                      <input
                        type="text"
                        value={formOptionA}
                        onChange={(e) => setFormOptionA(e.target.value)}
                        placeholder="Choice A text"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#11110F] border text-xs font-mono text-[#040403] dark:text-[#F8F7E8]"
                      />
                      <input
                        type="text"
                        value={formOptionB}
                        onChange={(e) => setFormOptionB(e.target.value)}
                        placeholder="Choice B text"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#11110F] border text-xs font-mono text-[#040403] dark:text-[#F8F7E8]"
                      />
                    </div>
                  )}

                  {/* Active Toggle */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="cardActive"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-[#FF8600] accent-[#FF8600]"
                    />
                    <label
                      htmlFor="cardActive"
                      className="text-xs font-mono text-[#040403] dark:text-[#F8F7E8]"
                    >
                      Card Enabled in Gameplay Deck
                    </label>
                  </div>

                  {saveError && (
                    <p className="text-xs font-mono text-red-500 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                      {saveError}
                    </p>
                  )}
                </div>

                {/* Live Card Preview Column */}
                <div className="space-y-2">
                  <p className="text-[10px] font-mono font-bold text-[#FF8600] uppercase tracking-wider text-center">
                    LIVE IN-GAME CARD PREVIEW
                  </p>
                  <MainGameCard
                    card={livePreviewCard}
                    isFlipped={true}
                    isActiveTurn={true}
                    activePlayerName="Admin"
                    timerSeconds={120}
                    shieldsCount={1}
                    selectedSpecialChoice={null}
                    shieldUsedInTurn={false}
                    onFlipCard={() => {}}
                    onUseShield={() => {}}
                    onSelectSpecialChoice={() => {}}
                    onAdvanceTurn={() => {}}
                    previewMode={true}
                  />
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center gap-3 pt-2 border-t border-[#989277]/20">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingCard(null);
                  }}
                  className="flex-1 py-3 rounded-full border border-[#989277]/30 text-xs font-mono uppercase text-[#040403] dark:text-[#F8F7E8]"
                >
                  CANCEL
                </button>

                <button
                  onClick={isCreateModalOpen ? handleSaveCreate : handleSaveEdit}
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-full bg-[#FF8600] text-white text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#FF8600]/90 transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>SAVING TO FIREBASE...</span>
                    </>
                  ) : (
                    <span>{isCreateModalOpen ? 'SAVE NEW CARD' : 'SAVE CHANGES'}</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= 4. DELETE CONFIRMATION MODAL ================= */}
      <AnimatePresence>
        {deletingCardId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040403]/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-red-500/30 p-6 space-y-4 shadow-2xl text-center"
            >
              <div className="inline-flex p-3 rounded-full bg-red-500/15 text-red-500 mx-auto">
                <Trash2 size={24} />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-mono font-bold text-[#040403] dark:text-[#F8F7E8] uppercase">
                  DELETE CARD FROM FIREBASE?
                </h3>
                <p className="text-xs text-[#989277]">
                  Are you sure you want to permanently remove this card doc from Firestore?
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setDeletingCardId(null)}
                  className="flex-1 py-2.5 rounded-full border border-[#989277]/30 text-xs font-mono uppercase text-[#040403] dark:text-[#F8F7E8]"
                >
                  CANCEL
                </button>

                <button
                  onClick={handleConfirmDelete}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-full bg-red-500 text-white text-xs font-mono font-bold uppercase tracking-wider hover:bg-red-600 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <span>PERMANENT DELETE</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
