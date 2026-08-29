import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, CheckCircle2, RefreshCw, AlertCircle, Award } from 'lucide-react';
import GlassCard from './GlassCard';
import PrimaryButton from './PrimaryButton';

const API_BASE = "http://127.0.0.1:8000/api";

export default function QuizView({ sessionId, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // 1. Fetch questions on mount
  useEffect(() => {
    async function fetchQuestions() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/quiz`);
        if (!res.ok) throw new Error("Failed to load quiz items");
        const data = await res.json();
        setQuestions(data.questions || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  // 2. Handle option submission
  const handleSelectOption = (idx) => {
    if (isSubmitting) return;
    setSelectedOption(idx);
  };

  const handleNext = async () => {
    if (selectedOption === null || isSubmitting) return;

    const currentQuestion = questions[currentIndex];
    setIsSubmitting(true);

    try {
      // Submit answer to backend
      await fetch(`${API_BASE}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonBody(sessionId, currentQuestion.id, selectedOption),
      });

      // Advance question or complete
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedOption(null);
      } else {
        setIsCompleted(true);
      }
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  function jsonBody(sId, qId, ansIdx) {
    return JSON.stringify({
      session_id: sId,
      question_id: qId,
      selected_answer_index: ansIdx,
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">
          Loading Diagnostic Questions...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <GlassCard className="max-w-lg mx-auto text-center py-8 space-y-4 border-rose-500/30">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-base font-semibold text-slate-100">Connection Error</h3>
        <p className="text-slate-400 text-xs font-mono">{error}</p>
        <PrimaryButton onClick={() => window.location.reload()}>Retry</PrimaryButton>
      </GlassCard>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex) / questions.length) * 100);

  // 3. Completion Screen
  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-xl mx-auto py-12"
      >
        <GlassCard className="text-center p-8 sm:p-10 space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Award className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
              Diagnostic Assessment Complete
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
              Telemetry recorded across 5 core machine learning concepts. Your personalized knowledge model is ready for inspection.
            </p>
          </div>

          <div className="pt-2">
            <PrimaryButton onClick={onComplete} icon={ArrowRight} className="w-full sm:w-auto">
              See My Results
            </PrimaryButton>
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6">
      {/* Top Header & Smooth Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Concept: <strong className="text-slate-200 font-semibold">{currentQ.concept_name}</strong>
          </span>
          <span className="text-slate-300">
            Question <span className="text-amber-400 font-bold">{currentIndex + 1}</span> of {questions.length}
          </span>
        </div>

        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80">
          <motion.div
            className="h-full bg-amber-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Animated Question & Options Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <GlassCard className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
                Difficulty: {currentQ.difficulty}
              </span>
              <span className="text-[11px] font-mono text-slate-500">ID #{currentQ.id}</span>
            </div>

            <h3 className="text-lg sm:text-xl font-semibold text-slate-100 leading-snug">
              {currentQ.question_text}
            </h3>
          </GlassCard>

          {/* Options Grid */}
          <div className="space-y-3">
            {currentQ.options.map((optionText, idx) => {
              const isSelected = selectedOption === idx;
              return (
                <motion.div
                  key={idx}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelectOption(idx)}
                  className={`group relative p-4 sm:p-5 rounded-xl border transition-all duration-150 cursor-pointer text-left flex items-start gap-4 ${
                    isSelected
                      ? "bg-amber-400/10 border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                      : "bg-[#0f121d]/80 border-slate-800/80 hover:border-slate-700/90 hover:bg-slate-900/60"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-semibold shrink-0 transition-colors ${
                      isSelected
                        ? "bg-amber-400 text-slate-950 font-bold"
                        : "bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-slate-200"
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </div>

                  <p
                    className={`text-sm leading-relaxed transition-colors ${
                      isSelected ? "text-slate-100 font-medium" : "text-slate-300"
                    }`}
                  >
                    {optionText}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Action Bar */}
          <div className="flex justify-end pt-2">
            <PrimaryButton
              onClick={handleNext}
              disabled={selectedOption === null || isSubmitting}
              icon={ArrowRight}
            >
              {isSubmitting ? "Evaluating..." : currentIndex + 1 === questions.length ? "Submit & Finish" : "Next Question"}
            </PrimaryButton>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}