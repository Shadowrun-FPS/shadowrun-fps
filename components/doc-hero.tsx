export function DocHero() {
  return (
    <div
      className="relative flex items-center justify-center h-24 sm:h-32 md:h-40 lg:h-48 xl:h-64 bg-center bg-no-repeat bg-cover"
      style={{ backgroundImage: "url('/hero.png')" }}
    >
      <div className="absolute inset-0 z-0 bg-black/50" />
      <div className="relative z-10 px-4 sm:px-6 md:px-8 text-center text-white">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight"></h1>
        <p className="mt-2 text-xs sm:text-sm md:text-base lg:text-lg text-gray-200"></p>
      </div>
    </div>
  );
}
