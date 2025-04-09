import { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Ranked Rules | Shadowrun FPS",
  description:
    "Official rules for Shadowrun FPS ranked matches and tournaments",
  openGraph: {
    title: "Ranked Rules | Shadowrun FPS",
    description:
      "Official rules for Shadowrun FPS ranked matches and tournaments",
  },
};

export default function RankedRulesPage() {
  return (
    <div className="container max-w-4xl py-8 mx-auto">
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="mb-8 text-4xl font-bold tracking-tight">RANKED RULES</h1>

        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="text-2xl">Game Setup Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="pl-5 space-y-3 list-decimal">
              <li>
                Game 1 - The team indicated by the Bot gets the first choice of
                Side OR Server.
              </li>
              <li>
                Game 2 - The team that wasn&apos;t chosen by the Bot gets the
                choice of Side OR Server.
              </li>
              <li className="mb-4">
                Game 3 - The team that has won the most total rounds* between
                games 1 & 2 will choose the Side OR Server. Whichever isn&apos;t
                chosen will be decided by the other team.
                <p className="mt-2 text-sm italic text-muted-foreground">
                  *In the event of a tie in rounds won, a coin will be flipped
                  to determine who gets the first choice of Side or Server.
                </p>
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="text-2xl">Approved Ranked Map Pool</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The following list contains the approved Ranked Map Pool:</p>
            <ul className="pl-5 mt-4 space-y-2 list-disc">
              <li>Attrition or Extraction</li>
              <li>Nerve Center (Small)</li>
              <li>Nerve Center</li>
              <li>Lobby (Small)</li>
              <li>Lobby</li>
              <li>Maelstrom</li>
              <li>Pinnacle</li>
              <li>Power Station</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="text-2xl">RANKED RULES</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="pl-5 space-y-4 list-decimal">
              <li>
                Once a queue pops (has the 8 players required to fire a match)
                you will have 5 minutes from the time the queue pops to join
                BOTH the Discord voice chat AND the in-game lobby. (You should
                also receive a direct message from ShadowrunBotTS to indicate
                when your match is ready.) Failure of a player to join within
                this 5 minute span will result in the player being removed from
                the queue once the 5 minute time period has passed.
              </li>
              <li>
                No arguing with the bot, you&apos;ll look a fool. However, if
                you ARE going to argue with the bot about the map choice (ie:
                replace a Bot map with a different available map in the ranked
                map pool), then it must be agreed upon by ALL 8 participating
                players, and it must be agreed upon BEFORE game 1 of the series
                has begun, else match will be subject to deletion and ELO
                correction.
              </li>
              <li>
                Once a match has been created by the Bot, the match must be
                played out with the teams that have been created. If a player
                attempts to queue dodge after teams have been created then that
                player will be penalized per the &quot;Penalties&quot; section
                of the rules.
              </li>
              <li>
                The in-game Party Leader must join the opposing team&apos;s
                voice chat to verify that ALL players are ready (races chosen,
                everybody here, ready to start) BEFORE starting the countdown to
                begin a game. Once the 5 second countdown to start the match
                begins, you may not change your race. (Races will still be
                locked to original choices in the event of a game restart)
              </li>
              <li>
                Once a match begins, you must play for the entirety of the
                match. Leaving a match early will result in the offender being
                penalized per the &quot;Penalties&quot; section of the rules.
              </li>
              <li>
                Any acts of griefing will be penalized in accordance with the
                &quot;Penalties&quot; section of the rules.
              </li>
              <li>
                Any manipulation of frame rate in-game to increase jump height
                is not allowed and offenders will be penalized in accordance
                with the &quot;Penalties&quot; section of the rules.
              </li>
              <li>
                If a player makes an accidental purchase (ex: Elf buying a Tree
                of Life) then the game may be restarted as long as no in game
                fights/engagements have taken place. If an engagement has taken
                place (regardless of whether or not a kill was recorded) then
                the game will continue on as is.
              </li>
              <li>
                If an outside player (a player who is NOT a participant on
                either team&apos;s roster) joins a Ranked match in progress, the
                host of the game must ensure the outsider is removed from the
                game prior to the start of the following round.
              </li>
              <li>
                If a player gets disconnected from the lobby, the round that the
                player disconnected will be completed as a 4v3. The following
                round, the player will be given a 3 minute grace period to
                rejoin the game by way of all players AFK&apos;ing in spawn
                until 1 minute remains in the round (If the bot makes it to
                enemy spawn then the bot can be killed). If the player has not
                rejoined after the grace period, then the rest of the match will
                continue on as a 4v3.
              </li>
              <li>
                If the Server drops/disconnects and the game is on round 3 or
                less, then the game will be restarted as a new game with a
                different server chosen. If round 3 has been completed prior to
                server disconnect, then you will have the option to either:
                <ul className="pl-5 mt-3 space-y-3 list-disc">
                  <li className="ml-5">
                    A. Suicide to the score prior to the disconnect.
                  </li>
                  <p className="font-medium text-center">OR</p>
                  <li className="ml-5">
                    B. End the game and come to a Gentleman&apos;s Agreement as
                    a lobby on how the game should be scored.
                  </li>
                </ul>
              </li>
              <li>
                If the server host team&apos;s server disconnects more than once
                (regardless of whether or not it is the same player on that
                team), that team will then have the option to:
                <ul className="pl-5 mt-3 space-y-3 list-disc">
                  <li className="ml-5">
                    A. Pass server to the opposing team to avoid an automatic
                    forfeit.
                  </li>
                  <p className="font-medium text-center">OR</p>
                  <li className="ml-5">
                    B. Accept an automatic forfeit and score the match as a 6-3*
                    defeat (or a comparable score if a Gentleman&quot;s
                    Agreement can be reached).
                  </li>
                </ul>
                <p className="mt-3 text-sm italic text-muted-foreground">
                  * This score of 6-3 has been provided in the event that a
                  Gentleman&apos;s Agreement cannot be reached when a dispute
                  occurs.
                </p>
              </li>
            </ol>
          </CardContent>
        </Card>

        <h2 className="pb-2 mt-12 mb-6 text-3xl font-bold border-b">
          PENALTIES
        </h2>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">GRIEFING</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Teammates of the accused griefer are to vote on whether or not the
              player was intentionally griefing. If all 3 players vote that the
              accused player is intentionally griefing, then the evidence must
              be submitted to Staff (via DM) for review.
            </p>

            <p>
              Once a review is completed, if found guilty, offender will receive
              ban beginning at the time of infraction through the end of the
              following day for first offenders. If a player is a repeat
              offender, an additional 24 hours will be added for every
              subsequent offense. Repeat offenders and/or extreme cases may be
              subject to longer/more severe bans.
            </p>

            <p className="font-semibold">
              MATCH TO BE SCORED - The match may then be subject to ELO
              adjustment if Participants & Staff deem necessary.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">QUEUE DODGING</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Game participants (the lobby of players) of the accused queue
              dodger are to vote on whether or not the player was intentionally
              queue dodging. If 4/7 players vote that the accused player is
              intentionally queue dodging, then the evidence must be submitted
              to Staff (via DM) for review.
            </p>

            <p>
              Once a review is completed, if found guilty, offender will receive
              ban beginning at the time of infraction through the end of the
              following day for first offenders. If a player is a repeat
              offender, an additional 24 hours will be added for every
              subsequent offense. Repeat offenders and/or extreme cases may be
              subject to longer/more severe bans.
            </p>

            <p className="font-semibold">
              DODGED MATCH WILL BE DELETED BY STAFF
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">FRAME MANIPULATION</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              If a player is manipulating their frame rate to increase jump
              height or increase grenade throw distance, the offense must be
              called out to Staff (via DM) by at least 1 of the other 7 players
              involved in the match and evidence must be submitted to Staff (via
              DM) for review. Jonno cannot frame jump, this is an absolute rule
              for all eternity.
            </p>

            <p>
              Once a review is completed, if found guilty, offender will receive
              ban beginning at the time of infraction through the end of the
              following day for first offenders. If a player is a repeat
              offender, an additional 24 hours will be added for every
              subsequent offense. Repeat offenders and/or extreme cases may be
              subject to longer/more severe bans.
            </p>

            <p className="font-semibold">
              MATCH TO BE SCORED - The match may then be subject to Elo
              adjustment if Participants & Staff deem necessary.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">NON-ROSTERED PLAYER JOINS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              If an outside player (a player who is NOT a participant on either
              team&apos;s roster) joins a Ranked match in progress, the host of
              the game must ensure the outsider is removed from the game prior
              to the start of the following round.
            </p>

            <p>
              If the outside player is not removed prior to the start of the
              round following that of which they joined, an automatic round loss
              will be applied to the lobby Host&apos;s team via suicide after
              the outside player has been removed.
            </p>

            <p className="font-semibold">
              MATCH TO BE SCORED - The match may be subject to Elo adjustment if
              Participants & Staff deem necessary.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">LEAVING EARLY</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Offense must be called out to Staff via DM, or brought to our
              attention in some other form by at least 1 of the other 7 players
              involved in the match, regardless of the reason for leaving, in
              order for any potential ban to take effect.
            </p>

            <p>
              Staff will then conduct a review. Once a review is completed, if
              it has been determined that a ban is necessary, offender will
              receive ban beginning at the time of infraction through the end of
              the following day for first offenders. If a player is a repeat
              offender, an additional 24 hours will be added for every
              subsequent offense. Repeat offenders and/or extreme cases may be
              subject to longer/more severe bans.
            </p>

            <p className="font-semibold">
              MATCHES ARE TO BE SCORED AS FOLLOWS IN THE EVENT THAT A GA CANNOT
              BE REACHED AND AGREED UPON BY ALL 7 REMAINING PARTICIPANTS:
            </p>

            <div className="pl-4 mt-4 space-y-4 border-l-2 border-primary/30">
              <p>
                If a player leaves/quits before the completion of Round 3 of
                Game 1: The match shall be deleted. Quitter will then receive
                appropriate punishment.
              </p>

              <p>
                If a player leaves/quits after the completion of Round 3 in Game
                1, but before the end of Game 1: The quitter&apos;s team shall
                receive credit for any rounds won during Game 1, and the
                opposing team shall be awarded the victory for Game 1. Game 2
                score will then mirror that of Game 1. (Ex: G1 scored 6-2, G2
                will then be scored 6-2.) Quitter will then receive appropriate
                punishment.
              </p>

              <p>
                Player leaves/quits after Game 1, but before start of Game 2:
                Game 1 will be scored normally, Game 2 score will mirror that of
                Game 1. Quitter will then receive appropriate punishment.
              </p>

              <p>
                Player leaves/quits at any point during Game 2: The
                quitter&apos;s team shall receive credit for any rounds won
                during Game 2, and the opposing team shall be awarded the
                victory for Game 2. Game 1 will be scored normally and Game 3
                score (if Game 3 is necessary) will then mirror the score of
                Game 2. Quitter will then receive appropriate punishment.
              </p>

              <p>
                If a player leaves/quits after Game 2, but before start of Game
                3: Games 1 and 2 will be scored normally, Game 3 score will
                mirror that of Game 2. Quitter will then receive appropriate
                punishment.
              </p>

              <p>
                Player leaves/quits at any point during Game 3: The
                quitter&apos;s team shall receive credit for any rounds won
                during Game 3, and the opposing team shall be awarded the
                victory for Game 3. Games 1 and 2 will be scored normally.
                Quitter will then receive appropriate punishment.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
