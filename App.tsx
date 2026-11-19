import React, { useEffect, useRef, useState } from "react";
import { Sparkles, SlidersHorizontal, Heart, Wand2, Camera, Users, Baby, Check, ChevronRight, MessageCircle, Clock, ShieldCheck, Star, ArrowLeftRight, Sun, Contrast, Palette, Eraser, Flame, BadgeCheck, Trash2, Play } from "lucide-react";
import heroUrl from "container:///mnt/data/src/assets/89f4b8d18c12df21-image_20261118_235949.webp";

type Settings = { nitidez: number; brilho: number; contraste: number; cores: number; riscos: number; aquecer: number };
type FavRecord = { id: string; value: any };
type PedidoRecord = { id: string; value: any };

const PRESETS: Record<string, Settings> = {
  Restaurar: { nitidez: 62, brilho: 56, contraste: 62, cores: 62, riscos: 78, aquecer: 32 },
  Colorir: { nitidez: 52, brilho: 58, contraste: 56, cores: 82, riscos: 66, aquecer: 46 },
  "Cores Vivas": { nitidez: 66, brilho: 60, contraste: 70, cores: 96, riscos: 82, aquecer: 26 },
  "Preto e Branco Original": { nitidez: 55, brilho: 50, contraste: 56, cores: 0, riscos: 42, aquecer: 0 },
  HD: { nitidez: 92, brilho: 54, contraste: 73, cores: 68, riscos: 92, aquecer: 18 },
};

const DEMOS = [
  { id: "familia", titulo: "Família anos 80", subtitulo: "Reunião em casa", desc: "Cores quentes de álbum antigo, rostos mais nítidos e fundo limpo.", pos: "50% 38%", preset: "Restaurar" as const, icon: Users },
  { id: "casamento", titulo: "Casamento antigo", subtitulo: "O grande dia", desc: "Vestido branco com luz suave e tons de pele naturais, sem amarelado.", pos: "50% 22%", preset: "Colorir" as const, icon: Heart },
  { id: "crianca", titulo: "Criança / Vó", subtitulo: "Memória de infância", desc: "Olhar de criança e abraço da vó com cores vivas e contraste delicado.", pos: "50% 62%", preset: "Cores Vivas" as const, icon: Baby },
];

const PLANS = [
  { id: "1", titulo: "1 Foto", preco: "R$ 9,90", por: "para testar e se emocionar", detalhe: "1 foto restaurada • Entrega em alta • Ajuste de cor", destaque: false, qtd: "1 foto" },
  { id: "5", titulo: "5 Fotos", preco: "R$ 29,90", por: "o preferido das famílias", detalhe: "5 fotos restauradas • Cores vivas • Revisão de cor", destaque: true, qtd: "5 fotos" },
  { id: "20", titulo: "Álbum 20 Fotos", preco: "R$ 79,90", por: "para guardar a história toda", detalhe: "20 fotos restauradas • Álbum completo • Prioridade", destaque: false, qtd: "20 fotos" },
];

async function api(action: string, args: any) {
  const res = await fetch("actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, args }) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) throw new Error(json.error || "Não foi possível salvar agora. Tente novamente.");
  return json.data;
}

function ScratchLayer({ opacity }: { opacity: number }) {
  const lines = [
    { left: "8%", top: "0%", h: "82%", rot: "8deg" }, { left: "22%", top: "12%", h: "68%", rot: "-6deg" },
    { left: "38%", top: "0%", h: "72%", rot: "4deg" }, { left: "58%", top: "18%", h: "78%", rot: "-9deg" },
    { left: "74%", top: "4%", h: "62%", rot: "7deg" }, { left: "88%", top: "22%", h: "58%", rot: "-4deg" },
    { left: "14%", top: "48%", h: "44%", rot: "-11deg" }, { left: "66%", top: "58%", h: "38%", rot: "10deg" },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity }} aria-hidden="true">
      {lines.map((l, i) => (
        <span key={i} className="absolute block bg-white/80 shadow-[0_0_2px_rgba(0,0,0,.35)]" style={{ left: l.left, top: l.top, height: l.h, width: 1, transform: `rotate(${l.rot})` }} />
      ))}
      <span className="absolute left-[30%] top-[28%] h-[1px] w-[42%] rotate-[-14deg] bg-black/25" />
      <span className="absolute left-[10%] top-[68%] h-[1px] w-[34%] rotate-[9deg] bg-black/20" />
    </div>
  );
}

