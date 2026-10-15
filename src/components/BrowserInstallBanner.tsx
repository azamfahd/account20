import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Download, X, Sparkles, ShieldCheck, ExternalLink } from 'lucide-react';
import { GITHUB_RELEASES_PAGE_URL } from '../services/updateService';

interface BrowserInstallBannerProps {
  show: boolean;
  onOpenInstallModal: () => void;
  onDismiss: () => void;
}

export const BrowserInstallBanner: React.FC<BrowserInstallBannerProps> = ({
  show,
  onOpenInstallModal,
  onDismiss
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="browser-install-prompt-banner-motion"
          id="browser-install-prompt-banner"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-[88] bg-slate-900/95 text-white border border-emerald-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-right space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <button
              onClick={onDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black">
                    تجربة أصلية
                  </span>
                  <h4 className="font-extrabold text-xs text-white flex items-center gap-1">
                    <span>ثبّت تطبيق المحاسبي الذكي على جهازك</span>
                  </h4>
                </div>
                <p className="text-[11px] text-slate-300 font-medium mt-0.5 leading-snug">
                  استمتع بعمل مستمر بدون إنترنت وشاشة كاملة وسرعة فائقة بتثبيت التطبيق كـ APK أو PWA.
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Smartphone className="w-4.5 h-4.5 animate-bounce" />
              </div>
            </div>
          </div>

          {/* Quick Features */}
          <div className="flex items-center justify-end gap-3 text-[10px] text-emerald-300 font-bold border-t border-slate-800/80 pt-2">
            <span className="flex items-center gap-1">
              <span>تحديثات تلقائية سحابية</span>
              <Sparkles className="w-3 h-3 text-emerald-400" />
            </span>
            <span className="flex items-center gap-1">
              <span>يعمل 100% بدون إنترنت</span>
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
            </span>
          </div>

          {/* CTA Actions */}
          <div className="space-y-2 pt-1">
            <a
              id="direct-download-apk-banner-link"
              href="https://github.com/azamfahd/account20/releases/download/latest/app-release.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer no-underline text-center"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>تحميل تطبيق الـ APK مباشرة (smart_account) 🚀</span>
            </a>

            <button
              id="open-install-options-btn"
              onClick={onOpenInstallModal}
              className="w-full py-2 px-3 bg-slate-800/90 hover:bg-slate-750 active:scale-[0.98] text-slate-200 hover:text-white font-bold text-[11px] rounded-xl border border-slate-700/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>تثبيت PWA أو استعراض خيارات التثبيت</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-slate-800/60">
            <a
              href={GITHUB_RELEASES_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors underline"
            >
              <span>صفحة الإصدارات في المستودع (Releases)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="font-mono text-[9px] text-slate-400">azamfahd/account20</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
