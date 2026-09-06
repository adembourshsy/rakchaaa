import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  LogOut,
  Layers,
  BarChart3,
  CheckCircle2,
  XCircle,
  Power,
  RefreshCw,
  FolderPlus,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { IntrusTopic } from '../../types';
import { INTRUS_TOPIC_CATEGORIES } from '../../data/intrusTopics';

export const IntrusAdminView: React.FC = () => {
  const {
    isAdminLoggedIn,
    authReady,
    adminLogin,
    adminLogout,
    intrusTopics,
    createIntrusTopic,
    updateIntrusTopic,
    deleteIntrusTopic,
    setActiveView,
    firebaseUser,
  } = useApp();

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Search & Filter state
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Async state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<IntrusTopic | null>(null);
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('places');
  const [formIcon, setFormIcon] = useState('🕵️‍♂️');
  const [formLanguage, setFormLanguage] = useState('tn');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Stats
  const totalTopics = intrusTopics.length;
  const activeCount = intrusTopics.filter((t) => t.isActive !== false).length;
  const disabledCount = totalTopics - activeCount;

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
      <div className="min-h-screen bg-[#0E0B16] text-[#F8F7E8] flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-[#161224] border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/50 relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-3 mb-6 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-3xl shadow-inner">
              🕵️‍♂️
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-purple-400 uppercase bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                L'INTRUS CMS PORTAL
              </span>
              <h1 className="text-xl sm:text-2xl font-black mt-2 text-white">
                Portail Admin L'INTRUS
              </h1>
              <p className="text-xs font-mono text-[#989277] mt-1">
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
              <label className="text-[11px] font-mono text-[#989277] uppercase font-semibold">
                Adresse Email Admin
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="medakacha@gmail.com"
                className="w-full px-4 py-3 rounded-xl bg-[#0E0B16] border border-purple-500/20 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[#989277] uppercase font-semibold">
                Mot de Passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-[#0E0B16] border border-purple-500/20 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition pr-10"
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
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-mono font-bold text-sm tracking-wider uppercase transition shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Connexion Admin L'INTRUS</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Return */}
          <div className="mt-6 pt-4 border-t border-purple-500/10 text-center relative z-10">
            <button
              onClick={() => setActiveView('main')}
              className="text-xs font-mono text-[#989277] hover:text-white hover:underline transition"
            >
              ← Retour à l'application principale
            </button>
          </div>
        </div>
      </div>
    );
  }

  const openCreateModal = () => {
    setFormTitle('');
    setFormCategory('places');
    setFormIcon('🏖️');
    setFormLanguage('tn');
    setFormDescription('');
    setFormIsActive(true);
    setSaveError('');
    setEditingTopic(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (topic: IntrusTopic) => {
    setEditingTopic(topic);
    setFormTitle(topic.title);
    setFormCategory(topic.category || 'places');
    setFormIcon(topic.icon || '🕵️‍♂️');
    setFormLanguage(topic.language || 'tn');
    setFormDescription(topic.description || '');
    setFormIsActive(topic.isActive !== false);
    setSaveError('');
    setIsCreateModalOpen(true);
  };

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setSaveError('Le titre du sujet secret est obligatoire.');
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

    try {
      if (editingTopic) {
        await updateIntrusTopic(editingTopic.id, {
          title: formTitle.trim(),
          category: formCategory,
          icon: formIcon.trim() || '🕵️‍♂️',
          language: formLanguage,
          description: formDescription.trim(),
          isActive: formIsActive,
        });
      } else {
        await createIntrusTopic({
          title: formTitle.trim(),
          category: formCategory,
          icon: formIcon.trim() || '🕵️‍♂️',
          language: formLanguage,
          description: formDescription.trim(),
          isActive: formIsActive,
        });
      }
      setIsCreateModalOpen(false);
      setEditingTopic(null);
    } catch (err: any) {
      setSaveError(err.message || 'Erreur lors de la sauvegarde du sujet.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTopicId) return;
    if (!authReady) {
      alert('Session en cours de chargement, patientez une seconde puis réessayez.');
      return;
    }
    setIsSaving(true);
    try {
      await deleteIntrusTopic(deletingTopicId);
      setDeletingTopicId(null);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (topic: IntrusTopic) => {
    if (!authReady) {
      alert('Session en cours de chargement, patientez une seconde puis réessayez.');
      return;
    }
    try {
      await updateIntrusTopic(topic.id, { isActive: !topic.isActive });
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour.');
    }
  };

  // Filter topics
  const filteredTopics = intrusTopics.filter((t) => {
    if (selectedCategoryFilter !== 'all' && t.category !== selectedCategoryFilter) return false;
    if (selectedStatusFilter === 'active' && t.isActive === false) return false;
    if (selectedStatusFilter === 'disabled' && t.isActive !== false) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchCat = t.category.toLowerCase().includes(q);
      return matchTitle || matchCat;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-purple-500/20 px-4 py-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveView('admin')}
                className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 shrink-0"
              >
                <ArrowLeft size={14} />
                <span>Tableau de Bord</span>
              </button>
              <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/20 shrink-0">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-purple-400 via-indigo-200 to-white bg-clip-text text-transparent">
                  L'INTRUS ADMIN CMS
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Firebase Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 break-all">
                Connecté en tant que <span className="text-purple-300 font-medium">{firebaseUser?.email || 'Admin Authorized'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto">
            <button
              onClick={openCreateModal}
              className="flex-1 lg:flex-none flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Sujet</span>
            </button>

            <button
              onClick={adminLogout}
              className="flex items-center space-x-1.5 sm:space-x-2 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl font-bold text-xs sm:text-sm border border-rose-500/30 transition active:scale-95 shrink-0"
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-4">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Total Sujets</p>
              <p className="text-2xl font-black text-white">{totalTopics}</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Actifs</p>
              <p className="text-2xl font-black text-emerald-400">{activeCount}</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-4">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Désactivés</p>
              <p className="text-2xl font-black text-rose-400">{disabledCount}</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Catégories</p>
              <p className="text-2xl font-black text-amber-400">{INTRUS_TOPIC_CATEGORIES.length - 1}</p>
            </div>
          </div>
        </div>

        {/* Controls: Filters & Search */}
        <div className="bg-slate-900/80 border border-purple-500/20 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un sujet ou un mot secret..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Category Filter */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full sm:w-auto bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-500"
            >
              {INTRUS_TOPIC_CATEGORIES.map((cat, idx) => (
                <option key={`intrus-cat-${cat.id}-${idx}`} value={cat.id}>
                  {cat.labelFr}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full sm:w-auto bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-500"
            >
              <option value="all">Tous les Statuts</option>
              <option value="active">Actifs Uniquement</option>
              <option value="disabled">Désactivés Uniquement</option>
            </select>
          </div>
        </div>

        {/* Topics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map((topic, topicIdx) => {
            const catInfo = INTRUS_TOPIC_CATEGORIES.find((c) => c.id === topic.category);
            return (
              <motion.div
                key={`topic-${topic.id}-${topicIdx}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`relative bg-slate-900/90 border ${
                  topic.isActive === false
                    ? 'border-slate-800 opacity-60'
                    : 'border-purple-500/30 hover:border-purple-500/60'
                } rounded-2xl p-5 shadow-lg flex flex-col justify-between transition group`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-3xl">{topic.icon || '🕵️‍♂️'}</span>
                      <span className="px-2.5 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-bold rounded-lg">
                        {catInfo?.labelFr || topic.category}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleActive(topic)}
                      className={`p-1.5 rounded-lg border transition ${
                        topic.isActive !== false
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                      }`}
                      title={topic.isActive !== false ? 'Désactiver' : 'Activer'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-lg font-black text-white mb-1 group-hover:text-purple-300 transition">
                    {topic.title}
                  </h3>

                  {topic.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 mb-2">
                      {topic.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span className="uppercase font-mono text-[10px] text-slate-600">ID: {topic.id}</span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(topic)}
                      className="p-2 text-slate-300 hover:text-white bg-slate-800/60 hover:bg-purple-600 rounded-lg transition"
                      title="Modifier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeletingTopicId(topic.id)}
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

          {filteredTopics.length === 0 && (
            <div className="col-span-full py-16 bg-slate-900/40 border border-slate-800 rounded-2xl text-center">
              <FolderPlus className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-bold text-base">Aucun sujet trouvé</p>
              <p className="text-slate-600 text-xs mt-1">
                Ajustez vos filtres de recherche ou ajoutez un nouveau sujet secret pour L'INTRUS.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-slate-900 border border-purple-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">
                    {editingTopic ? 'Modifier le Sujet' : 'Nouveau Sujet L\'INTRUS'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Définissez le sujet secret donné aux joueurs normaux
                  </p>
                </div>
              </div>

              {saveError && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold">
                  {saveError}
                </div>
              )}

              <form onSubmit={handleSaveTopic} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Titre & Mot Secret *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ex: 🏖️ Plage (الشاطئ) ou 🥙 Lablebi (لبلابي)"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Catégorie
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition"
                    >
                      {INTRUS_TOPIC_CATEGORIES.filter((c) => c.id !== 'all').map((cat, idx) => (
                        <option key={`intrus-modal-cat-${cat.id}-${idx}`} value={cat.id}>
                          {cat.labelFr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Icône (Emoji)
                    </label>
                    <input
                      type="text"
                      value={formIcon}
                      onChange={(e) => setFormIcon(e.target.value)}
                      placeholder="🕵️‍♂️, 🏖️, ☕..."
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Description / Indice Optionnel
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Courte description ou notes de contextualisation..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-xs font-bold text-slate-300">Statut du sujet</span>
                  <button
                    type="button"
                    onClick={() => setFormIsActive(!formIsActive)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs border transition ${
                      formIsActive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {formIsActive ? 'ACTIF' : 'DÉSACTIVÉ'}
                  </button>
                </div>

                <div className="pt-4 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm transition"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-600/30 transition flex items-center space-x-2"
                  >
                    {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>{editingTopic ? 'Enregistrer' : 'Créer Sujet'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingTopicId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl p-6 text-center shadow-2xl"
            >
              <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-black text-white mb-2">Supprimer ce sujet ?</h3>
              <p className="text-xs text-slate-400 mb-6">
                Cette action retirera définitivement ce sujet secret de la base de données de L'INTRUS.
              </p>

              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => setDeletingTopicId(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm transition"
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
