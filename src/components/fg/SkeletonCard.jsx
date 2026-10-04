export default function SkeletonCard({ className = "", height = 170 }) {
  return (
    <div className={`fg-card p-5 ${className}`} style={{ minHeight: height }}>
      <div className="flex items-start justify-between mb-4">
        <div className="fg-skeleton" style={{ width: 44, height: 44, borderRadius: 12 }} />
        <div className="fg-skeleton" style={{ width: 90, height: 22, borderRadius: 999 }} />
      </div>
      <div className="fg-skeleton" style={{ width: 80, height: 16 }} />
      <div className="fg-skeleton mt-2" style={{ width: 50, height: 12 }} />
      <div className="fg-skeleton mt-5" style={{ width: 120, height: 36 }} />
    </div>
  );
}