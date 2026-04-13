import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────── */
function getUrlParam(name: string): string {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) ?? "";
}

const plan = getUrlParam("plan");

const WEBHOOK_URL = plan === "core"
  ? "https://dariikk.app.n8n.cloud/webhook/leads_form_core"
  : "https://dariikk.app.n8n.cloud/webhook/leads_form_starter";

const SLOTS_URL = plan === "core"
  ? "https://dariikk.app.n8n.cloud/webhook/slots_ocupados_core"
  : "https://dariikk.app.n8n.cloud/webhook/slots_ocupados_starter";

const INTEREST_OPTIONS = [
  { value: "Comprar", label: "Comprar" },
  { value: "Alquilar", label: "Alquilar" },
];
const URGENCY_OPTIONS = [
  { value: "Baja", label: "Baja" },
  { value: "Media", label: "Media" },
  { value: "Alta", label: "Alta" },
];
const TIME_SLOTS = [
  "09:00","09:30","10:00","10:30",
  "11:00","11:30","12:00","12:30",
  "16:00","16:30","17:00","17:30",
];
const DISABLED_WEEKDAYS = [0, 6];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const WEEKDAYS = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"];

interface FormData {
  nombre: string;
  email: string;
  telefono: string;
  interes: string;
  urgencia: string;
}