export default function App() {
  const [demoId, setDemoId] = useState("familia");
  const demo = DEMOS.find((d) => d.id === demoId) || DEMOS[0];
  const [settings, setSettings] = useState<Settings>(PRESETS.Restaurar);
  const [activePreset, setActivePreset] = useState("Restaurar");
  const [divider, setDivider] = useState(52);
  const [favName, setFavName] = useState("Meu ajuste favorito");
  const [favs, setFavs] = useState<FavRecord[]>([]);
  const [pedidos, setPedidos] = useState<PedidoRecord[]>([]);
  const [apiOk, setApiOk] = useState(true);
  const [busyFav, setBusyFav] = useState(false);
  const [busyPedido, setBusyPedido] = useState(false);
  const [favMsg, setFavMsg] = useState("");
  const [pedidoMsg, setPedidoMsg] = useState("");
  const [formError, setFormError] = useState("");
  const [nome, setNome] = useState("");
  const [whats, setWhats] = useState("");
  const [qtd, setQtd] = useState("5 fotos");
  const [tipo, setTipo] = useState("família");
  const [lastPedido, setLastPedido] = useState<any>(null);
  const [appliedFav, setAppliedFav] = useState("");
  const compareRef = useRef<HTMLDivElement>(null);

  async function reloadRecords() {
    try {
      const [c, p] = await Promise.all([
        api("records.list", { collection: "restaura_foto_config" }),
        api("records.list", { collection: "restaura_foto_pedidos" }),
      ]);
      setFavs(c.records || []);
      setPedidos(p.records || []);
      setApiOk(true);
    } catch {
      setApiOk(false);
    }
  }
  useEffect(() => { reloadRecords(); }, []);

  function updateDividerFromClientX(clientX: number) {
    const el = compareRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const pct = Math.max(4, Math.min(96, ((clientX - r.left) / r.width) * 100));
    setDivider(Math.round(pct));
  }
  function applyPreset(name: string) {
    setActivePreset(name);
    setSettings({ ...PRESETS[name] });
    setFavName(name === "Preto e Branco Original" ? "Preto e Branco Original" : `Ajuste ${name}`);
  }
  function chooseDemo(id: string) {
    const d = DEMOS.find((x) => x.id === id); if (!d) return;
    setDemoId(id); setActivePreset(d.preset); setSettings({ ...PRESETS[d.preset] });
  }
  function setVal(key: keyof Settings, v: number) { setSettings((s) => ({ ...s, [key]: v })); setActivePreset("Personalizado"); }

  async function saveFavorite() {
    setFavMsg(""); setBusyFav(true);
    const key = `fav-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      await api("records.create", { collection: "restaura_foto_config", idempotency_key: key, value: { tipo: "config", nome: favName.trim() || "Meu ajuste favorito", demo: demo.titulo, demoId, settings, criadoEm: new Date().toISOString() } });
      await reloadRecords();
      setFavMsg("Ajuste salvo como favorito. Você pode aplicar de novo quando quiser.");
    } catch (e: any) { setFavMsg(e.message || "Não foi possível salvar o favorito."); }
    setBusyFav(false);
  }
  async function applyFav(f: FavRecord) {
    if (f.value?.settings) setSettings(f.value.settings);
    if (f.value?.demoId) setDemoId(f.value.demoId);
    setActivePreset("Personalizado");
    setAppliedFav(`Aplicado: ${f.value?.nome || "ajuste salvo"}`);
    setTimeout(() => setAppliedFav(""), 2600);
  }
  async function deleteFav(id: string) {
    try { await api("records.delete", { collection: "restaura_foto_config", id }); await reloadRecords(); setFavMsg("Favorito removido."); } catch (e: any) { setFavMsg(e.message); }
  }

  function waMessage(v: any) {
    return `Olá Adriano! Sou ${v.nome} e quero restaurar minha foto. Quantidade: ${v.qtd}. Tipo: ${v.tipo}. Meu WhatsApp: ${v.whats}. Vi a demonstração no RestauraFoto PRO e quero trazer minhas memórias de volta com cores vivas!`;
  }
  async function submitPedido() {
    setFormError(""); setPedidoMsg(""); setLastPedido(null);
    if (nome.trim().length < 2) { setFormError("Conte seu nome para o Adriano te chamar com carinho."); return; }
    if (whats.replace(/\D/g, "").length < 8) { setFormError("Coloque um WhatsApp válido, com DDD, para receber a foto restaurada."); return; }
    setBusyPedido(true);
    const value = { tipo: "pedido", nome: nome.trim(), whats: whats.trim(), qtd, tipoFoto: tipo, criadoEm: new Date().toISOString() };
    const key = `pedido-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      await api("records.create", { collection: "restaura_foto_pedidos", idempotency_key: key, value });
      await reloadRecords();
      setLastPedido(value);
      setPedidoMsg("Pedido salvo! Agora fale com o Adriano no WhatsApp para enviar sua foto por lá.");
    } catch (e: any) { setFormError(e.message || "Não foi possível salvar o pedido."); }
    setBusyPedido(false);
  }

  const afterFilter = `brightness(${(0.72 + settings.brilho / 100 * 0.58).toFixed(2)}) contrast(${(0.72 + settings.contraste / 100 * 0.58 + settings.nitidez / 100 * 0.22).toFixed(2)}) saturate(${(settings.cores / 50).toFixed(2)}) sepia(${(settings.aquecer / 100 * 0.36).toFixed(2)})`;
  const afterScratch = ((100 - settings.riscos) / 100) * 0.55;
  const waHref = lastPedido ? `https://wa.me/5519998932588?text=${encodeURIComponent(waMessage(lastPedido))}` : "";

  return (
    <div data-safe-area-inset-root style={{ boxSizing: "border-box", paddingTop: "var(--safe-area-inset-top)" }} className="min-h-screen bg-[var(--surface)] text-[var(--ink)] overflow-x-clip">
      {/* Header */}
      <header data-safe-area-sticky-top style={{ top: "var(--safe-area-inset-top)" }} className="sticky z-40 border-b border-[var(--line)] bg-[var(--surface)]/92 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--primary)] text-white"><Sparkles size={20} /></span>
            <div className="min-w-0"><p className="font-display text-[19px] font-bold leading-none sm:text-[22px]">RestauraFoto <span className="text-[var(--primary)]">PRO</span></p><p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Memórias com cores vivas</p></div>
          </div>
          <a href="#pedido" className="shrink-0 rounded-full bg-[var(--ink)] px-4 py-2.5 text-[13px] font-bold text-[var(--surface)]">Quero restaurar</a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        {/* HERO */}
        <section className="mt-4 overflow-hidden rounded-[28px] bg-[var(--ink)] text-white shadow-xl sm:mt-6">
          <div className="relative h-[430px] sm:h-[480px]">
            <img src={heroUrl} alt="Foto de capa do RestauraFoto PRO com memória de família restaurada em cores vivas" className="absolute inset-0 h-full w-full object-cover object-[50%_30%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/28 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-bold text-[#7A2A0E]"><Heart size={13} /> Antes apagada • Depois cheia de vida</span>
              <h1 className="font-display mt-3 max-w-[620px] text-[clamp(34px,9vw,62px)] font-black leading-[0.95]">Traga suas memórias de volta com cores vivas.</h1>
              <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-white/90 sm:text-[17px]">Aquela foto desbotada na gaveta pode voltar a brilhar. Veja a demonstração, ajuste as cores do seu jeito e peça a restauração.</p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <a href="#comparativo" className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-bold shadow-lg">Ver antes / depois</a>
                <a href="#planos" className="rounded-full bg-white px-5 py-3 text-sm font-bold text-black">Ver planos</a>
              </div>
              <p className="mt-4 text-[12px] text-white/75">Demonstração com foto de exemplo • Sem upload de arquivo por aqui — você envia sua foto direto no WhatsApp.</p>
            </div>
          </div>
        </section>

        {/* COMPARATIVO */}
        <section id="comparativo" className="mt-8 sm:mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[var(--primary)]">Demonstração ao vivo</p><h2 className="font-display mt-1 text-[clamp(28px,7vw,42px)] font-bold leading-none">Antes / Depois</h2><p className="mt-2 max-w-[520px] text-[14px] leading-relaxed text-[var(--muted)]">Arraste a linha no meio da foto. Do lado esquerdo, o tempo apagou. Do lado direito, a memória volta.</p></div>
            <div className="rounded-full bg-[var(--surface-3)] px-3 py-2 text-[12px] font-bold">Agora vendo: <span className="text-[var(--primary)]">{demo.titulo}</span></div>
          </div>

          <div className="mt-7 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
            <div>
              <div ref={compareRef} onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); updateDividerFromClientX(e.clientX); }} onPointerMove={(e) => { if (e.buttons === 1) updateDividerFromClientX(e.clientX); }} className="relative aspect-[4/5] cursor-ew-resize touch-none select-none overflow-hidden rounded-[24px] bg-black shadow-lg sm:aspect-[5/5]">
                {/* AFTER base */}
                <img src={heroUrl} alt={`${demo.titulo} — versão restaurada com cores vivas`} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: demo.pos, filter: afterFilter }} />
                <ScratchLayer opacity={afterScratch} />
                {/* BEFORE clipped — simulado com filtro sobre a mesma camada, sem duplicar a imagem */}
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${divider}%` }}>
                  <div className="absolute inset-0" style={{ backdropFilter: "grayscale(1) sepia(0.28) brightness(0.86) contrast(0.82)" }} />
                  <ScratchLayer opacity={0.72} />
                  <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1.5 text-[12px] font-bold text-white">ANTES • apagada</span>
                </div>
                <span className="absolute right-3 top-3 rounded-full bg-[var(--primary)] px-3 py-1.5 text-[12px] font-bold text-white shadow">DEPOIS • viva</span>
                {/* Divider */}
                <div className="absolute inset-y-0 z-10 w-[3px] bg-white shadow" style={{ left: `${divider}%` }}><span className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-[var(--primary)] bg-white text-[var(--primary)] shadow-lg"><ArrowLeftRight size={19} /></span></div>
                <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 text-white"><p className="text-[13px] font-bold">{demo.titulo} — {demo.subtitulo}</p><p className="text-[12px] text-white/85">{demo.desc}</p></div>
              </div>
              <label className="mt-3 block text-[12px] font-bold text-[var(--muted)]">Posição do comparativo: {divider}% <input type="range" min={4} max={96} value={divider} onChange={(e) => setDivider(Number(e.target.value))} aria-label="Posição do comparativo antes e depois" /></label>
              {/* Demo selector */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                {DEMOS.map((d) => { const Icon = d.icon; const active = d.id === demoId; return (<button key={d.id} onClick={() => chooseDemo(d.id)} className={`rounded-2xl border-2 p-3 text-left transition ${active ? "border-[var(--primary)] bg-[var(--surface-2)] shadow" : "border-[var(--line)] bg-[var(--surface-2)]"}`}><span className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]"><Icon size={17} /></span>{active && <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--primary)] text-white"><Check size={14} /></span>}</span><span className="mt-2 block text-[12px] font-bold leading-tight sm:text-[13px]">{d.titulo}</span><span className="mt-0.5 block text-[11px] text-[var(--muted)]">{d.subtitulo} • {d.preset}</span></button>); })}
              </div>
            </div>

            {/* CONTROLS */}
            <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-2)] p-5 sm:p-7">
              <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]"><SlidersHorizontal size={18} /></span><div><h3 className="font-display text-[20px] font-bold leading-none">Ajuste a restauração</h3><p className="mt-1 text-[12px] text-[var(--muted)]">Mova e veja a foto da direita mudar na hora.</p></div></div>
              <div className="mt-6 space-y-5">
                {([
                  ["nitidez", "Nitidez", "Deixa rostos e detalhes mais definidos", <Wand2 key="a" size={16} />],
                  ["brilho", "Brilho", "Clareia sem estourar a foto", <Sun key="b" size={16} />],
                  ["contraste", "Contraste", "Dá profundidade e vida", <Contrast key="c" size={16} />],
                  ["cores", "Cores Vivas / Saturação", "A cor volta para a roupa e o cenário", <Palette key="d" size={16} />],
                  ["riscos", "Remover Riscos", "Suaviza riscos, manchas e marcas do tempo", <Eraser key="e" size={16} />],
                  ["aquecer", "Aquecer Cores", "Tom mais quente e acolhedor", <Flame key="f" size={16} />],
                ] as const).map(([key, label, hint, icon]) => (
                  <div key={key}><div className="flex items-center justify-between gap-2"><label className="flex items-center gap-1.5 text-[13px] font-bold"><span className="text-[var(--primary)]">{icon}</span>{label}</label><span className="rounded-full bg-[var(--surface-3)] px-2 py-0.5 text-[12px] font-bold">{settings[key]}%</span></div><input type="range" min={0} max={100} value={settings[key]} onChange={(e) => setVal(key, Number(e.target.value))} aria-label={label} /><p className="-mt-1 text-[11px] text-[var(--muted)]">{hint}</p></div>
                ))}
              </div>
              <div className="mt-4 border-t border-[var(--line)] pt-4">
                <p className="text-[12px] font-bold uppercase tracking-wider text-[var(--muted)]">Estilos rápidos</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.keys(PRESETS).map((name) => (<button key={name} onClick={() => applyPreset(name)} className={`rounded-full px-3.5 py-2 text-[13px] font-bold ${activePreset === name ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-3)] text-[var(--ink)]"}`}>{name}</button>))}
                </div>
                <p className="mt-2 text-[12px] text-[var(--muted)]">Estilo atual: <b className="text-[var(--ink)]">{activePreset}</b> • Nitidez {settings.nitidez}% • Cores {settings.cores}% • Riscos {settings.riscos}%</p>
              </div>
              <div className="mt-4 rounded-2xl bg-[var(--surface-3)] p-3">
                <label className="text-[12px] font-bold">Nome deste ajuste</label>
                <input value={favName} onChange={(e) => setFavName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2.5 text-sm" placeholder="Ex.: Cores da vó" />
                <button onClick={saveFavorite} disabled={busyFav} className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--ink)] py-3 text-sm font-bold text-[var(--surface)] disabled:opacity-60"><Heart size={16} /> {busyFav ? "Salvando..." : "Salvar ajuste como favorito"}</button>
                {favMsg && <p className="mt-2 text-[12px] font-semibold text-[var(--success)]">{favMsg}</p>}
                {appliedFav && <p className="mt-2 text-[12px] font-semibold text-[var(--success)]">{appliedFav}</p>}
              </div>
              {!apiOk && <p className="mt-3 rounded-xl bg-[var(--warning)] p-3 text-[12px]">O salvamento na nuvem está indisponível no preview. Seus ajustes continuam funcionando aqui na tela.</p>}
            </div>
          </div>
        </section>

        {/* FAVORITES */}
        {favs.length > 0 && (
          <section className="mt-8">
            <h3 className="font-display text-[22px] font-bold">Seus ajustes favoritos salvos <span className="text-[var(--primary)]">({favs.length})</span></h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {favs.map((f) => (<article key={f.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-3"><p className="font-bold text-[14px]">{f.value?.nome || "Ajuste salvo"}</p><p className="mt-0.5 text-[12px] text-[var(--muted)]">{f.value?.demo || ""} • Nitidez {f.value?.settings?.nitidez ?? "-"}% • Cores {f.value?.settings?.cores ?? "-"}%</p><div className="mt-3 flex gap-2"><button onClick={() => applyFav(f)} className="flex-1 rounded-full bg-[var(--primary)] py-2 text-[13px] font-bold text-white">Aplicar</button><button onClick={() => deleteFav(f.id)} className="flex items-center gap-1 rounded-full border border-[var(--line)] px-3 py-2 text-[13px] font-bold"><Trash2 size={14} /> Remover</button></div></article>))}
            </div>
          </section>
        )}

        {/* HOW IT WORKS */}
        <section className="mt-10 rounded-[24px] bg-[var(--ink)] p-5 text-white sm:p-7">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-orange-300">Como funciona</p><h2 className="font-display mt-1 text-[clamp(26px,6vw,36px)] font-bold">Três passos e a memória volta.</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[{ n: "1", t: "Escolha a foto de demonstração", d: "Teste Família, Casamento ou Criança / Vó e veja o antes e depois." }, { n: "2", t: "Ajuste as cores", d: "Use os controles e estilos rápidos até a foto ficar do seu jeito." }, { n: "3", t: "Salve e mande no WhatsApp", d: "Preencha o pedido abaixo, salve seu ajuste e fale com o Adriano." }].map((s) => (<div key={s.n} className="rounded-2xl bg-white/10 p-4"><span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--primary)] font-display text-lg font-black">{s.n}</span><h3 className="mt-3 font-bold leading-snug">{s.t}</h3><p className="mt-1 text-[13px] leading-relaxed text-white/80">{s.d}</p></div>))}
          </div>
        </section>

        {/* PLANS */}
        <section id="planos" className="mt-10">
          <div className="text-center"><p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[var(--primary)]">Planos simples</p><h2 className="font-display mt-1 text-[clamp(28px,7vw,40px)] font-bold">Quanto custa reviver?</h2><p className="mx-auto mt-2 max-w-[520px] text-[14px] text-[var(--muted)]">Escolha quantas memórias você quer trazer de volta. Sem letra miúda.</p></div>
          <div className="mt-7 grid gap-5 md:grid-cols-3 md:gap-6">
            {PLANS.map((p) => (<article key={p.id} className={`relative rounded-[24px] border-2 p-6 ${p.destaque ? "border-[var(--primary)] bg-[var(--surface-2)] shadow-xl" : "border-[var(--line)] bg-[var(--surface-2)]"}`}>{p.destaque && <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--primary)] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white">★ Mais procurado</span>}<p className="font-bold">{p.titulo}</p><p className="font-display mt-2 text-[34px] font-black leading-none">{p.preco}</p><p className="mt-1 text-[13px] font-semibold text-[var(--primary)]">{p.por}</p><p className="mt-3 text-[13px] leading-relaxed text-[var(--muted)]">{p.detalhe}</p><button onClick={() => { setQtd(p.qtd); document.getElementById("pedido")?.scrollIntoView({ behavior: "smooth" }); }} className={`mt-4 flex w-full items-center justify-center gap-1 rounded-full py-3 text-sm font-bold ${p.destaque ? "bg-[var(--primary)] text-white" : "bg-[var(--ink)] text-[var(--surface)]"}`}>Quero {p.titulo} <ChevronRight size={16} /></button></article>))}
          </div>
        </section>

        {/* FORM */}
        <section id="pedido" className="mt-10 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-2)] p-5 sm:p-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-soft)] px-3 py-1.5 text-[12px] font-bold text-[var(--primary)]"><MessageCircle size={13} /> Fale direto com quem restaura</span>
            <h2 className="font-display mt-3 text-[clamp(26px,6vw,34px)] font-bold leading-tight">Quero restaurar minha foto</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--muted)]">Preencha, salve o pedido e depois toque no botão do WhatsApp. O Adriano te atende e você envia sua foto por lá.</p>
            <div className="mt-5 space-y-3.5">
              <div><label className="text-[13px] font-bold">Seu nome *</label><input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Maria Silva" className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-3 text-sm" /></div>
              <div><label className="text-[13px] font-bold">WhatsApp *</label><input value={whats} onChange={(e) => setWhats(e.target.value)} inputMode="tel" placeholder="(19) 99999-9999" className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-3 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[13px] font-bold">Quantas fotos?</label><select value={qtd} onChange={(e) => setQtd(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-3 text-sm"><option>1 foto</option><option>5 fotos</option><option>20 fotos</option><option>Outra quantidade</option></select></div>
                <div><label className="text-[13px] font-bold">Tipo</label><select value={tipo} onChange={(e) => setTipo(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-3 text-sm"><option>família</option><option>casamento</option><option>documento</option><option>infância</option><option>outro</option></select></div>
              </div>
              {formError && <p className="rounded-xl bg-red-50 p-3 text-[13px] font-semibold text-red-700">{formError}</p>}
              {pedidoMsg && <p className="rounded-xl bg-green-50 p-3 text-[13px] font-semibold text-green-800">{pedidoMsg}</p>}
              <button onClick={submitPedido} disabled={busyPedido} className="w-full rounded-full bg-[var(--primary)] py-3.5 text-[15px] font-bold text-white shadow-lg disabled:opacity-60">{busyPedido ? "Salvando pedido..." : "Quero restaurar"}</button>
              {lastPedido && (<div className="rounded-2xl bg-[var(--surface-3)] p-4"><p className="flex items-center gap-1.5 text-[13px] font-bold"><BadgeCheck size={16} className="text-[var(--success)]" /> Mensagem pronta para o WhatsApp</p><p className="mt-2 rounded-xl bg-[var(--surface-2)] p-3 text-[13px] leading-relaxed">{waMessage(lastPedido)}</p><a href={waHref} target="_blank" rel="noopener" className="mt-3 flex items-center justify-center gap-2 rounded-full bg-[#1FA855] py-3 text-sm font-bold text-white">Abrir WhatsApp do Adriano <ChevronRight size={16} /></a><p className="mt-2 text-center text-[11px] text-[var(--muted)]">Você envia sua foto direto no WhatsApp. Por aqui não há upload de arquivo.</p></div>)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-[24px] bg-[var(--surface-3)] p-5"><div className="flex items-center gap-2"><Camera size={18} className="text-[var(--primary)]" /><h3 className="font-bold">O que você recebe</h3></div><ul className="mt-3 space-y-2.5 text-[13px] leading-relaxed">{["Foto restaurada com cores vivas e mais nitidez","Riscos e manchas suavizados","Pronta para imprimir, emoldurar e mandar no grupo da família","Atendimento humano, com carinho por cada memória"].map((t) => (<li key={t} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[var(--success)]" />{t}</li>))}</ul></div>
            <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-2)] p-5"><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 font-bold"><Clock size={17} className="text-[var(--primary)]" /> Pedidos salvos</h3><span className="rounded-full bg-[var(--surface-3)] px-2.5 py-1 text-[12px] font-bold">{pedidos.length}</span></div>{pedidos.length === 0 ? <p className="mt-2 text-[13px] text-[var(--muted)]">Nenhum pedido salvo ainda. O seu primeiro pedido aparece aqui depois que você salvar.</p> : <ul className="mt-3 space-y-2">{pedidos.slice(0, 4).map((p) => (<li key={p.id} className="rounded-xl bg-[var(--surface)] p-3 text-[13px]"><b>{p.value?.nome}</b> • {p.value?.qtd} • {p.value?.tipoFoto}<br /><span className="text-[var(--muted)]">{p.value?.whats}</span></li>))}</ul>}</div>
            <div className="flex items-start gap-3 rounded-[24px] border border-[var(--line)] bg-[var(--surface-2)] p-5"><ShieldCheck size={22} className="shrink-0 text-[var(--success)]" /><p className="text-[13px] leading-relaxed"><b>Sua foto fica só entre você e o Adriano.</b> A demonstração desta página usa foto de exemplo. Nenhum arquivo é enviado por este site.</p></div>
            <div className="flex items-center gap-2 rounded-[24px] bg-[var(--primary)] p-4 text-white"><Star size={20} className="fill-white" /><p className="text-[13px] font-bold leading-snug">“A foto da minha mãe voltou a ter cor. Chorei quando vi.” <span className="font-normal text-white/85">— o que a gente quer sentir com cada restauração.</span></p></div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)] bg-[var(--surface-2)]">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center sm:px-6">
          <p className="font-display text-[18px] font-bold">RestauraFoto <span className="text-[var(--primary)]">PRO</span></p>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">Criado por Adriano da Cruz — Louveira / SP<br />WhatsApp <a href="https://wa.me/5519998932588" target="_blank" rel="noopener" className="font-bold text-[var(--ink)] underline">(19) 99893-2588</a></p>
          <p className="mt-3 text-[11px] text-[var(--muted)]">Demonstração com foto de exemplo • Ajustes e pedidos salvos neste app.</p>
        </div>
      </footer>
    </div>
  );
}
