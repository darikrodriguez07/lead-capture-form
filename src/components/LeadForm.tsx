import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────
   CONFIG
   ────────────────────────────────────────────── */
const WEBHOOK_URL = "https://dariikk.app.n8n.cloud/webhook/leads_form";
const SLOTS_URL   = "https://dariikk.app.n8n.cloud/webhook/slots_ocupados";

const INTEREST_OPTIONS = [
  { value: "comprar", label: "Comprar" },
  { value: "alquilar", label: "Alquilar" },
];
const URGENCY_OPTIONS = [
  {value: "baja", label: "Baja"},
  {value: "media", label: "Media"},
  {value: "alta", label: "Alta"},
];

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30",
  "16:00", "16:30", "17:00", "17:30",
];

const DISABLED_WEEKDAYS = [0, 6];

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
/* ────────────────────────────────────────────── */

interface FormData {
  nombre: string;
  email: string;
  telefono: string;
  interes: string;
  urgencia: string;
}

const initialForm: FormData = {
  nombre: "",
  email: "",
  telefono: "",
  interes: "",
  urgencia: "",
};

// ── Helpers ─────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstWeekday(year: number, month: number) {
  const dow = new Date(year, month, 1).getDay();
  return dow === 0 ? 6 : dow - 1;
}

function toDateStr(date: Date) {
  return date.toLocaleDateString("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }); // dd/mm/yyyy
}

// ── Calendario ──────────────────────────────────
interface CalendarProps {
  selected: Date | null;
  onSelect: (date: Date) => void;
}

function Calendar({ selected, onSelect }: CalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const firstDow = getFirstWeekday(viewYear, viewMonth);
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1 < 0 ? 11 : viewMonth - 1);

  const cells: { day: number; date: Date | null; type: "prev" | "curr" | "next" }[] = [];

  for (let i = 0; i < firstDow; i++) {
    cells.push({ day: prevMonthDays - firstDow + 1 + i, date: null, type: "prev" });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, date: new Date(viewYear, viewMonth, d), type: "curr" });
  }
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    cells.push({ day: i, date: null, type: "next" });
  }

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted border-b">
        <button type="button" onClick={prevMonth} className="p-1 rounded-md hover:bg-background border text-muted-foreground">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium">{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} className="p-1 rounded-md hover:bg-background border text-muted-foreground">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0 p-3">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[11px] text-muted-foreground py-1 pb-2 font-medium">{d}</div>
        ))}
        {cells.map((cell, i) => {
          if (cell.type !== "curr" || !cell.date) {
            return <div key={i} className="text-center py-1.5 text-xs text-muted-foreground/40">{cell.day}</div>;
          }
          const date = cell.date;
          date.setHours(0, 0, 0, 0);
          const isPast = date < today;
          const isWeekend = DISABLED_WEEKDAYS.includes(date.getDay());
          const isDisabled = isPast || isWeekend;
          const isSelected = selected?.getTime() === date.getTime();
          const isToday = date.getTime() === today.getTime();

          return (
            <button
              key={i}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect(new Date(date))}
              className={cn(
                "text-center py-1.5 text-sm rounded-md transition-colors",
                isDisabled && "text-muted-foreground/40 cursor-not-allowed",
                !isDisabled && !isSelected && "hover:bg-muted cursor-pointer",
                isSelected && "bg-foreground text-background font-medium",
                isToday && !isSelected && "font-semibold",
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Slots de hora ───────────────────────────────
interface TimeSlotsProps {
  date: Date;
  selected: string | null;
  onSelect: (slot: string) => void;
}

function TimeSlots({ date, selected, onSelect }: TimeSlotsProps) {
  const [ocupados, setOcupados] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const dateLabel = date.toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  });

  // Consulta al webhook cada vez que cambia la fecha
  useEffect(() => {
    let cancelled = false;
    setOcupados([]);
    setLoadingSlots(true);

    const fechaStr = toDateStr(date);

    fetch(`${SLOTS_URL}?fecha=${encodeURIComponent(fechaStr)}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        // El webhook devuelve { ocupados: ["09:00", "10:30", ...] }
        setOcupados(Array.isArray(data.ocupados) ? data.ocupados : []);
      })
      .catch(() => {
        if (!cancelled) setOcupados([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => { cancelled = true; };
  }, [date]);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">
          Horarios disponibles para el{" "}
          <span className="text-foreground font-medium">{dateLabel}</span>
        </p>
        {loadingSlots && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {TIME_SLOTS.map(slot => {
          const isOcupado = ocupados.includes(slot);
          const isSelected = selected === slot;

          return (
            <button
              key={slot}
              type="button"
              disabled={isOcupado || loadingSlots}
              onClick={() => !isOcupado && onSelect(slot)}
              className={cn(
                "py-2 text-sm rounded-md border transition-colors relative",
                isOcupado && "border-border bg-muted text-muted-foreground/40 cursor-not-allowed line-through",
                !isOcupado && !isSelected && "border-border hover:bg-muted cursor-pointer",
                isSelected && "bg-foreground text-background border-foreground font-medium",
              )}
            >
              {slot}
              {isOcupado && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[9px] bg-muted text-muted-foreground/60 px-1 rounded">
                  ocupado
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border border-border bg-background" />
          <span className="text-xs text-muted-foreground">Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border border-border bg-muted" />
          <span className="text-xs text-muted-foreground">Ocupado</span>
        </div>
      </div>
    </div>
  );
}

// ── Formulario principal ────────────────────────
const LeadForm = () => {
  const [form, setForm] = useState<FormData>(initialForm);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre.trim() || !form.email.trim() || !form.telefono.trim() || !form.interes || !form.urgencia.trim()) {
      toast.error("Por favor, completa todos los campos.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error("Introduce un email válido.");
      return;
    }

    const phoneClean = form.telefono.replace(/\s/g, "");
    const phoneRegex = /^(\+34)?[679]\d{8}$/;
    if (!phoneRegex.test(phoneClean)) {
      toast.error("Introduce un teléfono español válido (ej: 612345678).");
      return;
    }

    if (!selectedDate || !selectedSlot) {
      toast.error("Elige un día y una hora para tu cita.");
      return;
    }

    const fechaStr = toDateStr(selectedDate);

    setLoading(true);
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_completo: form.nombre.trim(),
          email: form.email.trim(),
          telefono: phoneClean,
          interes: form.interes,
          urgencia: form.urgencia.trim(),
          fecha_cita: fechaStr,
          hora_cita: selectedSlot,
        }),
      });

      toast.success(`¡Cita confirmada para el ${fechaStr} a las ${selectedSlot}! Nos pondremos en contacto pronto.`);
      setForm(initialForm);
      setSelectedDate(null);
      setSelectedSlot(null);
    } catch {
      toast.error("Hubo un error al enviar. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre completo</Label>
        <Input id="nombre" placeholder="Ej: María García López" value={form.nombre} onChange={e => handleChange("nombre", e.target.value)} maxLength={100} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" type="email" placeholder="tu@email.com" value={form.email} onChange={e => handleChange("email", e.target.value)} maxLength={255} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefono">Teléfono</Label>
        <div className="flex items-center gap-2">
          <span className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
            🇪🇸 +34
          </span>
          <Input id="telefono" type="tel" placeholder="612 345 678" value={form.telefono} onChange={e => handleChange("telefono", e.target.value)} maxLength={15} className="flex-1" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="interes">¿Qué te interesa?</Label>
        <Select value={form.interes} onValueChange={v => handleChange("interes", v)}>
          <SelectTrigger id="interes">
            <SelectValue placeholder="Selecciona una opción" />
          </SelectTrigger>
          <SelectContent>
            {INTEREST_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="urgencia">Urgencia</Label>
        <Select value={form.urgencia} onValueChange={v => handleChange("urgencia", v)}>
          <SelectTrigger id="urgencia">
            <SelectValue placeholder="Selecciona una opción" />
          </SelectTrigger>
          <SelectContent>
            {URGENCY_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 pt-1">
        <Label>Elige el día para tu cita</Label>
        <Calendar selected={selectedDate} onSelect={handleDateSelect} />
        {selectedDate && (
          <TimeSlots date={selectedDate} selected={selectedSlot} onSelect={setSelectedSlot} />
        )}
      </div>

      <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading || !selectedDate || !selectedSlot}>
        {loading ? <Loader2 className="animate-spin" /> : <Send />}
        {loading ? "Enviando..." : "Confirmar cita"}
      </Button>
    </form>
  );
};

export default LeadForm;