const initialForm: FormData = { nombre: "", email: "", telefono: "", interes: "", urgencia: "" };

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstWeekday(year: number, month: number) {
  const dow = new Date(year, month, 1).getDay();
  return dow === 0 ? 6 : dow - 1;
}
function toDateStr(date: Date) {
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ─────────────────────────────────────────────
   ESTILOS GLOBALES (inyectados una vez)
───────────────────────────────────────────── */
const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --ink: #0f0f0f;
    --ink-60: rgba(15,15,15,0.6);
    --ink-20: rgba(15,15,15,0.2);
    --ink-08: rgba(15,15,15,0.08);
    --ink-04: rgba(15,15,15,0.04);
    --gold: #b8975a;
    --gold-light: rgba(184,151,90,0.12);
    --white: #fafaf8;
    --radius: 2px;
  }

  .lf-root {
    min-height: 100vh;
    background: var(--white);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 48px 20px 80px;
    font-family: 'DM Sans', sans-serif;
    color: var(--ink);
  }

  .lf-card {
    width: 100%;
    max-width: 480px;
    animation: lf-fade 0.6s ease both;
  }

  @keyframes lf-fade {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .lf-header {
    margin-bottom: 48px;
    text-align: center;
  }

  .lf-eyebrow {
    display: inline-block;
    font-family: 'DM Sans', sans-serif;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 14px;
  }

  .lf-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 38px;
    font-weight: 300;
    line-height: 1.15;
    color: var(--ink);
    margin: 0 0 12px;
    letter-spacing: -0.01em;
  }

  .lf-subtitle {
    font-size: 13px;
    color: var(--ink-60);
    line-height: 1.65;
    margin: 0;
  }

  .lf-divider {
    width: 32px;
    height: 1px;
    background: var(--gold);
    margin: 20px auto 0;
    opacity: 0.6;
  }

  /* FIELDS */
  .lf-field {
    margin-bottom: 24px;
  }

  .lf-label {
    display: block;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-60);
    margin-bottom: 8px;
  }

  .lf-input {
    width: 100%;
    height: 48px;
    padding: 0 14px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--ink-20);
    border-radius: 0;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    color: var(--ink);
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }

  .lf-input:focus {
    border-bottom-color: var(--ink);
  }

  .lf-input::placeholder {
    color: var(--ink-20);
  }

  .lf-phone-row {
    display: flex;
    align-items: flex-end;
    gap: 0;
    border-bottom: 1px solid var(--ink-20);
    transition: border-color 0.2s;
  }

  .lf-phone-row:focus-within {
    border-bottom-color: var(--ink);
  }

  .lf-phone-prefix {
    font-size: 14px;
    color: var(--ink-60);
    padding: 0 12px 12px 0;
    white-space: nowrap;
    flex-shrink: 0;
    line-height: 1;
  }

  .lf-phone-input {
    flex: 1;
    height: 48px;
    padding: 0;
    background: transparent;
    border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    color: var(--ink);
    outline: none;
  }

  .lf-phone-input::placeholder {
    color: var(--ink-20);
  }

  /* SELECT */
  .lf-select-wrapper {
    position: relative;
    border-bottom: 1px solid var(--ink-20);
    transition: border-color 0.2s;
  }

  .lf-select-wrapper:focus-within {
    border-bottom-color: var(--ink);
  }

  .lf-select {
    width: 100%;
    height: 48px;
    padding: 0 32px 0 0;
    background: transparent;
    border: none;
    appearance: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    color: var(--ink);
    outline: none;
    cursor: pointer;
  }

  .lf-select-arrow {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--ink-60);
  }

  /* SECTION TITLE */
  .lf-section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px;
    font-weight: 400;
    color: var(--ink);
    margin: 36px 0 16px;
    letter-spacing: 0.01em;
  }

  /* CALENDAR */
  .lf-cal {
    border: 1px solid var(--ink-08);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .lf-cal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--ink-08);
    background: var(--ink-04);
  }

  .lf-cal-nav {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: 1px solid var(--ink-20);
    border-radius: var(--radius);
    cursor: pointer;
    color: var(--ink-60);
    transition: all 0.15s;
  }

  .lf-cal-nav:hover {
    border-color: var(--ink);
    color: var(--ink);
  }

  .lf-cal-month {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink);
  }

  .lf-cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    padding: 12px;
    gap: 2px;
  }

  .lf-cal-wd {
    text-align: center;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-60);
    padding: 4px 0 8px;
  }

  .lf-cal-day {
    text-align: center;
    padding: 7px 2px;
    font-size: 13px;
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.15s;
    background: none;
    border: none;
    color: var(--ink);
    font-family: 'DM Sans', sans-serif;
  }

  .lf-cal-day:disabled {
    color: var(--ink-20);
    cursor: not-allowed;
  }

  .lf-cal-day:not(:disabled):hover {
    background: var(--ink-04);
  }

  .lf-cal-day.selected {
    background: var(--ink);
    color: var(--white);
    font-weight: 500;
  }

  .lf-cal-day.today:not(.selected) {
    font-weight: 600;
    color: var(--gold);
  }

  .lf-cal-day.other-month {
    color: var(--ink-20);
    cursor: default;
  }

  /* TIME SLOTS */
  .lf-slots-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 20px 0 12px;
  }

  .lf-slots-label {
    font-size: 12px;
    color: var(--ink-60);
    line-height: 1.5;
  }

  .lf-slots-label strong {
    color: var(--ink);
    font-weight: 500;
    display: block;
  }

  .lf-slots-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }

  .lf-slot {
    padding: 10px 4px;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    text-align: center;
    border: 1px solid var(--ink-20);
    border-radius: var(--radius);
    background: none;
    color: var(--ink);
    cursor: pointer;
    transition: all 0.15s;
    position: relative;
  }

  .lf-slot:hover:not(:disabled) {
    border-color: var(--ink);
    background: var(--ink-04);
  }

  .lf-slot.selected {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--white);
  }

  .lf-slot:disabled {
    color: var(--ink-20);
    text-decoration: line-through;
    cursor: not-allowed;
    background: var(--ink-04);
  }

  .lf-slot-tag {
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 9px;
    background: var(--ink-08);
    color: var(--ink-60);
    padding: 1px 4px;
    border-radius: 2px;
    white-space: nowrap;
    letter-spacing: 0.04em;
  }

  .lf-legend {
    display: flex;
    gap: 16px;
    margin-top: 12px;
  }

  .lf-legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--ink-60);
  }

  .lf-legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 1px;
    border: 1px solid var(--ink-20);
  }

  .lf-legend-dot.occupied {
    background: var(--ink-04);
  }

  /* SUBMIT */
  .lf-submit {
    width: 100%;
    height: 52px;
    margin-top: 36px;
    background: var(--ink);
    color: var(--white);
    border: none;
    border-radius: var(--radius);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }

  .lf-submit::after {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--gold);
    opacity: 0;
    transition: opacity 0.2s;
  }

  .lf-submit:hover:not(:disabled)::after {
    opacity: 0.15;
  }

  .lf-submit:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .lf-submit span, .lf-submit svg {
    position: relative;
    z-index: 1;
  }

  .lf-footer {
    text-align: center;
    margin-top: 32px;
    font-size: 11px;
    color: var(--ink-20);
    letter-spacing: 0.04em;
  }
