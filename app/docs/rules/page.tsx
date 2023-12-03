import Link from "next/link";
import Image from "next/image";
import { DocHero } from "@/components/doc-hero";

export default function RankedRulesPage() {
  return (
    <div className="mt-8 lg:grid-cols-3 lg:flex dark:prose-invert">
      <div className="prose xl:mx-auto md:text-justify md:mx-auto lg:prose-xl dark:prose-invert">
        <h1>RANKED RULES</h1>
        <section id="game-setup-rules">
          <h2 className="pt-6">Game Setup Rules</h2>

          <ul>
            <li>
              Game 1 - The team indicated by the bot has the first choice of
              side OR server.
            </li>
            <li>
              Game 2 - The other team than that indicated by the bot has the
              choice of side OR server.
            </li>
            <li className="mb-0">
              Game 3 - The team that has won the most total rounds* between
              games 1 & 2 will choose EITHER the Side, OR Server, and the other
              team will receive the remaining choice of Side, or Server.
            </li>
            <p className="mt-0 text-base italic indent-8 not-prose">
              *In the event of a tie in rounds won between games 1 & 2, a coin
              will be flipped to determine who gets the first choice of Side, or
              Server.
            </p>
          </ul>
        </section>
        <section id="approved-ranked-map-pool">
          <h3 className="pt-6">Approved Ranked Map Pool:</h3>
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
        </section>
        <section id="ranked-rules">
          <h2 className="pt-6">RANKED RULES</h2>
          <div className="list-decimal">
            <li>No arguing with the bot; youll look a fool.</li>
            <li>
              Once a match has been created by the bot, the match must be played
              out with the teams that have been created. If a player attempts to
              queue dodge after teams have been created, then that player will
              be penalized per the Penalties section of the rules.
            </li>
            <li>
              Once a match begins, you must play for the entirety of the match.
              Leaving a match early will result in the offender being penalized
              per the Penalties section of the rules.
            </li>
            <li>
              Any acts of griefing will be penalized in accordance with the
              Penalties section of the rules.
            </li>
            <li>
              Any manipulation of frame rate in-game to increase jump height is
              not allowed and offenders will be penalized in accordance with the
              Penalties. section of the rules.
            </li>
            <li>
              If a player makes an accidental purchase (ex: elf buying a tree)
              then the game may be restarted as long as no in game
              fights/engagements have taken place. If an engagement has taken
              place (regardless of whether or not a kill was recorded) then the
              game will continue on as is.
            </li>
            <li>
              If an outside player (a player who is NOT a participant on either
              team roster) joins a Ranked match in progress, the host of the
              game must ensure the outsider is removed from the game prior to
              the start of the following round.
            </li>
            <li>
              If a player gets disconnected from the lobby, the round that the
              player disconnected will be completed as a 4v3. The following
              round, the player will be given a 3 minute grace period to rejoin
              the game by way of all players AFKing in spawn until 1 minute
              remains in the round (If the bot makes it to enemy spawn then the
              bot can be killed). If the player has not rejoined after the grace
              period, then the rest of the match will continue on as a 4v3.
            </li>
            <li>
              If the SERVER drops/disconnects and the game is on round 3 or
              less, then the game will be restarted as a new game with a
              different server chosen. If round 3 has been completed prior to
              server disconnect, then you will have the option to either: A.
              Suicide to the score prior to the disconnect. OR B. End the game
              and come to a Gentlemans Agreement as a lobby on how the game
              should be scored.
            </li>
            <li>
              If the server disconnects more than once, then a 6-3* will be
              awarded to the team that did not have server (or a comparable
              score if a Gentlemans Agreement can be reached).
            </li>
            <ul>
              <p>
                *- This rule has been written in the event that a Gentlemans
                Agreement cannot be reached when a dispute occurs.
              </p>
            </ul>
          </div>
        </section>
        <section id="penalties">
          <h2 className="pt-6">PENALTIES </h2>
        </section>
        <section id="leaving-early">
          <h3 className="pt-2">LEAVING EARLY:</h3>
          <p>
            Offense must be called out to Staff (via DM) by at least 1 of the
            other 7 players involved in the match, regardless of the reason for
            leaving, in order for any potential ban to take effect.
          </p>

          <p>
            Staff will then conduct a review. Once a review is completed, if it
            has been determined that a ban is necessary, the offender will
            receive a ban beginning at the time of infraction through the end of
            the following day for first offenders. If a player is a repeat
            offender, an additional 24 hours will be added for every subsequent
            offense. Repeat offenders and/or extreme cases may be subject to
            longer/more severe bans.
          </p>

          <p>
            MATCH TO BE SCORED - Call out to Staff IMMEDIATELY and score all
            completed games normally. Staff and remaining participants will then
            determine how any incomplete games shall be scored. The match may
            then be subject to Elo adjustment if Participants & Staff deem
            necessary.
          </p>
        </section>
        <section id="griefing">
          <h3 className="pt-2">GRIEFING:</h3>
          <p>
            Teammates of the accused griefer are to vote on whether or not the
            player was intentionally griefing. If all 3 players vote that the
            accused player is intentionally griefing, then the evidence must be
            submitted to Staff (via DM) for review.
          </p>

          <p>
            Once a review is completed, if found guilty, the offender will
            receive a ban beginning at the time of infraction through the end of
            the following day for first offenders. If a player is a repeat
            offender, an additional 24 hours will be added for every subsequent
            offense. Repeat offenders and/or extreme cases may be subject to
            longer/more severe bans.
          </p>

          <p>
            MATCH TO BE SCORED - The match may then be subject to Elo adjustment
            if Participants & Staff deem necessary.
          </p>
        </section>
        <section id="queue-dodging">
          <h3 className="pt-6">QUEUE DODGING:</h3>
          <p>
            Game participants (the lobby of players) of the accused queue dodger
            are to vote on whether or not the player was intentionally queue
            dodging. If 4/7 players vote that the accused player is
            intentionally queue dodging, then the evidence must be submitted to
            Staff (via DM) for review.{" "}
          </p>

          <p>
            Once a review is completed, if found guilty, the offender will
            receive a ban beginning at the time of infraction through the end of
            the following day for first offenders. If a player is a repeat
            offender, an additional 24 hours will be added for every subsequent
            offense. Repeat offenders and/or extreme cases may be subject to
            longer/more severe bans.
          </p>
        </section>
        <p>DODGED MATCH WILL BE DELETED BY STAFF</p>
        <section id="frame-manipulation">
          <h3 className="pt-6">FRAME MANIPULATION:</h3>
          <p>
            If a player is caught manipulating their frame rate to increase jump
            height, the offense must be called out to Staff (via DM) by at least
            1 of the other 7 players involved in the match and evidence must be
            submitted to Staff (via DM) for review.
          </p>

          <p>
            Once a review is completed, if found guilty, the offender will
            receive a ban beginning at the time of infraction through the end of
            the following day for first offenders. If a player is a repeat
            offender, an additional 24 hours will be added for every subsequent
            offense. Repeat offenders and/or extreme cases may be subject to
            longer/more severe bans.
          </p>
        </section>
      </div>
    </div>
  );
}
