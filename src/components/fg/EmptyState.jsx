export default function EmptyState({ title = "Chưa có kết quả kiểm tra", description = "Kết quả sẽ được cập nhật sau khi học sinh hoàn thành đợt đánh giá thể chất.", className = "" }) {
  return (
    <div className={`fg-card p-8 sm:p-12 flex flex-col items-center text-center ${className}`}>
      <svg width="120" height="100" viewBox="0 0 120 100" fill="none" className="mb-4">
        <circle cx="60" cy="50" r="42" stroke="#26275D" strokeWidth="2" opacity="0.12" />
        <circle cx="60" cy="50" r="28" stroke="#F9DD0E" strokeWidth="2" opacity="0.5" />
        <path d="M48 52h24M60 40v24" stroke="#26275D" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
        <circle cx="60" cy="50" r="6" fill="#F9DD0E" />
      </svg>
      <h3 className="text-lg font-bold text-navy mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}