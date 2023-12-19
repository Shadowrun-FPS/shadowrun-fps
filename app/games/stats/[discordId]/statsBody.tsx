import { PlayerStats } from "@/types/types";
import moment from 'moment';
import RankIcon from "@/components/rankicon";


export default function StatsBody (params: {stats: PlayerStats[]}) {
    const stats = params.stats;
    if (!stats || stats.length == 0) return (<></>)

    let highestEloStat = stats[0];
    for (const stat of stats) {
        if (stat.elo > highestEloStat.elo) {
            highestEloStat = stat;
        }
    }

    let rows = [];
    rows.push(
        <div className="flex items-center justify-center md:ml-10 md:pl-10">
            <div>
                <br/>
                <div className="flex items-center justify-center pl-10 text-2xl md:pl-0">
                    Highest Ranking Stats: {highestEloStat.teamSize}v{highestEloStat.teamSize}
                </div>
                <br />
                <div className="pl-10 md:pl-0">
                    <div className="flex text-xl">ELO:&nbsp;<div className="flex">{RankIcon(highestEloStat.elo)} {highestEloStat.elo}</div></div>
                    <div className="text-xl">Wins: {highestEloStat.wins}</div>
                    <div className="text-xl">Losses: {highestEloStat.losses}</div>
                    <br />
                    <div className="text-sm">Last Match Played: {moment(highestEloStat.lastMatchDate).format('MMM Do YYYY')}</div>
                </div>
                <br />
            </div>
        </div>
    )
    for (const stat of stats) {
        if (stat.teamSize == highestEloStat.teamSize) continue;

        rows.push(
            <div className={"flex items-center justify-center border-t-4" + (rows.length % 2 ? " md:border-r-4 md:pl-10" : "")}>
                <div>
                    <br />
                    <div className="text-2xl">{stat.teamSize}v{stat.teamSize} Stats</div>
                    <br />
                    <div className="flex text-xl">ELO:&nbsp;{RankIcon(stat.elo)} {stat.elo}</div>
                    <div className="text-xl">Wins: {stat.wins}</div>
                    <div className="text-xl">Losses: {stat.losses}</div>
                    <br />
                    <div className="text-sm">Last Match Played: {moment(stat.lastMatchDate).format('MMM Do YYYY')}</div>
                    <br />
                </div>
            </div>
        )
    }

    return rows;
}