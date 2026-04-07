import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function RankingsLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-56 sm:h-10" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
        </div>
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-2 border-primary/20">
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-2 border-primary/20">
          <CardHeader className="space-y-3 pb-4">
            <Skeleton className="h-10 w-full max-w-md" />
          </CardHeader>
          <CardContent className="space-y-3 p-4 sm:p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
