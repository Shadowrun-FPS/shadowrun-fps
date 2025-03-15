export function DocHero() {
  return (
    <div
      className="relative flex items-center justify-center h-32 bg-center bg-no-repeat bg-cover sm:h-48 md:h-64"
      style={{ backgroundImage: "url('/hero.png')" }}
    >
      <div className="absolute inset-0 z-0 bg-black/50" />
      <div className="relative z-10 px-4 text-center text-white">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl"></h1>
        <p className="mt-2 text-sm text-gray-200 sm:text-base md:text-lg"></p>
      </div>
    </div>
  );
}
