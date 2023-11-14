import Link from "next/link";
import Image from "next/image";

export default function RankedRulesPage() {
  return (
    <div className="mt-16 ml-16 prose lg:prose-xl dark:prose-invert">
      <h1>RANKED RULES</h1>

      <h2>Game Setup Rules</h2>
      <ul>
        <li>
          Game 1 - The team indicated by the bot has the first choice of side OR
          server.
        </li>
        <li>
          Game 2 - The other team than that indicated by the bot has the choice
          of side OR server.
        </li>
        <li className="mb-0 not-prose">
          Game 3 - The team that has won the most total rounds* between games 1
          & 2 will choose EITHER the Side, OR Server, and the other team will
          receive the remaining choice of Side, or Server.
        </li>
        <p className="mt-0 text-base italic indent-8 not-prose">
          *In the event of a tie in rounds won between games 1 & 2, a coin will
          be flipped to determine who gets the first choice of Side, or Server.
        </p>
      </ul>

      <h3>Approved Ranked Map Pool:</h3>
      <ul>
        <li>Attrition or Extraction</li>
        <li>Nerve Center (Small)</li>
        <li>Nerve Center</li>
        <li>Lobby (Small)</li>
        <li>Lobby</li>
        <li>Pinnacle</li>
        <li>Poco</li>
        <li>Power Station</li>
      </ul>

      <h2>RANKED RULES</h2>
      <p>No arguing with the bot; you'll look a fool.</p>
      <p>
        Once a match has been created by the bot, the match must be played out
        with the teams that have been created. If a player attempts to queue
        dodge after teams have been created, then that player will be penalized
        per the "Penalties" section of the rules.
      </p>

      <h2>PENALTIES </h2>

      <h3>LEAVING EARLY:</h3>
      <p>
        Offense must be called out to Staff (via DM) by at least 1 of the other
        7 players involved in the match, regardless of the reason for leaving,
        in order for any potential ban to take effect.
      </p>

      <p>
        Staff will then conduct a review. Once a review is completed, if it has
        been determined that a ban is necessary, the offender will receive a ban
        beginning at the time of infraction through the end of the following day
        for first offenders. If a player is a repeat offender, an additional 24
        hours will be added for every subsequent offense. Repeat offenders
        and/or extreme cases may be subject to longer/more severe bans.
      </p>

      <p>
        MATCH TO BE SCORED - Call out to Staff IMMEDIATELY and score all
        completed games normally. Staff and remaining participants will then
        determine how any incomplete games shall be scored. The match may then
        be subject to Elo adjustment if Participants & Staff deem necessary.
      </p>

      <h3>GRIEFING:</h3>
      <p>
        Teammates of the accused griefer are to vote on whether or not the
        player was intentionally griefing. If all 3 players vote that the
        accused player is intentionally griefing, then the evidence must be
        submitted to Staff (via DM) for review.
      </p>

      <p>
        Once a review is completed, if found guilty, the offender will receive a
        ban beginning at the time of infraction through the end of the following
        day for first offenders. If a player is a repeat offender, an additional
        24 hours will be added for every subsequent offense. Repeat offenders
        and/or extreme cases may be subject to longer/more severe bans.
      </p>

      <p>
        MATCH TO BE SCORED - The match may then be subject to Elo adjustment if
        Participants & Staff deem necessary.
      </p>

      <h3>QUEUE DODGING:</h3>
      <p>
        Game participants (the lobby of players) of the accused queue dodger are
        to vote on whether or not the player was intentionally queue dodging. If
        4/7 players vote that the accused player is intentionally queue dodging,
        then the evidence must be submitted to Staff (via DM) for review.{" "}
      </p>

      <p>
        Once a review is completed, if found guilty, the offender will receive a
        ban beginning at the time of infraction through the end of the following
        day for first offenders. If a player is a repeat offender, an additional
        24 hours will be added for every subsequent offense. Repeat offenders
        and/or extreme cases may be subject to longer/more severe bans.
      </p>

      <p>DODGED MATCH WILL BE DELETED BY STAFF</p>

      <h3>FRAME MANIPULATION:</h3>
      <p>
        If a player is caught manipulating their frame rate to increase jump
        height, the offense must be called out to Staff (via DM) by at least 1
        of the other 7 players involved in the match and evidence must be
        submitted to Staff (via DM) for review.
      </p>

      <p>
        Once a review is completed, if found guilty, the offender will receive a
        ban beginning at the time of infraction through the end of the following
        day for first offenders. If a player is a repeat offender, an additional
        24 hours will be added for every subsequent offense. Repeat offenders
        and/or extreme cases may be subject to longer/more severe bans.
      </p>
    </div>
  );
}
