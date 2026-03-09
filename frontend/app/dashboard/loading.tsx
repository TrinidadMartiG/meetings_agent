export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* NavBar skeleton */}
      <div className="bg-white border-b border-gray-200 h-16" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome header skeleton */}
        <div className="mb-8 space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-gray-100 rounded-lg animate-pulse" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-xl animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-7 w-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex justify-between mb-4">
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-5 space-y-2"
              >
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div>
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="py-3 border-b border-gray-50 space-y-1.5">
                  <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-1/3 bg-gray-50 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
