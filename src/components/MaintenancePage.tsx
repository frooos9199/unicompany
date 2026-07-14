'use client';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-8">
          Uni<span className="text-blue-400">Company</span>
        </h1>
        <p className="text-xl sm:text-2xl text-gray-200 mb-3">
          Final preparations underway – Coming back soon
        </p>
        <p className="text-xl sm:text-2xl text-gray-400" dir="rtl">
          جاري التجهيز النهائي - نعود قريباً بإذن الله
        </p>
      </div>
    </div>
  );
}