`;

/* ─────────────────────────────────────────────
   CALENDAR
───────────────────────────────────────────── */
function Calendar({ selected, onSelect }: { selected: Date | null; onSelect: (d: Date) => void }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y-1)) : setViewMonth(m => m-1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y+1)) : setViewMonth(m => m+1);

  const firstDow = getFirstWeekday(viewYear, viewMonth);
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const prevMonthDays = getDaysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth-1);

  const cells: { day: number; date: Date | null; type: string }[] = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: prevMonthDays - firstDow + 1 + i, date: null, type: "prev" });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, date: new Date(viewYear, viewMonth, d), type: "curr" });
  const rem = (7 - cells.length % 7) % 7;
  for (let i = 1; i <= rem; i++) cells.push({ day: i, date: null, type: "next" });

  return (
    <div className="lf-cal">
      <div className="lf-cal-header">
        <button type="button" className="lf-cal-nav" onClick={prevMonth}><ChevronLeft size={14} /></button>
        <span className="lf-cal-month">{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" className="lf-cal-nav" onClick={nextMonth}><ChevronRight size={14} /></button>
      </div>
      <div className="lf-cal-grid">
        {WEEKDAYS.map(d => <div key={d} className="lf-cal-wd">{d}</div>)}
        {cells.map((cell, i) => {
          if (cell.type !== "curr" || !cell.date) return <div key={i} className="lf-cal-day other-month">{cell.day}</div>;
          const date = cell.date; date.setHours(0,0,0,0);
          const isDisabled = date < today || DISABLED_WEEKDAYS.includes(date.getDay());
          const isSelected = selected?.getTime() === date.getTime();
          const isToday = date.getTime() === today.getTime();
          return (
            <button
              key={i} type="button" disabled={isDisabled}
              onClick={() => onSelect(new Date(date))}
              className={cn("lf-cal-day", isSelected && "selected", isToday && !isSelected && "today")}
            >{cell.day}</button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TIME SLOTS
───────────────────────────────────────────── */
function TimeSlots({ date, selected, onSelect, clientId }: { date: Date; selected: string | null; onSelect: (s: string) => void; clientId: string }) {
  const [ocupados, setOcupados] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const dateLabel = date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  useEffect(() => {
    let cancelled = false;
    setOcupados([]); setLoading(true);
    fetch(`${SLOTS_URL}?fecha=${encodeURIComponent(toDateStr(date))}&client_id=${encodeURIComponent(clientId)}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setOcupados(Array.isArray(d.ocupados) ? d.ocupados : []); })
      .catch(() => { if (!cancelled) setOcupados([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [date, clientId]);

  return (
    <>
      <div className="lf-slots-header">
        <div className="lf-slots-label">
          <strong>{dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}</strong>
          Selecciona un horario disponible
        </div>
        {loading && <Loader2 size={14} className="animate-spin" style={{ color: "var(--ink-60)" }} />}
      </div>
      <div className="lf-slots-grid">
        {TIME_SLOTS.map(slot => {
          const isOcupado = ocupados.includes(slot);
          const isSelected = selected === slot;
          return (
            <button
              key={slot} type="button"
              disabled={isOcupado || loading}
              onClick={() => !isOcupado && onSelect(slot)}
              className={cn("lf-slot", isSelected && "selected")}
            >
              {isOcupado && <span className="lf-slot-tag">ocupado</span>}
              {slot}
            </button>
          );
        })}
      </div>
      <div className="lf-legend">
        <div className="lf-legend-item"><div className="lf-legend-dot" />Disponible</div>
        <div className="lf-legend-item"><div className="lf-legend-dot occupied" />Ocupado</div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   MAIN FORM
───────────────────────────────────────────── */
const LeadForm = () => {
  const [form, setForm] = useState<FormData>(initialForm);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const clientId = getUrlParam("client_id");

  const handleChange = (field: keyof FormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre.trim() || !form.email.trim() || !form.telefono.trim() || !form.interes || !form.urgencia) {
      toast.error("Por favor, completa todos los campos."); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Introduce un email válido."); return;
    }
    const phoneClean = form.telefono.replace(/\s/g, "");
    if (!/^(\+34)?[679]\d{8}$/.test(phoneClean)) {
      toast.error("Introduce un teléfono español válido (ej: 612345678)."); return;
    }
    if (!selectedDate || !selectedSlot) {
      toast.error("Elige un día y una hora para tu cita."); return;
    }
    if (!clientId) {
      toast.error("URL incorrecta. Contacta con tu asesor."); return;
    }

    setLoading(true);
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          nombre_completo: form.nombre.trim(),
          email: form.email.trim(),
          telefono: phoneClean,
          interes: form.interes,
          urgencia: form.urgencia,
          fecha_cita: toDateStr(selectedDate),
          hora_cita: selectedSlot,
        }),
      });
      toast.success(`Cita confirmada para el ${toDateStr(selectedDate)} a las ${selectedSlot}.`);
      setForm(initialForm); setSelectedDate(null); setSelectedSlot(null);
    } catch {
      toast.error("Hubo un error al enviar. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <div className="lf-root">
        <div className="lf-card">
          <header className="lf-header">
            <span className="lf-eyebrow">Agenda tu visita</span>
            <h1 className="lf-title">Reserva tu<br />cita con nosotros</h1>
            <p className="lf-subtitle">Completa el formulario y un asesor<br />se pondrá en contacto contigo.</p>
            <div className="lf-divider" />
          </header>

          <form onSubmit={handleSubmit}>
            <div className="lf-field">
              <label className="lf-label" htmlFor="nombre">Nombre completo</label>
              <input
                className="lf-input" id="nombre" type="text"
                placeholder="María García López"
                value={form.nombre} maxLength={100}
                onChange={e => handleChange("nombre", e.target.value)}
              />
            </div>

            <div className="lf-field">
              <label className="lf-label" htmlFor="email">Correo electrónico</label>
              <input
                className="lf-input" id="email" type="email"
                placeholder="tu@email.com"
                value={form.email} maxLength={255}
                onChange={e => handleChange("email", e.target.value)}
              />
            </div>

            <div className="lf-field">
              <label className="lf-label" htmlFor="telefono">Teléfono</label>
              <div className="lf-phone-row">
                <span className="lf-phone-prefix">🇪🇸 +34</span>
                <input
                  className="lf-phone-input" id="telefono" type="tel"
                  placeholder="612 345 678"
                  value={form.telefono} maxLength={15}
                  onChange={e => handleChange("telefono", e.target.value)}
                />
              </div>
            </div>

            <div className="lf-field">
              <label className="lf-label" htmlFor="interes">¿Qué te interesa?</label>
              <div className="lf-select-wrapper">
                <select
                  className="lf-select" id="interes"
                  value={form.interes}
                  onChange={e => handleChange("interes", e.target.value)}
                >
                  <option value="" disabled>Selecciona una opción</option>
                  {INTEREST_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronRight size={14} className="lf-select-arrow" style={{ transform: "translateY(-50%) rotate(90deg)" }} />
              </div>
            </div>

            <div className="lf-field">
              <label className="lf-label" htmlFor="urgencia">Urgencia</label>
              <div className="lf-select-wrapper">
                <select
                  className="lf-select" id="urgencia"
                  value={form.urgencia}
                  onChange={e => handleChange("urgencia", e.target.value)}
                >
                  <option value="" disabled>¿Cuál es tu urgencia?</option>
                  {URGENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronRight size={14} className="lf-select-arrow" style={{ transform: "translateY(-50%) rotate(90deg)" }} />
              </div>
            </div>

            <p className="lf-section-title">Elige fecha y hora</p>

            <Calendar selected={selectedDate} onSelect={handleDateSelect} />

            {selectedDate && (
              <TimeSlots
                date={selectedDate}
                selected={selectedSlot}
                onSelect={setSelectedSlot}
                clientId={clientId}
              />
            )}

            <button type="submit" className="lf-submit" disabled={loading || !selectedDate || !selectedSlot}>
              {loading
                ? <><Loader2 size={16} className="animate-spin" /><span>Enviando</span></>
                : <span>Confirmar cita</span>
              }
            </button>
          </form>

          <p className="lf-footer">Tus datos están protegidos y no serán compartidos</p>
        </div>
      </div>
    </>
  );
};

export default LeadForm;
