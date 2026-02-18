export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 animate-pulse">
      <div className="h-8 w-48 bg-bg-secondary rounded mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-bg-secondary rounded-lg" />
        ))}
      </div>
    </div>
  );
}
