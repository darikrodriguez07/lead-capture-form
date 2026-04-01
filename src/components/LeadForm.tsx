import { useState } from "react";
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
import { Send, Loader2 } from "lucide-react";

/* ──────────────────────────────────────────────
   CONFIG — Edita aquí para personalizar el form
   ────────────────────────────────────────────── */
const WEBHOOK_URL = "https://dariikk.app.n8n.cloud/webhook/leads_form";

const INTEREST_OPTIONS = [
  { value: "comprar", label: "Comprar" },
  { value: "alquilar", label: "Alquilar" },
];
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

const LeadForm = () => {
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    if (!form.nombre.trim() || !form.email.trim() || !form.telefono.trim() || !form.interes || !form.urgencia.trim()) {
      toast.error("Por favor, completa todos los campos.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error("Introduce un email válido.");
      return;
    }

    // Formato teléfono español: +34 o 6/7/9 seguido de 8 dígitos
    const phoneClean = form.telefono.replace(/\s/g, "");
    const phoneRegex = /^(\+34)?[679]\d{8}$/;
    if (!phoneRegex.test(phoneClean)) {
      toast.error("Introduce un teléfono español válido (ej: 612345678).");
      return;
    }

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
        }),
      });

      toast.success("¡Formulario enviado con éxito! Nos pondremos en contacto contigo pronto.");
      setForm(initialForm);
    } catch {
      toast.error("Hubo un error al enviar el formulario. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Nombre completo */}
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre completo</Label>
        <Input
          id="nombre"
          placeholder="Ej: María García López"
          value={form.nombre}
          onChange={(e) => handleChange("nombre", e.target.value)}
          maxLength={100}
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          placeholder="tu@email.com"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
          maxLength={255}
        />
      </div>

      {/* Teléfono */}
      <div className="space-y-2">
        <Label htmlFor="telefono">Teléfono</Label>
        <div className="flex items-center gap-2">
          <span className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
            🇪🇸 +34
          </span>
          <Input
            id="telefono"
            type="tel"
            placeholder="612 345 678"
            value={form.telefono}
            onChange={(e) => handleChange("telefono", e.target.value)}
            maxLength={15}
            className="flex-1"
          />
        </div>
      </div>

      {/* Interés */}
      <div className="space-y-2">
        <Label htmlFor="interes">¿Qué te interesa?</Label>
        <Select value={form.interes} onValueChange={(v) => handleChange("interes", v)}>
          <SelectTrigger id="interes">
            <SelectValue placeholder="Selecciona una opción" />
          </SelectTrigger>
          <SelectContent>
            {INTEREST_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Urgencia */}
      <div className="space-y-2">
        <Label htmlFor="urgencia">Urgencia</Label>
        <Textarea
          id="urgencia"
          placeholder="Cuéntanos brevemente tu situación y plazos..."
          value={form.urgencia}
          onChange={(e) => handleChange("urgencia", e.target.value)}
          maxLength={300}
          className="min-h-[80px] resize-none"
        />
      </div>

      {/* Submit */}
      <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Send />
        )}
        {loading ? "Enviando..." : "Enviar solicitud"}
      </Button>
    </form>
  );
};

export default LeadForm;
