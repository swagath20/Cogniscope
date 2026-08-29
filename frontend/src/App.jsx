import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Sparkles, ArrowRight } from 'lucide-react';
import QuizView from './components/QuizView.jsx';
import ResultsView from './components/ResultsView.jsx';
import InterventionModal from './components/InterventionModal.jsx';
import RetestModal from './components/RetestModal.jsx';
import GlassCard from './components/GlassCard.jsx';
import PrimaryButton from './components/PrimaryButton.jsx';

export default function App() {
  const [viewState, setViewState] = useState('welcome'); // 'welcome' | 'quiz' | 'results'
  const [sessionId, setSessionId] = useState(() => `session_${Date.now()}`);
  const [activeInterventionConcept, setActiveInterventionConcept] = useState(null);
  const [activeRetestConcept, setActiveRetestConcept] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleStartQuiz = () => setViewState('quiz');
  
  const handleRetakeQuiz = () => {
    setSessionId(`session_${Date.now()}`);
    setViewState('quiz');
  };

  const handleOpenIntervention = (conceptId) => setActiveInterventionConcept(conceptId);
  const handleCloseIntervention = () => setActiveInterventionConcept(null);
  const handleStartRetest = (conceptId) => {
    setActiveInterventionConcept(null);
    setActiveRetestConcept(conceptId);
  };
  const handleCloseRetest = () => setActiveRetestConcept(null);
  const handleMasteryUpdated = () => setRefreshKey((k) => k + 1);

  return (
    <div className="relative min-h-screen flex flex-col justify-between p-6 sm:p-10 z-10 selection:bg-amber-400/20 selection:text-amber-300">
      {/* Background Lighting Elements */}
      <div className="grid-overlay" />
      <div className="ambient-blob-amber" />
      <div className="ambient-blob-indigo" />

      {/* Frosted Glass Header */}
      <header className="max-w-6xl mx-auto w-full z-10">
        <GlassCard className="px-6 py-4 flex items-center justify-between !rounded-2xl !bg-[#121520]/50 border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-900/90 border border-amber-500/30 flex items-center justify-center shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)]">
              <Cpu className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-heading font-bold text-slate-100 tracking-tight">Cogniscope</h2>
              <p className="text-[11px] font-mono text-slate-400 tracking-wider uppercase">Diagnostic Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399] animate-pulse" />
            <span className="text-slate-400">SESSION:</span>
            <span className="text-slate-200 font-medium">{sessionId.slice(0, 14)}</span>
          </div>
        </GlassCard>
      </header>

      {/* Main Workspace with Spring Motion Transitions */}
      <main className="max-w-6xl mx-auto w-full my-auto py-10 z-10">
        <AnimatePresence mode="wait">
          {viewState === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -16 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="max-w-2xl mx-auto text-center"
            >
              <GlassCard className="p-10 sm:p-14 space-y-8 !bg-[#121520]/55 border-slate-800/90">
                {/* Metric Badge */}
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-400 text-xs font-mono tracking-wide shadow-[0_0_20px_-5px_rgba(245,158,11,0.2)]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>10-Question Knowledge Diagnostic</span>
                </motion.div>

                {/* Hero Headline */}
                <h1 className="text-4xl sm:text-5xl font-heading font-bold text-slate-100 tracking-tight leading-[1.15]">
                  Machine Learning{' '}
                  <span className="text-amber-400 drop-shadow-[0_0_25px_rgba(245,158,11,0.4)]">
                    Concept Diagnostic
                  </span>
                </h1>

                {/* Body Text */}
                <p className="text-slate-400 text-[15px] sm:text-base leading-relaxed max-w-lg mx-auto font-normal">
                  Complete an adaptive assessment evaluating 5 foundational ML concepts. Our AI engine identifies latent misconceptions, traces prerequisite gaps, and delivers targeted remediation.
                </p>

                {/* CTA Action Button */}
                <div className="pt-2">
                  <PrimaryButton onClick={handleStartQuiz} icon={ArrowRight}>
                    Begin Diagnostic
                  </PrimaryButton>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {viewState === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -16 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
            >
              <QuizView
                sessionId={sessionId}
                onComplete={() => setViewState('results')}
              />
            </motion.div>
          )}

          {viewState === 'results' && (
            <motion.div
              key={`results_${refreshKey}`}
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -16 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
            >
              <ResultsView
                sessionId={sessionId}
                onRetakeQuiz={handleRetakeQuiz}
                onSelectConceptForIntervention={handleOpenIntervention}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Intervention Modal */}
      <AnimatePresence>
        {activeInterventionConcept && (
          <InterventionModal
            conceptId={activeInterventionConcept}
            sessionId={sessionId}
            onClose={handleCloseIntervention}
            onStartRetest={handleStartRetest}
          />
        )}
      </AnimatePresence>

      {/* Retest Verification Modal */}
      <AnimatePresence>
        {activeRetestConcept && (
          <RetestModal
            conceptId={activeRetestConcept}
            sessionId={sessionId}
            onClose={handleCloseRetest}
            onMasteryUpdated={handleMasteryUpdated}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center text-xs font-mono text-slate-400 gap-2 z-10">
        <span>COGNISCOPE_V2.0</span>
        <span className="text-slate-500">ADAPTIVE LEARNING ENGINE // MULTI-LLM CASCADE</span>
      </footer>
    </div>
  );
}