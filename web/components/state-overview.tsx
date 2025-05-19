import { Users, FolderKanban, TrendingUp, Clock } from "lucide-react"

interface StatsOverviewProps {
  totalProjects: number
  totalDevelopers: number
  className?: string
}

export function StatsOverview({ totalProjects, totalDevelopers, className }: StatsOverviewProps) {
  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-2 ${className}`}>
      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary/10 p-2">
            <FolderKanban className="h-4 w-4 text-primary" />
          </div>
          <div className="font-medium">Total Projects</div>
        </div>
        <div className="mt-3 text-2xl font-bold">{totalProjects}</div>
        <div className="text-xs text-muted-foreground mt-1">From {totalDevelopers} developers</div>
      </div>

      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-blue-500/10 p-2">
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div className="font-medium">Active Developers</div>
        </div>
        <div className="mt-3 text-2xl font-bold">{totalDevelopers}</div>
        <div className="text-xs text-muted-foreground mt-1">Contributing to the ecosystem</div>
      </div>
    </div>
  )
}
