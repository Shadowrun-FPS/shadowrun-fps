import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"

  export default function MatchCard(){
    return <Card>
      <CardHeader>
        <CardTitle>Match 1</CardTitle>
        <CardDescription>Match Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Player 1</p>
      </CardContent>
      <CardFooter>
        <p>Elapsed time: 10:32</p>
      </CardFooter>
    </Card>

  }