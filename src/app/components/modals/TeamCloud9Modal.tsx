import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Sparkles, X, Terminal, ShieldCheck, Cpu, Code2, Globe, Rocket } from 'lucide-react';

interface TeamCloud9ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TEAM_MEMBERS = [
  { name: 'Aradhya Joshi', role: 'Lead System Architect & Core Frontend', icon: Cpu, badge: 'LEAD' },
  { name: 'Avika Badkul', role: 'UI/UX & Financial Telemetry Engineer', icon: Code2, badge: 'DESIGN' },
  { name: 'Aarav Maheshwari', role: 'Data Pipelines & API Integration Lead', icon: Terminal, badge: 'DATA' },
  { name: 'Hirdhayanshi Gaur', role: 'Quantitative Analyst & Market Logic', icon: ShieldCheck, badge: 'QUANT' },
  { name: 'Sai Nandan Gupta', role: 'AI Model Integration & Edge Infrastructure', icon: Globe, badge: 'INFRA' },
];

export const TeamCloud9Modal: React.FC<TeamCloud9ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#0a0d14]/95 p-6 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl"
        >
          {/* Top Decorative Ambient Glows */}
          <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg bg-gray-800/40 hover:bg-gray-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  DEVELOPMENT TEAM
                </span>
                <span className="flex items-center gap-1 text-[11px] text-amber-400 font-mono">
                  <Sparkles className="w-3 h-3" /> STOCKWAR v2.8
                </span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white mt-0.5">
                PROJECT CREATED BY <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">TEAM CLOUD9</span>
              </h2>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-5 leading-relaxed font-mono">
            Welcome to <strong className="text-gray-200">Stockwar Terminal v2.8</strong> — a zero-mock, real-time financial & quantitative market intelligence platform engineered by Team Cloud9.
          </p>

          {/* Team Members List */}
          <div className="space-y-2.5 mb-6">
            <div className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase font-mono mb-2 flex items-center justify-between border-b border-gray-800/80 pb-1">
              <span>TEAM MEMBERS & CONTRIBUTORS</span>
              <span>5 MEMBERS</span>
            </div>

            {TEAM_MEMBERS.map((member, idx) => {
              const IconComp = member.icon;
              return (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * idx + 0.1 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-900/60 border border-gray-800/60 hover:border-cyan-500/40 hover:bg-gray-800/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 transition-colors">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-100 group-hover:text-cyan-300 transition-colors">
                        {member.name}
                      </h4>
                      <p className="text-[11px] text-gray-400 font-mono">{member.role}</p>
                    </div>
                  </div>

                  <span className="px-2 py-1 text-[9px] font-mono font-bold tracking-wider rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                    {member.badge}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-800/80">
            <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono">
              <Rocket className="w-3.5 h-3.5 text-cyan-400" />
              <span>Real-Time Market Telemetry Enabled</span>
            </div>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide text-black bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 shadow-lg shadow-cyan-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              LAUNCH TERMINAL ▶
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
