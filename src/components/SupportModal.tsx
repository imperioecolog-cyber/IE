import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, AlertCircle, CheckCircle2 } from "lucide-react";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
}

export default function SupportModal({ isOpen, onClose, userEmail }: SupportModalProps) {
  const [formData, setFormData] = useState({
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    const formPayload = new URLSearchParams();
    formPayload.append("form-name", "contact");
    formPayload.append("email", userEmail || "anonimo@gestaologistica.com");
    formPayload.append("subject", formData.subject);
    formPayload.append("message", formData.message);

    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formPayload.toString()
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({ subject: "", message: "" });
        setTimeout(() => {
          onClose();
          setSubmitStatus("idle");
        }, 3000);
      } else {
        setSubmitStatus("error");
      }
    } catch (err) {
      console.error("Erro ao enviar formulário:", err);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
          >
            {/* Netlify Forms Hidden Declaration */}
            <form name="contact" data-netlify="true" hidden>
              <input type="text" name="email" />
              <input type="text" name="subject" />
              <textarea name="message"></textarea>
            </form>

            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-lg font-black tracking-tight text-zinc-800 dark:text-zinc-100 uppercase">
                Central de Suporte
              </h2>
              <button
                onClick={onClose}
                className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {submitStatus === "success" ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-8 text-center space-y-4"
                >
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Chamado Enviado!</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                      Nossa equipe de suporte técnico entrará em contato em breve.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Assunto
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Ex: Problema no faturamento"
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Mensagem
                    </label>
                    <textarea
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Descreva o seu problema detalhadamente..."
                      rows={5}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all resize-none"
                    ></textarea>
                  </div>

                  {submitStatus === "error" && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                        Ocorreu um erro ao enviar seu chamado. Tente novamente mais tarde.
                      </p>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-red-500/50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Enviar Chamado</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
