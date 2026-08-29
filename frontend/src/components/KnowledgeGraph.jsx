import { motion } from 'framer-motion';
import { Network, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function KnowledgeGraph({ concepts = [], onSelectConcept }) {
  const getConceptStatus = (id) => {
    const item = concepts.find((c) => c.concept_id === id);
    if (!item) return { percent: 0, isLow: true, isMastered: false, name: `Concept #${id}` };
    const roundedPercent = Math.round(item.mastery_percent);
    return {
      percent: roundedPercent,
      isLow: roundedPercent < 60,
      isMastered: roundedPercent >= 80,
      name: item.name,
    };
  };

  return (
    <div className="p-6 rounded-2xl bg-[#0f121d]/90 border border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
            Knowledge Dependency Topology
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-500">Directed Prerequisite Graph</span>
      </div>

      {/* Interactive Node Graph */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative items-center">
        {concepts.map((concept, idx) => {
          const status = getConceptStatus(concept.concept_id);
          return (
            <div key={concept.concept_id} className="relative flex flex-col items-center group">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectConcept(concept.concept_id)}
                className={`w-full p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                  status.isLow
                    ? 'bg-amber-400/[0.06] border-amber-400/40 hover:border-amber-400/70 shadow-[0_0_12px_rgba(245,158,11,0.1)]'
                    : status.isMastered
                    ? 'bg-emerald-400/[0.04] border-emerald-400/30 hover:border-emerald-400/60'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-slate-400">#{concept.concept_id}</span>
                  {status.isLow ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : status.isMastered ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : null}
                </div>

                <p className="text-xs font-semibold text-slate-200 line-clamp-1 group-hover:text-amber-300 transition-colors">
                  {concept.name}
                </p>

                <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Mastery</span>
                  <span className={`font-bold ${status.isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {status.percent}%
                  </span>
                </div>
              </motion.button>

              {/* Edge connector arrow */}
              {idx < concepts.length - 1 && (
                <div className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Clean Legend */}
      <div className="pt-2 flex flex-wrap items-center justify-end gap-4 text-[11px] font-mono text-slate-400 border-t border-slate-800/60">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Mastered (≥ 80%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-400" /> Developing (60–79%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> Needs Attention (&lt; 60%)
        </span>
      </div>
    </div>
  );
}