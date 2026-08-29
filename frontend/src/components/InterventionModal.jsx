import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, 
  Sparkles, 
  AlertTriangle, 
  Link2, 
  ArrowRight, 
  X, 
  RefreshCw, 
  Bot, 
  CheckCircle2, 
  Target
} from 'lucide-react';
import GlassCard from './GlassCard';
import PrimaryButton from './PrimaryButton';

const API_BASE = "http://127.0.0.1:8000/api";

export default function InterventionModal({ conceptId, sessionId, onClose, onStartRetest }) {
  const [stage, setStage] = useState('diagnosing'); // 'diagnosing' | 'misconception_ready' | 'generating_intervention' | 'intervention_ready'
  const [diagnosis, setDiagnosis] = useState(null);
  const [intervention, setIntervention] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMisconception() {
      try {
        setStage('diagnosing');
        const res = await fetch(`${API_BASE}/misconception/${conceptId}?session_id=${sessionId}`);
        if (!res.ok) throw new Error("Failed to extract misconception telemetry");
        const data = await res.json();
        setDiagnosis(data);
        setStage('misconception_ready');
      } catch (err) {
        setError(err.message);
      }
    }
    fetchMisconception();
  }, [conceptId, sessionId]);

  const handleFixIt = async () => {
    try {
      setError(null);
      setStage('generating_intervention');
      const res = await fetch(`${API_BASE}/intervention/${conceptId}?session_id=${sessionId}`);
      if (!res.ok) throw new Error("Failed to generate intervention guidance");
      const data = await res.json();
      setIntervention(data.explanation);
      setStage('intervention_ready');
    } catch (err) {
      setError(err.message);
      setStage('misconception_ready');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-2xl bg-[#0d101a] border border-slate-800 rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Cognitive Diagnostic Insight
              </h3>
              <p className="text-[11px] font-mono text-slate-400">Concept #{conceptId}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
              {error}
            </div>
          )}

          {/* Loading States */}
          {(stage === 'diagnosing' || stage === 'generating_intervention') && (
            <div className="py-16 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
                <Bot className="w-5 h-5 text-amber-400 absolute inset-0 m-auto" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">
                  {stage === 'diagnosing'
                    ? "Isolating underlying misconception patterns..."
                    : "Formulating targeted pedagogical remediation..."}
                </p>
                <p className="text-xs font-mono text-slate-500 mt-1">
                  Powered by Gemini Diagnostic Reasoner
                </p>
              </div>
            </div>
          )}

          {/* Diagnosis Block */}
          {diagnosis && (stage === 'misconception_ready' || stage === 'intervention_ready' || stage === 'generating_intervention') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-5 rounded-xl bg-amber-400/[0.04] border border-amber-400/25 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-medium uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Identified Knowledge Gap: {diagnosis.concept}</span>
                </div>
                <p className="text-slate-200 text-sm leading-relaxed font-normal">
                  {diagnosis.likely_misconception}
                </p>
              </div>

              {/* Prerequisite Anchor */}
              {diagnosis.prerequisite_gap && (
                <div className="flex items-center gap-3 p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                  <Link2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-slate-400">
                    Underlying Prerequisite Anchor:{" "}
                    <strong className="text-slate-200 font-semibold">{diagnosis.prerequisite_gap}</strong>
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* Tutor Explanation Card */}
          {intervention && stage === 'intervention_ready' && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
                <Bot className="w-4 h-4 text-emerald-400" />
                <span>Targeted Remediation Guidance</span>
              </div>

              <div className="relative p-6 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 leading-relaxed text-sm shadow-inner">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-amber-500 rounded-l-xl" />
                <p className="text-slate-200 text-[14.5px] leading-relaxed font-normal">
                  {intervention}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Dismiss
          </button>

          {stage === 'misconception_ready' && (
            <PrimaryButton onClick={handleFixIt} icon={Sparkles}>
              Let's Fix It
            </PrimaryButton>
          )}

          {stage === 'intervention_ready' && (
            <PrimaryButton 
              onClick={() => onStartRetest(conceptId)} 
              icon={Target}
            >
              Test Me Again
            </PrimaryButton>
          )}
        </div>
      </motion.div>
    </div>
  );
}