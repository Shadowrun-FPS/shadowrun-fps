"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppContext } from "@/components/providers"

export function CreateTournamentDialog() {
  const { addTournament } = useAppContext()
  const [open, setOpen] = useState(false)
  const [tournamentName, setTournamentName] = useState("")
  const [tournamentDate, setTournamentDate] = useState("")
  const [bracket, setBracket] = useState("Open")
  const [format, setFormat] = useState("Round Robin")
  const [eloRange, setEloRange] = useState("Everyone (0-3000)")
  const [numTeams, setNumTeams] = useState(8)
  const [teamSize, setTeamSize] = useState(4)

  const handleNumTeamsChange = (value: number[]) => {
    setNumTeams(value[0])
  }

  const handleTeamSizeChange = (value: number[]) => {
    setTeamSize(value[0])
  }

  const handleSubmit = () => {
    if (!tournamentName || !tournamentDate) return

    addTournament({
      name: tournamentName,
      date: new Date(tournamentDate),
      bracket: bracket as "Open" | "Closed",
      format: format as "Round Robin" | "Single Elimination" | "Double Elimination",
      eloRange,
      teamSize,
      maxTeams: numTeams,
    })

    // Reset form
    setTournamentName("")
    setTournamentDate("")
    setBracket("Open")
    setFormat("Round Robin")
    setEloRange("Everyone (0-3000)")
    setNumTeams(8)
    setTeamSize(4)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Tournament</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background text-foreground">
        <DialogHeader>
          <DialogTitle>Create a new tournament</DialogTitle>
          <DialogDescription>Using the settings provided below.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="tournament-name" className="text-sm font-medium">
              Tournament Name
            </label>
            <Input
              id="tournament-name"
              placeholder="Tournament Name"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="tournament-date" className="text-sm font-medium">
              Tournament Date
            </label>
            <Input
              id="tournament-date"
              type="date"
              value={tournamentDate}
              onChange={(e) => setTournamentDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="bracket" className="text-sm font-medium">
              Bracket
            </label>
            <Select value={bracket} onValueChange={setBracket}>
              <SelectTrigger id="bracket">
                <SelectValue placeholder="Select bracket type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Open">Open</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Only Open Brackets are available for now.</p>
          </div>
          <div className="grid gap-2">
            <label htmlFor="format" className="text-sm font-medium">
              Format
            </label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger id="format">
                <SelectValue placeholder="Select tournament format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Round Robin">Round Robin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Only Round Robin is available for now.</p>
          </div>
          <div className="grid gap-2">
            <label htmlFor="elo-range" className="text-sm font-medium">
              Allowed Elo Tiers
            </label>
            <Select value={eloRange} onValueChange={setEloRange}>
              <SelectTrigger id="elo-range">
                <SelectValue placeholder="Select Elo range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Everyone (0-3000)">Everyone (0-3000)</SelectItem>
                <SelectItem value="Beginners (0-1000)">Beginners (0-1000)</SelectItem>
                <SelectItem value="Intermediate (1000-2000)">Intermediate (1000-2000)</SelectItem>
                <SelectItem value="Advanced (2000-3000)">Advanced (2000-3000)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Players within the elo range specified will be able to join.
            </p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Number of Teams</label>
            <div className="flex items-center justify-between">
              <span className="text-sm">2</span>
              <Slider
                value={[numTeams]}
                min={4}
                max={16}
                step={4}
                onValueChange={handleNumTeamsChange}
                className="mx-4 w-full"
              />
              <span className="text-sm">16</span>
            </div>
            <div className="text-center text-sm">{numTeams}</div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Team Size</label>
            <div className="flex items-center justify-between">
              <span className="text-sm">1</span>
              <Slider
                value={[teamSize]}
                min={1}
                max={5}
                step={1}
                onValueChange={handleTeamSizeChange}
                className="mx-4 w-full"
              />
              <span className="text-sm">5</span>
            </div>
            <div className="text-center text-sm">{teamSize}</div>
          </div>
        </div>
        <Button onClick={handleSubmit}>Submit</Button>
      </DialogContent>
    </Dialog>
  )
}

