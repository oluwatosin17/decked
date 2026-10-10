import type { ReactNode } from 'react'

export function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header className="cc-page-header"><p>{eyebrow}</p><h1>{title}</h1><span>{description}</span></header>
}

export function KpiCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="cc-kpi"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

export function StatePanel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="cc-state" role="status"><div className="cc-state-mark" aria-hidden="true">◆</div><h2>{title}</h2><div>{children}</div>{action}</section>
}

export function LoadingState() {
  return <div className="cc-loading" aria-busy="true" aria-label="Loading Command Centre">{[1, 2, 3, 4].map(item => <span key={item} />)}</div>
}

export function DataTable({ children, label }: { children: ReactNode; label: string }) {
  return <div className="cc-table-wrap"><table className="cc-table" aria-label={label}>{children}</table></div>
}
