import clientPromise from "@/lib/mongodb";
import StatSearchResults from "./statSearchResults";
import { Player } from "@/types/types";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Stats Look Up",
  openGraph: {
    title: "Stats Look Up",
  },
};

async function playerSearch(searchString: string) {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");
    const players = await db
      .collection<Player>("Players")
      .find({ discordNickname: { $regex: searchString, $options: "i" } })
      .limit(20)
      .sort({ discordNickname: 1 })
      .toArray();
    return players;
  } catch (error) {
    console.log("Error fetching from DB for player stats", error);
    return null;
  }
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: { search: string };
}) {
  const searchString = searchParams?.search;
  const players = searchString ? await playerSearch(searchString) : null;
  return (
    <div className="h-3/4">
      <div className="flex justify-center text-4xl font-bold">
        Player Stat Search
      </div>
      <div className="flex items-center justify-center w-full">
        <div className="md:w-1/2">
          <form>
            <label
              htmlFor="default-search"
              className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
            >
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-3">
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                  />
                </svg>
              </div>
              <input
                type="search"
                id="default-search"
                className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg ps-10 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                name="search"
                placeholder={
                  searchString ? searchString : "Search by Discord Name..."
                }
                required
              />
              <button
                type="submit"
                className="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                Search
              </button>
            </div>
          </form>
          <br />
          {players ? <StatSearchResults players={players} /> : ""}
        </div>
      </div>
    </div>
  );
}
