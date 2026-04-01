import LeadForm from "@/components/LeadForm";

/* ──────────────────────────────────────────────
   CONFIG — Personaliza textos y logo aquí
   ────────────────────────────────────────────── */
const SITE_CONFIG = {
  /** Ruta al logo — coloca tu logo en /public o src/assets y cambia esta ruta */
  logoUrl: "",
  logoAlt: "Logo de la empresa",
  headline: "Encuentra tu hogar ideal",
  subheadline:
    "Déjanos tus datos y un asesor se pondrá en contacto contigo de forma personalizada.",
  footerText: `© ${new Date().getFullYear()} Tu Empresa. Todos los derechos reservados.`,
};
/* ────────────────────────────────────────────── */

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Main content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          {SITE_CONFIG.logoUrl && (
            <div className="flex justify-center">
              <img
                src={SITE_CONFIG.logoUrl}
                alt={SITE_CONFIG.logoAlt}
                className="h-14 w-auto object-contain"
              />
            </div>
          )}

          {/* Header text */}
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {SITE_CONFIG.headline}
            </h1>
            <p className="text-muted-foreground">{SITE_CONFIG.subheadline}</p>
          </div>

          {/* Card with form */}
          <div className="rounded-xl border border-border bg-card p-6 card-shadow sm:p-8">
            <LeadForm />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        {SITE_CONFIG.footerText}
      </footer>
    </div>
  );
};

export default Index;
