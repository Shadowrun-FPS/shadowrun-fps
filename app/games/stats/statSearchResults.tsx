import Image from "next/image";
import { Player } from "@/types/types";
import { BASE_URL } from "@/lib/baseurl";

export default function StatSearchResults ({players}: {players: Player[]}) {
    const statsUrl = BASE_URL + "/games/stats/"
    if (!players) return <></>
    return (
    <>
        <div className="w-full md:h-[65vh] h-[55vh] overflow-y-auto shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500 rtl:text-right dark:text-gray-400">
                <thead className="sticky top-0 text-xs text-gray-700 bg-gray-300 dark:bg-slate-700 dark:text-gray-400">
                    <tr key="header">
                    <th scope="col" className="px-6 py-3" key="Player ID">
                        Results
                    </th>
                    </tr>
                </thead>
                <tbody>
                {players.map((player)=> (
                    <tr
                        className="border-b odd:bg-white odd:dark:bg-slate-900 even:bg-gray-100 even:dark:bg-slate-800 dark:border-slate-700"
                        key={player.discordId}
                    >
                        <a href={statsUrl + player.discordId}>
                            <th
                            scope="row"
                            className="flex items-center px-6 py-4 text-xl font-medium text-gray-900 whitespace-pre dark:text-white"
                            >
                                <Image src={player.discordProfilePicture} alt={" "} width="24" height="0" className="rounded-full"/>
                                &nbsp;
                                    {player.discordNickname}
                            </th>
                        </a>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    </>);
}