'use client';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation";
import { teamSizeDefault, teamSizeOptions } from "./common";


export default function TeamSizeMenu () {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentTeamSizeString = !searchParams.get('teamSize') ? teamSizeDefault : searchParams.get('teamSize');
    const currentTeamSizeHeadString = currentTeamSizeString + "v" + currentTeamSizeString;
    
    function handleClick(nextTeamSizeString: string) {
        if (currentTeamSizeString === nextTeamSizeString) return;
        router.push("/leaderboard/?teamSize=" + nextTeamSizeString);
    }

    return (
        <>
            <div className="flex self-center px-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="default" className="h-full px-5 py-0 my-0 text-2xl" key={currentTeamSizeString}>
                            <b>{" "}{currentTeamSizeHeadString}</b>
                            <ChevronDown
                            className="text-slate-500 top-[1px] h-5 w-5"
                            aria-hidden="true"
                            />
                            <span className="sr-only">Select Leaderboard based on Team Size</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center">
                        {teamSizeOptions.map((teamSize)=>
                            <DropdownMenuItem className="text-lg text-center" onClick={()=>handleClick(teamSize.toString())} key={teamSize}>
                                {teamSize}v{teamSize}
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </>
    )
}