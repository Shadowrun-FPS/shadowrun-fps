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
import { useAppContext } from "@/components/providers"

export function CreateTeamDialog() {
  const { addTeam, currentUser } = useAppContext()
  const [open, setOpen] = useState(false)
  const [teamName, setTeamName] = useState("")
  const [teamSize, setTeamSize] = useState(4)
  const [playerNames, setPlayerNames] = useState<string[]>(Array(4).fill(""))

  const handleTeamSizeChange = (value: number[]) => {
    const size = value[0]
    setTeamSize(size)
    setPlayerNames((prev) => {
      const newNames = [...prev]
      if (size > prev.length) {
        // Add empty strings for new players
        return [...newNames, ...Array(size - prev.length).fill("")]
      } else {
        // Remove extra players
        return newNames.slice(0, size)
      }
    })
  }

  const handlePlayerNameChange = (index: number, name: string) => {
    setPlayerNames((prev) => {
      const newNames = [...prev]
      newNames[index] = name
      return newNames
    })
  }

  const handleSubmit = () => {
    if (!teamName) return

    // Create players from names
    const players = playerNames.map((name, index) => ({
      id: `player-${Date.now()}-${index}`,
      name: name || `Player ${index + 1}`,
    }))

    // Add current user as first player if not already included
    if (!players.some((p) => p.id === currentUser?.id)) {
      players[0] = currentUser!
    }

    addTeam({
      name: teamName,
      members: players,
    })

    // Reset form
    setTeamName("")
    setTeamSize(4)
    setPlayerNames(Array(4).fill(""))
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Team</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background text-foreground">
        <DialogHeader>
          <DialogTitle>Create a new team</DialogTitle>
          <DialogDescription>Using the settings provided below.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="team-name" className="text-sm font-medium">
              Team Name
            </label>
            <Input
              id="team-name"
              placeholder="Team Name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
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
          {playerNames.map((name, index) => (
            <div key={index} className="grid gap-2">
              <label htmlFor={`player-${index}`} className="text-sm font-medium">
                {index === 0 ? "Your Name" : `Player ${index + 1} Name`}
              </label>
              <Input
                id={`player-${index}`}
                placeholder={`Player ${index + 1} Name`}
                value={index === 0 ? currentUser?.name || "" : name}
                onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                disabled={index === 0}
              />
            </div>
          ))}
        </div>
        <Button onClick={handleSubmit}>Submit</Button>
      </DialogContent>
    </Dialog>
  )
}

