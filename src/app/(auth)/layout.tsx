// Layout para páginas de autenticación y onboarding — sin sidebar ni navegación
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
