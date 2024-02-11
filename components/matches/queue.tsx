import { Button } from "@/components/ui/button";

export default function Queue() {
  return (
    <div className="w-full max-w-sm mx-auto overflow-hidden border divide-y rounded-xl dark:divide-gray-800">
      <div className="flex items-center p-4">
        {/* <UsersIcon className="flex-shrink-0 w-6 h-6 mr-2" /> */}
        <div className="flex-1">
          <h3 className="font-semibold">2v2</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Two versus two matches
          </p>
        </div>
        <Button size="sm">Queue</Button>
      </div>
    </div>
  );
}
