import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ReferenceLine,
} from 'recharts';
import {
  Brain,
  TrendingUp,
  Clock,
  Target,
  Zap,
  RotateCcw,
  Play,
  Award,
  Database,
  Download,
  ArrowLeft,
  ChevronRight,
  Shield,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Info,
  Sliders,
  Crown,
  Save,
  Sparkles,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  AiLogicLearningService,
  GameType,
  MatchHistoryEntry,
} from '../../services/aiLogicLearningService';

export const AiLearningAdminDashboard: React.FC = () => {
  const { setActiveView } = useApp();

  // Filters State
  const [selectedGameFilter, setSelectedGameFilter] = useState<'all' | 'belote' | 'uno' | 'chess'>('all');
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'winrate' | 'duration' | 'accuracy' | 'patterns' | 'calibration' | 'logs'>('overview');

  // Interactive Live Training / Action state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationToast, setSimulationToast] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load live data from service
  const trendData = useMemo(() => {
    const raw = AiLogicLearningService.getTimeSeriesTrendData(selectedGameFilter);
    if (selectedDifficultyFilter === 'all') return raw;
    return raw.filter((r) => r.difficulty === selectedDifficultyFilter);
  }, [selectedGameFilter, selectedDifficultyFilter, refreshKey]);

  const patternData = useMemo(() => {
    return AiLogicLearningService.getTacticalPatternBreakdown(selectedGameFilter);
  }, [selectedGameFilter, refreshKey]);

  const overviewStats = useMemo(() => {
    return AiLogicLearningService.getDashboardOverview(selectedGameFilter);
  }, [selectedGameFilter, refreshKey]);

  const matchLogs = useMemo(() => {
    const raw = AiLogicLearningService.getMatchHistory(selectedGameFilter);
    if (selectedDifficultyFilter === 'all') return raw;
    return raw.filter((r) => r.difficulty === selectedDifficultyFilter);
  }, [selectedGameFilter, selectedDifficultyFilter, refreshKey]);

  // Radar Data for Dynamic AI Parameter Calibration
  const beloteRadarData = useMemo(() => {
    const p = overviewStats.beloteParams;
    return [
      { metric: 'Bidding Aggression', value: Math.round(p.biddingAggressiveness * 65), fullMark: 100 },
      { metric: 'Trump Exhaustion', value: Math.round(p.trumpExhaustionUrgency * 60), fullMark: 100 },
      { metric: 'Partner Teamwork', value: Math.round(p.partnerCooperationWeight * 65), fullMark: 100 },
      { metric: 'Void Exploitation', value: Math.round(p.opponentVoidPunishFactor * 65), fullMark: 100 },
      { metric: 'Bluff Detection', value: Math.round(p.bluffDetectionIndex * 70), fullMark: 100 },
      { metric: 'Valet Preservation', value: Math.round(p.masterTrumpPreservation * 70), fullMark: 100 },
    ];
  }, [overviewStats]);

  const unoRadarData = useMemo(() => {
    const p = overviewStats.unoParams;
    return [
      { metric: 'Defensive Urgency', value: Math.round(p.defensiveUrgencyWeight * 50), fullMark: 100 },
      { metric: 'Color Denial', value: Math.round(p.colorDenialWeight * 60), fullMark: 100 },
      { metric: 'Wild Hoarding Counter', value: Math.round(p.wildHoardingThreshold * 65), fullMark: 100 },
      { metric: 'Human Targeting', value: Math.round(p.targetedAttackPriority * 60), fullMark: 100 },
      { metric: 'Reverse Direction Lock', value: Math.round(p.reverseRedirectionFactor * 65), fullMark: 100 },
    ];
  }, [overviewStats]);

  const chessRadarData = useMemo(() => {
    const p = overviewStats.chessParams;
    return [
      { metric: 'Center Control', value: Math.round((p.centerControlWeight / 2.0) * 100), fullMark: 100 },
      { metric: 'King Safety', value: Math.round((p.kingSafetyWeight / 2.0) * 100), fullMark: 100 },
      { metric: 'Piece Activity', value: Math.round((p.pieceActivityWeight / 2.0) * 100), fullMark: 100 },
      { metric: 'Blunder Punish', value: Math.round((p.blunderPunishmentAggression / 2.0) * 100), fullMark: 100 },
      { metric: 'Opening Book', value: Math.round((p.openingBookReliance / 2.0) * 100), fullMark: 100 },
      { metric: 'Endgame Technique', value: Math.round((p.endgameTechniqueAccuracy / 2.0) * 100), fullMark: 100 },
    ];
  }, [overviewStats]);

  // Handle Simulation of a Training Match
  const handleSimulateMatch = async (gameType: GameType) => {
    setIsSimulating(true);
    setSimulationToast(`Simulating ${gameType.toUpperCase()} strategic match...`);

    setTimeout(() => {
      const match = AiLogicLearningService.simulateLiveTrainingMatch(gameType);
      setRefreshKey((prev) => prev + 1);
      setIsSimulating(false);
      setSimulationToast(
        `✓ ${gameType.toUpperCase()} match processed! AI ${match.aiWon ? 'Won' : 'Lost'} | Accuracy: ${match.accuracyScore}% | Duration: ${match.durationSeconds}s`
      );

      setTimeout(() => setSimulationToast(null), 4000);
    }, 600);
  };

  // Handle Reset of Learning Data
  const handleResetData = () => {
    if (window.confirm('Reset all AI Learning data to blank initial state?')) {
      AiLogicLearningService.resetAllLearningData();
      setRefreshKey((prev) => prev + 1);
      setSimulationToast('AI learning profile successfully reset.');
      setTimeout(() => setSimulationToast(null), 3000);
    }
  };

  // Handle Re-seed of Benchmark Data
  const handleSeedData = () => {
    AiLogicLearningService.seedBenchmarkData(true);
    setRefreshKey((prev) => prev + 1);
    setSimulationToast('Benchmark training dataset loaded successfully.');
    setTimeout(() => setSimulationToast(null), 3000);
  };

  // Export AI Profile JSON
  const handleExportProfile = () => {
    const data = {
      timestamp: new Date().toISOString(),
      belote: AiLogicLearningService.getBeloteProfile(),
      uno: AiLogicLearningService.getUnoProfile(),
      chess: AiLogicLearningService.getChessProfile(),
      history: AiLogicLearningService.getMatchHistory(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rakcha-ai-learning-profile-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-28 pt-2 px-3 sm:px-4 text-left max-w-6xl mx-auto select-none"
      id="ai-admin-dashboard-container"
    >
      {/* 1. Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#989277]/25 dark:border-[#B8B5A5]/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => setActiveView('admin')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FF8600]/10 hover:bg-[#FF8600]/20 text-[#FF8600] border border-[#FF8600]/30 text-xs font-mono font-bold uppercase transition"
              id="ai-dash-back-btn"
            >
              <ArrowLeft size={12} />
              <span>Admin Portal</span>
            </button>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-widest border border-emerald-500/30 flex items-center gap-1">
              <Brain size={11} /> ADAPTIVE AI ENGINE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-mono font-bold text-[#040403] dark:text-[#F8F7E8] uppercase tracking-wide">
            AI LEARNING & HEURISTICS ANALYTICS
          </h1>
          <p className="text-xs font-mono text-[#989277] dark:text-[#B8B5A5] mt-0.5">
            Real-time tracking of win-rate trends, game duration metrics, and decision accuracy progression across Belote, Uno & Chess.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Simulate Belote */}
          <button
            onClick={() => handleSimulateMatch('belote')}
            disabled={isSimulating}
            className="px-3 py-2 rounded-xl bg-[#FF8600] hover:bg-[#FF8600]/90 text-white font-mono text-xs font-bold uppercase flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
            id="ai-dash-sim-belote-btn"
            title="Simulate 1 training match of Belote"
          >
            <Zap size={13} className={isSimulating ? 'animate-bounce' : ''} />
            <span>+ Sim Belote</span>
          </button>

          {/* Simulate Uno */}
          <button
            onClick={() => handleSimulateMatch('uno')}
            disabled={isSimulating}
            className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold uppercase flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
            id="ai-dash-sim-uno-btn"
            title="Simulate 1 training match of Uno"
          >
            <Zap size={13} className={isSimulating ? 'animate-bounce' : ''} />
            <span>+ Sim Uno</span>
          </button>

          {/* Simulate Chess */}
          <button
            onClick={() => handleSimulateMatch('chess')}
            disabled={isSimulating}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
            id="ai-dash-sim-chess-btn"
            title="Simulate 1 training match of Chess"
          >
            <Zap size={13} className={isSimulating ? 'animate-bounce' : ''} />
            <span>+ Sim Chess</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportProfile}
            className="p-2 rounded-xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 text-[#040403] dark:text-[#F8F7E8] hover:border-[#FF8600] transition"
            id="ai-dash-export-btn"
            title="Export AI Learning Profile JSON"
          >
            <Download size={15} />
          </button>

          {/* Seed Benchmark */}
          <button
            onClick={handleSeedData}
            className="p-2 rounded-xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 text-[#040403] dark:text-[#F8F7E8] hover:border-emerald-500 transition"
            id="ai-dash-seed-btn"
            title="Reload Benchmark Historical Dataset"
          >
            <Database size={15} className="text-emerald-500" />
          </button>

          {/* Reset */}
          <button
            onClick={handleResetData}
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 transition"
            id="ai-dash-reset-btn"
            title="Reset AI Training Data"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* Simulation Feedback Notification Toast */}
      <AnimatePresence>
        {simulationToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-2xl bg-[#040403] dark:bg-[#1B1B18] text-[#F8F7E8] border border-[#FF8600] text-xs font-mono flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-[#FF8600] animate-pulse" />
              <span>{simulationToast}</span>
            </div>
            <button onClick={() => setSimulationToast(null)} className="text-[#989277] hover:text-white text-xs">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Top Filter Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 shadow-xs">
        {/* Game Type Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold text-[#989277] uppercase mr-1">Game Scope:</span>
          {(['all', 'belote', 'uno', 'chess'] as const).map((game) => (
            <button
              key={`game-filter-${game}`}
              onClick={() => setSelectedGameFilter(game)}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase transition ${
                selectedGameFilter === game
                  ? game === 'belote'
                    ? 'bg-[#FF8600] text-white shadow-xs'
                    : game === 'uno'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : game === 'chess'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#040403] dark:bg-[#F8F7E8] text-[#F8F7E8] dark:text-[#040403]'
                  : 'bg-[#040403]/5 dark:bg-[#F8F7E8]/5 text-[#989277] hover:bg-[#040403]/10'
              }`}
              id={`filter-game-${game}`}
            >
              {game === 'all' ? 'All Games' : game === 'belote' ? 'Belote' : game === 'uno' ? 'Uno' : 'Chess ♟️'}
            </button>
          ))}
        </div>

        {/* Difficulty Filter & Sample Size */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#040403]/5 dark:bg-[#F8F7E8]/5 px-3 py-1 rounded-xl border border-[#989277]/20 text-[10px] font-mono text-[#040403] dark:text-[#F8F7E8]">
            <span className="text-[#989277] uppercase font-bold">Difficulty:</span>
            <select
              value={selectedDifficultyFilter}
              onChange={(e) => setSelectedDifficultyFilter(e.target.value as any)}
              className="bg-transparent font-mono text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">ALL LEVELS</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <span className="text-[10px] font-mono text-[#989277] px-2 py-1 rounded-lg bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/20">
            {matchLogs.length} Samples
          </span>
        </div>
      </div>

      {/* 3. 4 Core KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: AI Win Rate */}
        <div
          className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 space-y-2 shadow-xs relative overflow-hidden"
          id="kpi-win-rate"
        >
          <div className="flex items-center justify-between text-[#989277]">
            <span className="text-[10px] font-mono font-bold uppercase">AI Win Rate</span>
            <TrendingUp size={16} className="text-[#FF8600]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-[#040403] dark:text-[#F8F7E8]">
              {overviewStats.overallAiWinRate}%
            </span>
            <span className="text-[10px] font-mono text-emerald-500 font-bold">
              +{Math.min(18, Math.round(overviewStats.overallAiWinRate * 0.2))}% Adaptation
            </span>
          </div>
          <div className="w-full bg-[#040403]/10 dark:bg-[#F8F7E8]/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-[#FF8600] h-full transition-all duration-500"
              style={{ width: `${overviewStats.overallAiWinRate}%` }}
            />
          </div>
          <p className="text-[10px] font-mono text-[#989277]">
            AI Wins: {overviewStats.aiWins} / {overviewStats.totalMatches} Matches
          </p>
        </div>

        {/* KPI 2: Average Game Duration */}
        <div
          className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 space-y-2 shadow-xs"
          id="kpi-duration"
        >
          <div className="flex items-center justify-between text-[#989277]">
            <span className="text-[10px] font-mono font-bold uppercase">Avg Game Duration</span>
            <Clock size={16} className="text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-blue-600 dark:text-blue-400">
              {overviewStats.avgDurationMinutes}m
            </span>
            <span className="text-[10px] font-mono text-[#989277]">
              ({overviewStats.avgDurationSeconds}s)
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#989277]">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
            <span>Optimal Strategic Pace</span>
          </div>
          <p className="text-[10px] font-mono text-[#989277]">
            Tactical Turn Execution: ~1.2s
          </p>
        </div>

        {/* KPI 3: Decision Accuracy Score */}
        <div
          className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 space-y-2 shadow-xs"
          id="kpi-accuracy"
        >
          <div className="flex items-center justify-between text-[#989277]">
            <span className="text-[10px] font-mono font-bold uppercase">Decision Accuracy</span>
            <Target size={16} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {overviewStats.avgAccuracy}%
            </span>
            <span className="text-[10px] font-mono text-emerald-500 font-bold">
              +{overviewStats.accuracyImprovementDelta}% Growth
            </span>
          </div>
          <div className="w-full bg-[#040403]/10 dark:bg-[#F8F7E8]/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${overviewStats.avgAccuracy}%` }}
            />
          </div>
          <p className="text-[10px] font-mono text-[#989277]">
            Heuristics Precision Tier: Master
          </p>
        </div>

        {/* KPI 4: Player Threat / Archetype */}
        <div
          className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 space-y-2 shadow-xs"
          id="kpi-archetype"
        >
          <div className="flex items-center justify-between text-[#989277]">
            <span className="text-[10px] font-mono font-bold uppercase">Opponent Archetype</span>
            <Award size={16} className="text-purple-500" />
          </div>
          <div>
            <p className="text-sm sm:text-base font-mono font-bold text-purple-600 dark:text-purple-400 truncate">
              {selectedGameFilter === 'uno'
                ? overviewStats.unoArchetype
                : selectedGameFilter === 'chess'
                ? overviewStats.chessArchetype
                : overviewStats.beloteArchetype}
            </p>
            <p className="text-[10px] font-mono text-[#989277] mt-0.5">
              {selectedGameFilter === 'uno'
                ? 'Wild Hoarding Threat'
                : selectedGameFilter === 'chess'
                ? 'Opening & Tactical Defense'
                : 'Hokm Contract Aggression'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 font-mono text-[9px] font-bold uppercase">
              Adaptive Counter Active
            </span>
          </div>
        </div>
      </div>

      {/* 4. Navigation Subtabs */}
      <div className="flex items-center gap-1 border-b border-[#989277]/20 dark:border-[#B8B5A5]/15 overflow-x-auto scrollbar-none pb-1">
        {[
          { id: 'overview', label: 'All Visualizers', icon: Activity },
          { id: 'winrate', label: 'Win-Rate Trends', icon: TrendingUp },
          { id: 'duration', label: 'Game Duration', icon: Clock },
          { id: 'accuracy', label: 'Decision Accuracy', icon: Target },
          { id: 'patterns', label: 'Tactical Patterns', icon: Layers },
          { id: 'calibration', label: 'Live AI Calibration', icon: Sliders },
          { id: 'logs', label: 'Match History Logs', icon: CheckCircle2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={`dash-subtab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#FF8600] text-white shadow-xs'
                  : 'text-[#989277] dark:text-[#B8B5A5] hover:text-[#040403] dark:hover:text-[#F8F7E8] hover:bg-[#040403]/5'
              }`}
              id={`dash-tab-${tab.id}`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 5. VISUALIZATION CHARTS SECTION */}

      {/* TAB A: OVERVIEW OR WIN-RATE CHART */}
      {(activeTab === 'overview' || activeTab === 'winrate') && (
        <div
          className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 shadow-md space-y-4"
          id="chart-winrate-section"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#FF8600]/15 text-[#FF8600]">
                  <TrendingUp size={16} />
                </span>
                <h3 className="text-base font-mono font-bold text-[#040403] dark:text-[#F8F7E8] uppercase">
                  AI vs Human Win-Rate Progression Trend
                </h3>
              </div>
              <p className="text-xs font-mono text-[#989277] mt-0.5">
                Displays chronological win-rate convergence as the adaptive algorithm models the player's strategy.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-[#FF8600]">
                <span className="w-3 h-3 rounded-sm bg-[#FF8600]" /> AI Win Rate (%)
              </span>
              <span className="flex items-center gap-1.5 text-[#989277]">
                <span className="w-3 h-3 rounded-sm bg-[#989277]" /> Human Win Rate (%)
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="aiWinGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF8600" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FF8600" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="humanWinGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#989277" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#989277" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="matchLabel" tick={{ fontSize: 11, fill: '#989277' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#989277' }} unit="%" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-[#040403] text-[#F8F7E8] border border-[#FF8600] text-xs font-mono space-y-1 shadow-xl">
                          <p className="font-bold text-[#FF8600] uppercase">
                            Match #{data.matchNumber} ({data.gameType.toUpperCase()})
                          </p>
                          <p>AI Cumulative Win Rate: <span className="text-[#FF8600] font-bold">{data.aiWinRate}%</span></p>
                          <p>Human Win Rate: <span className="text-[#989277]">{data.playerWinRate}%</span></p>
                          <p>Winner: <span className={data.aiWon ? 'text-emerald-400' : 'text-amber-400'}>{data.aiWon ? 'AI Victory' : 'Human Victory'}</span></p>
                          <p className="text-[10px] text-[#989277]">Difficulty: {data.difficulty}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={50} stroke="#989277" strokeDasharray="4 4" label={{ value: '50% Parity', fill: '#989277', fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="aiWinRate"
                  stroke="#FF8600"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#aiWinGrad)"
                  name="AI Win Rate"
                />
                <Area
                  type="monotone"
                  dataKey="playerWinRate"
                  stroke="#989277"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  fillOpacity={1}
                  fill="url(#humanWinGrad)"
                  name="Player Win Rate"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB B: GAME DURATION & ACCURACY COMBO */}
      {(activeTab === 'overview' || activeTab === 'duration' || activeTab === 'accuracy') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 2: Average Game Duration */}
          {(activeTab === 'overview' || activeTab === 'duration') && (
            <div
              className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 shadow-md space-y-4"
              id="chart-duration-section"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-500/15 text-blue-500">
                    <Clock size={16} />
                  </span>
                  <div>
                    <h3 className="text-base font-mono font-bold text-[#040403] dark:text-[#F8F7E8] uppercase">
                      Game Duration Trend (Minutes)
                    </h3>
                    <p className="text-[10px] font-mono text-[#989277]">
                      Match length tracking vs calculated baseline speed
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="matchLabel" tick={{ fontSize: 10, fill: '#989277' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#989277' }} unit="m" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="p-2.5 rounded-xl bg-[#040403] text-[#F8F7E8] border border-blue-500 text-xs font-mono space-y-0.5">
                              <p className="font-bold text-blue-400">Match #{d.matchNumber} ({d.gameType})</p>
                              <p>Duration: <span className="font-bold">{d.durationMinutes} min</span> ({d.durationSeconds}s)</p>
                              <p className="text-[10px] text-[#989277]">Recorded: {d.formattedTime}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine y={4.0} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'Target 4m Pace', fill: '#3b82f6', fontSize: 9 }} />
                    <Bar dataKey="durationMinutes" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Duration" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chart 3: Decision Accuracy Improvements */}
          {(activeTab === 'overview' || activeTab === 'accuracy') && (
            <div
              className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 shadow-md space-y-4"
              id="chart-accuracy-section"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-500">
                    <Target size={16} />
                  </span>
                  <div>
                    <h3 className="text-base font-mono font-bold text-[#040403] dark:text-[#F8F7E8] uppercase">
                      Decision-Making Accuracy Progression
                    </h3>
                    <p className="text-[10px] font-mono text-[#989277]">
                      AI heuristic precision and pattern counter effectiveness (%)
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="matchLabel" tick={{ fontSize: 10, fill: '#989277' }} />
                    <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: '#989277' }} unit="%" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="p-2.5 rounded-xl bg-[#040403] text-[#F8F7E8] border border-emerald-500 text-xs font-mono space-y-0.5">
                              <p className="font-bold text-emerald-400">Match #{d.matchNumber}</p>
                              <p>Accuracy Score: <span className="font-bold text-emerald-400">{d.accuracyScore}%</span></p>
                              <p>Rolling Avg: <span className="font-bold">{d.movingAvgAccuracy}%</span></p>
                              {d.keyPatterns && d.keyPatterns.length > 0 && (
                                <p className="text-[10px] text-[#989277]">Key Patterns: {d.keyPatterns.join(', ')}</p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracyScore"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#10b981' }}
                      name="Match Accuracy"
                    />
                    <Line
                      type="monotone"
                      dataKey="movingAvgAccuracy"
                      stroke="#059669"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                      name="Rolling Avg"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB C: TACTICAL PATTERNS & RADAR CALIBRATION */}
      {(activeTab === 'overview' || activeTab === 'patterns') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" id="patterns-section">
          {/* Tactical Pattern Success Rates */}
          <div className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 shadow-md space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-500/15 text-purple-500">
                <Layers size={16} />
              </span>
              <div>
                <h3 className="text-base font-mono font-bold text-[#040403] dark:text-[#F8F7E8] uppercase">
                  Observed Tactical Patterns & Efficiency
                </h3>
                <p className="text-[10px] font-mono text-[#989277]">
                  Micro-play heuristic success rate across match instances
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {patternData.length === 0 ? (
                <p className="text-xs font-mono text-[#989277] py-6 text-center">
                  No tactical pattern instances recorded yet. Play or simulate matches to observe patterns.
                </p>
              ) : (
                patternData.map((pat, idx) => (
                  <div
                    key={`pat-row-${pat.name}-${idx}`}
                    className="p-3 rounded-2xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/20 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[9px] uppercase ${
                            pat.gameType === 'belote'
                              ? 'bg-[#FF8600]/15 text-[#FF8600]'
                              : pat.gameType === 'uno'
                              ? 'bg-purple-500/15 text-purple-500'
                              : 'bg-emerald-500/15 text-emerald-500'
                          }`}
                        >
                          {pat.gameType}
                        </span>
                        <span className="text-[#040403] dark:text-[#F8F7E8]">{pat.name}</span>
                      </div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {pat.successRate}% Success
                      </span>
                    </div>

                    <div className="w-full bg-[#040403]/10 dark:bg-[#F8F7E8]/10 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pat.successRate}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-[#989277]">
                      <span>Category: {pat.category}</span>
                      <span>{pat.attempts} Observations</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Dynamic AI Tuning Strategy Radar */}
          <div className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 shadow-md space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500">
                <Flame size={16} />
              </span>
              <div>
                <h3 className="text-base font-mono font-bold text-[#040403] dark:text-[#F8F7E8] uppercase">
                  Dynamic Strategy Parameter Radar
                </h3>
                <p className="text-[10px] font-mono text-[#989277]">
                  Real-time heuristic weights tuned against current human opponent
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  outerRadius={85}
                  data={
                    selectedGameFilter === 'uno'
                      ? unoRadarData
                      : selectedGameFilter === 'chess'
                      ? chessRadarData
                      : beloteRadarData
                  }
                >
                  <PolarGrid stroke="#989277" opacity={0.25} />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fontSize: 10, fill: '#989277', fontWeight: 600 }}
                  />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="AI Tuning Weight"
                    dataKey="value"
                    stroke={selectedGameFilter === 'chess' ? '#10b981' : selectedGameFilter === 'uno' ? '#a855f7' : '#FF8600'}
                    fill={selectedGameFilter === 'chess' ? '#10b981' : selectedGameFilter === 'uno' ? '#a855f7' : '#FF8600'}
                    fillOpacity={0.35}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="p-2 rounded-xl bg-[#040403] text-[#F8F7E8] border border-[#FF8600] text-xs font-mono">
                            <p className="text-[#FF8600] font-bold">{d.metric}</p>
                            <p>Tuned Weight: <span className="font-bold">{d.value}/100</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Strategy Readout */}
            <div className="p-3 rounded-2xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/20 text-[11px] font-mono text-[#040403] dark:text-[#F8F7E8] space-y-1">
              <p className="font-bold text-[#FF8600] uppercase">
                Active Tactical Profile:
              </p>
              {selectedGameFilter === 'uno' ? (
                <p className="text-xs text-[#989277] leading-relaxed">
                  Defensive Urgency at <span className="text-[#040403] dark:text-[#F8F7E8] font-bold">{overviewStats.unoParams.defensiveUrgencyWeight.toFixed(2)}x</span>. Preempting human wild play with <span className="text-[#040403] dark:text-[#F8F7E8] font-bold">{overviewStats.unoParams.predictedPlayerWildChoice?.toUpperCase() || 'RED'}</span> denial.
                </p>
              ) : selectedGameFilter === 'chess' ? (
                <p className="text-xs text-[#989277] leading-relaxed">
                  Center Control at <span className="text-[#040403] dark:text-[#F8F7E8] font-bold">{overviewStats.chessParams.centerControlWeight.toFixed(2)}x</span>. Blunder punishment set to <span className="text-[#040403] dark:text-[#F8F7E8] font-bold">{overviewStats.chessParams.blunderPunishmentAggression.toFixed(2)}x</span> against <span className="text-[#040403] dark:text-[#F8F7E8] font-bold">{(overviewStats.chessParams.primaryVulnerability || 'HANGING PIECES').toUpperCase()}</span>.
                </p>
              ) : (
                <p className="text-xs text-[#989277] leading-relaxed">
                  Bidding Aggression at <span className="text-[#040403] dark:text-[#F8F7E8] font-bold">{overviewStats.beloteParams.biddingAggressiveness.toFixed(2)}x</span>. Partner cooperation weight scaled to <span className="text-[#040403] dark:text-[#F8F7E8] font-bold">{overviewStats.beloteParams.partnerCooperationWeight.toFixed(2)}x</span>.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB E: LIVE AI PARAMETER CALIBRATION CONTROL PANEL */}
      {(activeTab === 'calibration' || activeTab === 'overview') && (
        <div className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 shadow-md space-y-5" id="live-ai-calibration-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#989277]/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-500">
                <Sliders size={18} />
              </span>
              <div>
                <h3 className="text-base font-mono font-bold text-[#040403] dark:text-[#F8F7E8] uppercase">
                  Contrôle & Calibrage En Direct des Paramètres IA (Live AI Tuning)
                </h3>
                <p className="text-xs font-mono text-[#989277]">
                  Ajuster manuellement les coefficients d'agressivité et de tactique de l'algorithme adaptatif en temps réel.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Belote AI Sliders */}
            <div className="p-4 rounded-2xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#FF8600]/30 space-y-3">
              <div className="flex items-center justify-between border-b border-[#989277]/20 pb-2">
                <span className="text-xs font-mono font-bold text-[#FF8600] uppercase">Belote Strategy Tuning</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF8600]/15 text-[#FF8600]">CARD AI</span>
              </div>

              {/* Slider 1: Bidding Aggression */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[#989277]">Bidding Aggression</span>
                  <span className="font-bold text-[#040403] dark:text-[#F8F7E8]">{overviewStats.beloteParams.biddingAggressiveness.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={overviewStats.beloteParams.biddingAggressiveness}
                  onChange={(e) => {
                    AiLogicLearningService.updateBeloteStrategyParams({ biddingAggressiveness: parseFloat(e.target.value) });
                    setRefreshKey((prev) => prev + 1);
                  }}
                  className="w-full accent-[#FF8600] cursor-pointer"
                />
              </div>

              {/* Slider 2: Trump Exhaustion Urgency */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[#989277]">Trump Drain Urgency</span>
                  <span className="font-bold text-[#040403] dark:text-[#F8F7E8]">{overviewStats.beloteParams.trumpExhaustionUrgency.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={overviewStats.beloteParams.trumpExhaustionUrgency}
                  onChange={(e) => {
                    AiLogicLearningService.updateBeloteStrategyParams({ trumpExhaustionUrgency: parseFloat(e.target.value) });
                    setRefreshKey((prev) => prev + 1);
                  }}
                  className="w-full accent-[#FF8600] cursor-pointer"
                />
              </div>

              {/* Slider 3: Partner Cooperation Weight */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[#989277]">Partner Cooperation</span>
                  <span className="font-bold text-[#040403] dark:text-[#F8F7E8]">{overviewStats.beloteParams.partnerCooperationWeight.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={overviewStats.beloteParams.partnerCooperationWeight}
                  onChange={(e) => {
                    AiLogicLearningService.updateBeloteStrategyParams({ partnerCooperationWeight: parseFloat(e.target.value) });
                    setRefreshKey((prev) => prev + 1);
                  }}
                  className="w-full accent-[#FF8600] cursor-pointer"
                />
              </div>
            </div>

            {/* 2. Uno AI Sliders */}
            <div className="p-4 rounded-2xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-[#989277]/20 pb-2">
                <span className="text-xs font-mono font-bold text-purple-500 uppercase">Uno Strategy Tuning</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-500">ACTION AI</span>
              </div>

              {/* Slider 1: Defensive Urgency */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[#989277]">Defensive Urgency</span>
                  <span className="font-bold text-[#040403] dark:text-[#F8F7E8]">{overviewStats.unoParams.defensiveUrgencyWeight.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={overviewStats.unoParams.defensiveUrgencyWeight}
                  onChange={(e) => {
                    AiLogicLearningService.updateUnoStrategyParams({ defensiveUrgencyWeight: parseFloat(e.target.value) });
                    setRefreshKey((prev) => prev + 1);
                  }}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              {/* Slider 2: Color Denial Weight */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[#989277]">Color Monopoly Denial</span>
                  <span className="font-bold text-[#040403] dark:text-[#F8F7E8]">{overviewStats.unoParams.colorDenialWeight.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={overviewStats.unoParams.colorDenialWeight}
                  onChange={(e) => {
                    AiLogicLearningService.updateUnoStrategyParams({ colorDenialWeight: parseFloat(e.target.value) });
                    setRefreshKey((prev) => prev + 1);
                  }}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              {/* Slider 3: Wild Hoarding Counter */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[#989277]">Wild Hoarding Counter</span>
                  <span className="font-bold text-[#040403] dark:text-[#F8F7E8]">{overviewStats.unoParams.wildHoardingThreshold.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={overviewStats.unoParams.wildHoardingThreshold}
                  onChange={(e) => {
                    AiLogicLearningService.updateUnoStrategyParams({ wildHoardingThreshold: parseFloat(e.target.value) });
                    setRefreshKey((prev) => prev + 1);
                  }}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
            </div>

            {/* 3. Chess AI Sliders */}
            <div className="p-4 rounded-2xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-[#989277]/20 pb-2">
                <span className="text-xs font-mono font-bold text-emerald-500 uppercase">Chess Strategy Tuning</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500">CHESS ENGINE</span>
              </div>

              {/* Slider 1: Center Control */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[#989277]">Center Control Weight</span>
                  <span className="font-bold text-[#040403] dark:text-[#F8F7E8]">{overviewStats.chessParams.centerControlWeight.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={overviewStats.chessParams.centerControlWeight}
                  onChange={(e) => {
                    AiLogicLearningService.updateChessStrategyParams({ centerControlWeight: parseFloat(e.target.value) });
                    setRefreshKey((prev) => prev + 1);
                  }}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Slider 2: King Safety */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[#989277]">King Safety & Castling</span>
                  <span className="font-bold text-[#040403] dark:text-[#F8F7E8]">{overviewStats.chessParams.kingSafetyWeight.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={overviewStats.chessParams.kingSafetyWeight}
                  onChange={(e) => {
                    AiLogicLearningService.updateChessStrategyParams({ kingSafetyWeight: parseFloat(e.target.value) });
                    setRefreshKey((prev) => prev + 1);
                  }}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Slider 3: Blunder Punishment */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[#989277]">Blunder Punishment</span>
                  <span className="font-bold text-[#040403] dark:text-[#F8F7E8]">{overviewStats.chessParams.blunderPunishmentAggression.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={overviewStats.chessParams.blunderPunishmentAggression}
                  onChange={(e) => {
                    AiLogicLearningService.updateChessStrategyParams({ blunderPunishmentAggression: parseFloat(e.target.value) });
                    setRefreshKey((prev) => prev + 1);
                  }}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB F: RECENT MATCH HISTORY LOGS TABLE */}
      {(activeTab === 'overview' || activeTab === 'logs') && (
        <div
          className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-[#989277]/30 dark:border-[#B8B5A5]/20 shadow-md space-y-4"
          id="match-history-logs-section"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500">
                <CheckCircle2 size={16} />
              </span>
              <div>
                <h3 className="text-base font-mono font-bold text-[#040403] dark:text-[#F8F7E8] uppercase">
                  Chronological Match & Learning Logs Stream
                </h3>
                <p className="text-[10px] font-mono text-[#989277]">
                  Raw telemetry feed from single-player matches and AI bot evaluations
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-[#989277]">
              Showing last {matchLogs.length} matches
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-[#989277]/20 text-[#989277] uppercase text-[10px]">
                  <th className="py-2.5 px-3">Game</th>
                  <th className="py-2.5 px-3">Outcome</th>
                  <th className="py-2.5 px-3">Difficulty</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Accuracy</th>
                  <th className="py-2.5 px-3">Observed Tactics</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#989277]/10">
                {matchLogs.map((entry, index) => {
                  const formattedTime = new Date(entry.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <tr
                      key={`log-row-${entry.id}-${index}`}
                      className="hover:bg-[#040403]/5 dark:hover:bg-[#F8F7E8]/5 transition"
                    >
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            entry.gameType === 'belote'
                              ? 'bg-[#FF8600]/15 text-[#FF8600]'
                              : entry.gameType === 'uno'
                              ? 'bg-purple-500/15 text-purple-500'
                              : 'bg-emerald-500/15 text-emerald-500'
                          }`}
                        >
                          {entry.gameType}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            entry.aiWon
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {entry.aiWon ? 'AI Victory' : 'Player Victory'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#989277] uppercase">{entry.difficulty}</td>
                      <td className="py-3 px-3 text-[#040403] dark:text-[#F8F7E8] font-bold">
                        {(entry.durationSeconds / 60).toFixed(1)}m ({entry.durationSeconds}s)
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-emerald-500">{entry.accuracyScore}%</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {entry.keyPatternsObserved?.map((pat, pidx) => (
                            <span
                              key={`log-pat-${pidx}`}
                              className="px-1.5 py-0.5 rounded bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/20 text-[9px] text-[#989277]"
                            >
                              {pat}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#989277] text-[10px] whitespace-nowrap">
                        {formattedTime}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};
