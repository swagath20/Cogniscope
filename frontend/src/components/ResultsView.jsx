import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  BrainCircuit,
  RotateCcw
} from 'lucide-react';
import GlassCard from './GlassCard';
import KnowledgeGraph from './KnowledgeGraph';
import PrimaryButton from './PrimaryButton';

const API_BASE = "http://127.0.0.1:8000/api";

export default function ResultsView({ sessionId, onRetakeQuiz, onSelectConceptForIntervention }) {
  const [masteryData, setMasteryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMastery() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/mastery?session_id=${sessionId}`);
        if (!res.ok) throw new Error("Failed to load concept mastery data");
        const data = await res.json();
        setMasteryData(data.mastery || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMastery();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">
          Synthesizing Mastery Telemetry...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <GlassCard className="max-w-lg mx-auto text-center py-8 space-y-4 border-rose-500/30">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-base font-semibold text-slate-100">Telemetry Fetch Failed</h3>
        <p className="text-slate-400 text-xs font-mono">{error}</p>
        <PrimaryButton onClick={() => window.location.reload()}>Retry</PrimaryButton>
      </GlassCard>
    );
  }

  const totalConcepts = masteryData.length;
  const avgMastery = totalConcepts > 0 
    ? Math.round(masteryData.reduce((acc, c) => acc + c.mastery_percent, 0) / totalConcepts) 
    : 0;
  const gapCount = masteryData.filter(c => c.mastery_percent < 60).length;

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      {/* Top Overview Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Diagnostic Breakdown</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
            Concept Mastery Matrix
          </h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="text-left">
              <p className="text-[10px] font-mono uppercase text-slate-400">Mean Mastery</p>
              <p className="text-base font-bold font-mono text-slate-100">{avgMastery}%</p>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="text-left">
              <p className="text-[10px] font-mono uppercase text-slate-400">Gaps Identified</p>
              <p className={`text-base font-bold font-mono ${gapCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {gapCount} {gapCount === 1 ? 'Concept' : 'Concepts'}
              </p>
            </div>
          </div>

          <button
            onClick={onRetakeQuiz}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors cursor-pointer"
            title="Retake Diagnostic"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Topology Graph */}
      <KnowledgeGraph 
        concepts={masteryData} 
        onSelectConcept={(conceptId) => onSelectConceptForIntervention(conceptId)} 
      />

      {/* Detailed Concept Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {masteryData.map((concept, idx) => {
          const isLowMastery = concept.mastery_percent < 60;
          const isMastered = concept.mastery_percent >= 80;

          return (
            <GlassCard 
              key={concept.concept_id} 
              delay={idx * 0.06}
              className={`p-6 flex flex-col justify-between space-y-5 relative overflow-hidden ${
                isLowMastery ? 'border-amber-400/30' : 'border-slate-800/80'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400">
                    Concept #{concept.concept_id}
                  </span>
                  
                  {isLowMastery ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[11px] font-mono font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      Needs Attention
                    </span>
                  ) : isMastered ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 text-[11px] font-mono font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Mastered
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono">
                      Developing
                    </span>
                  )}
                </div>

                <h3 className="text-base font-semibold text-slate-100">
                  {concept.name}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {concept.description}
                </p>
              </div>

              {/* Mastery Progress Bar */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Mastery Level</span>
                  <span className={`font-bold ${isLowMastery ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {concept.mastery_percent}%
                  </span>
                </div>

                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80">
                  <motion.div
                    className={`h-full rounded-full ${
                      isLowMastery 
                        ? 'bg-gradient-to-r from-amber-500 to-amber-400' 
                        : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${concept.mastery_percent}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>

              {/* Action Trigger */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  Confidence: {concept.confidence_percent}%
                </span>

                {isLowMastery ? (
                  <button
                    onClick={() => onSelectConceptForIntervention(concept.concept_id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 hover:border-amber-400/50 transition-all cursor-pointer"
                  >
                    <BrainCircuit className="w-3.5 h-3.5" />
                    <span>Explain My Learning Gap</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ) : (
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    No Gaps Found
                  </span>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}