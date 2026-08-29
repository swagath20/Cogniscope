import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  Sparkles, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  TrendingUp, 
  RotateCcw, 
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import PrimaryButton from './PrimaryButton';

const API_BASE = "http://127.0.0.1:8000/api";

export default function RetestModal({ conceptId, sessionId, onClose, onMasteryUpdated }) {
  const [loading, setLoading] = useState(true);
  const [retestQuestion, setRetestQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // 1. Fetch the dynamic verification question
  useEffect(() => {
    async function fetchRetest() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/retest/${conceptId}?session_id=${sessionId}`);
        if (!res.ok) throw new Error("Failed to generate dynamic retest challenge");
        const data = await res.json();
        setRetestQuestion(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRetest();
  }, [conceptId, sessionId]);

  // 2. Submit selected answer
  const handleSubmitAnswer = async () => {
    if (selectedOption === null || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`${API_BASE}/retest/${conceptId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          question_token: retestQuestion.question_token,
          selected_answer_index: selectedOption,
        }),
      });

      if (!res.ok) throw new Error("Failed to process answer evaluation");
      const data = await res.json();
      setResult(data);
      if (onMasteryUpdated) {
        onMasteryUpdated();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
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
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Verification Retest Challenge
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                {retestQuestion ? retestQuestion.concept_name : `Concept #${conceptId}`}
              </p>
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

          {/* Loading Question */}
          {loading && (
            <div className="py-16 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-10 h-10 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Synthesizing custom verification question...
                </p>
                <p className="text-xs font-mono text-slate-500 mt-1">
                  Targeted directly at your diagnosed misconception
                </p>
              </div>
            </div>
          )}

          {/* Question State */}
          {!loading && retestQuestion && !result && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                  Adaptive Verification Question
                </span>
                <p className="text-slate-100 text-sm sm:text-base font-medium leading-snug pt-1">
                  {retestQuestion.question_text}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {retestQuestion.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  return (
                    <motion.div
                      key={idx}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => !submitting && setSelectedOption(idx)}
                      className={`group relative p-4 rounded-xl border transition-all duration-150 cursor-pointer text-left flex items-start gap-3.5 ${
                        isSelected
                          ? "bg-amber-400/10 border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                          : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-semibold shrink-0 transition-colors ${
                          isSelected
                            ? "bg-amber-400 text-slate-950 font-bold"
                            : "bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-slate-200"
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </div>

                      <p className={`text-xs sm:text-sm leading-relaxed ${isSelected ? 'text-slate-100 font-medium' : 'text-slate-300'}`}>
                        {opt}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Result / Mastery Recovery State */}
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="py-4 space-y-6 text-center"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border ${
                result.is_correct 
                  ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.2)]'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}>
                {result.is_correct ? <CheckCircle2 className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-100">
                  {result.is_correct ? "Misconception Resolved!" : "Needs Further Review"}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {result.is_correct 
                    ? "Your response confirmed the targeted conceptual model is now solid."
                    : "The concept still requires reinforcement. You can review the explanation again."}
                </p>
              </div>

              {/* Live Mastery Recovery Card */}
              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 max-w-md mx-auto space-y-3 text-left">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Mastery Progression</span>
                  <span className="flex items-center gap-1 font-bold text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {result.previous_mastery}% → {result.new_mastery}%
                  </span>
                </div>

                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                    initial={{ width: `${result.previous_mastery}%` }}
                    animate={{ width: `${result.new_mastery}%` }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            {result ? "Close" : "Cancel"}
          </button>

          {!result && retestQuestion && (
            <PrimaryButton
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null || submitting}
              icon={ArrowRight}
            >
              {submitting ? "Grading..." : "Submit Answer"}
            </PrimaryButton>
          )}

          {result && (
            <PrimaryButton onClick={onClose} icon={CheckCircle2}>
              Return to Matrix
            </PrimaryButton>
          )}
        </div>
      </motion.div>
    </div>
  );
}