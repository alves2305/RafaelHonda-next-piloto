"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import styles from "./RafaelAiChat.module.css";

type Message = { id: number; autor: "cliente" | "ia"; conteudo: string };
const SESSION_KEY = "rafael-ai-catalog-session-v1";

export function RafaelAiChat({ whatsappUrl }: { whatsappUrl: string }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<{ id: string; token: string } | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return null;
    try { return JSON.parse(saved); } catch { localStorage.removeItem(SESSION_KEY); return null; }
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !session) return;
    let active = true;
    const load = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return setError("Chat temporariamente indisponível.");
      const { data, error: rpcError } = await supabase.rpc("chat_catalogo_listar_mensagens", {
        p_sessao_id: session.id, p_token: session.token,
      });
      if (active && !rpcError) setMessages((data ?? []) as Message[]);
    };
    load();
    const timer = window.setInterval(load, 2000);
    return () => { active = false; window.clearInterval(timer); };
  }, [open, session]);

  useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

  async function ensureSession() {
    if (session) return session;
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Chat temporariamente indisponível.");
    const token = crypto.randomUUID() + crypto.randomUUID();
    const { data, error: rpcError } = await supabase.rpc("chat_catalogo_iniciar", {
      p_cliente_slug: "rafael", p_token: token,
    });
    if (rpcError || !data) throw new Error("Não foi possível iniciar o chat.");
    const created = { id: String(data), token };
    localStorage.setItem(SESSION_KEY, JSON.stringify(created));
    setSession(created);
    return created;
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true); setError("");
    try {
      const current = await ensureSession();
      const supabase = getSupabaseClient();
      const { error: rpcError } = await supabase!.rpc("chat_catalogo_enviar_mensagem", {
        p_sessao_id: current.id, p_token: current.token, p_conteudo: content,
      });
      if (rpcError) throw rpcError;
      setText("");
      setMessages((items) => [...items, { id: Date.now(), autor: "cliente", conteudo: content }]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível enviar.");
    } finally { setSending(false); }
  }

  return (
    <div className={styles.root}>
      {open ? (
        <section className={styles.panel} aria-label="Chat com Rafael IA">
          <header><div><strong>Rafael IA</strong><span>Assistente virtual Honda</span></div><button onClick={() => setOpen(false)} aria-label="Fechar chat">×</button></header>
          <div className={styles.messages}>
            <div className={styles.ai}>Olá! Sou a assistente virtual do Rafael. Qual moto Honda você procura?</div>
            {messages.map((message) => <div key={message.id} className={message.autor === "cliente" ? styles.user : styles.ai}>{message.conteudo}</div>)}
            {sending ? <div className={styles.status}>Enviando…</div> : null}
            {error ? <div className={styles.error}>{error} <a href={whatsappUrl}>Chamar no WhatsApp</a></div> : null}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={send}><input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="Digite sua mensagem…" aria-label="Mensagem"/><button disabled={sending || !text.trim()}>Enviar</button></form>
        </section>
      ) : null}
      <button className={styles.trigger} onClick={() => setOpen((value) => !value)} aria-label="Abrir atendimento com Rafael IA">💬 <span>Fale com a IA</span></button>
    </div>
  );
}
