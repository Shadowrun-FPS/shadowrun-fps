import RankIcon from "@/components/rankicon";

type PlayerStatProps = {
    playerId: string;
    elo: number;
    wins: number;
    losses: number;
    ratio: number;
}

export default function formatPlayerStats (playerStats: PlayerStatProps[], startingRankNumber: number, descending: boolean) {
    const rows = [];
    const directionModifier = descending ? 1 : -1;
    
    for (var i = 0; i < playerStats.length; i++) {
        rows.push(
            <tr className="border-b odd:bg-white odd:dark:bg-slate-900 even:bg-gray-100 even:dark:bg-slate-800 dark:border-slate-700" key={playerStats[i].playerId}>
                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {startingRankNumber + (descending ? 1 : 0) + (i * directionModifier)}.{" "}{playerStats[i].playerId}
                </th>
                <td className="px-6 py-4">
                    {RankIcon(playerStats[i].elo)} {playerStats[i].elo}
                </td>
                <td className="px-6 py-4">
                    {playerStats[i].wins}
                </td>
                <td className="px-6 py-4">
                    {playerStats[i].losses}
                </td>
                <td className="px-6 py-4">
                    {playerStats[i].ratio}
                </td>
            </tr>
        )
    }

    
    return <tbody>{rows}</tbody>
}