import { BASE_URL } from "@/lib/baseurl";
import Image from "next/image";
import RankIcon from "@/components/rankicon";
import StatsBody from "./statsBody";
import clientPromise from "@/lib/mongodb";

const getPlayerInfo = (async (discordId: string | string[] | undefined) => {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");
    const player = await db.collection("Players").findOne({discordId: discordId});
    return player;
  } catch (error) {
    return {discordNickname: "", discordProfilePicture: "", stats: []};
  }
});


export default async function PlayerStatPage({params}: {params: {discordId: string}}) {
  const {discordId} = params;
  const playerInfo = await getPlayerInfo(discordId);
  const discordNickname = playerInfo?.discordNickname;
  const discordProfilePicture = playerInfo?.discordProfilePicture;
  return (
    <>
        <div className="flex items-center justify-center bg-slate-900">
            <div className="grid m-10 xl:w-1/2 md:grid-cols-2 md:m-10 sm:grids-cols-1">
                <div className="flex flex-col items-center justify-center px-5 border-b-4 md:border-r-4 md:border-b-0">
                    <Image src={discordProfilePicture} width='254' height='254' alt={discordNickname + "Profile Picture"} className="rounded-full"/>
                    <div className="my-4 text-3xl text-center text">{discordNickname}</div>
                </div>
                <StatsBody stats={playerInfo?.stats}/>
            </div>
        </div>
        </>
  );
};