import { Users, FolderKanban, TrendingUp, Clock } from "lucide-react"

interface StatsOverviewProps {
  totalProjects: number
  totalDevelopers: number
  className?: string
}

export function StatsOverview({ totalProjects, totalDevelopers, className }: StatsOverviewProps) {
  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
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

      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-green-500/10 p-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <div className="font-medium">Trending</div>
        </div>
        <div className="mt-3 text-2xl font-bold">{Math.round(totalProjects * 0.3)}</div>
        <div className="text-xs text-muted-foreground mt-1">Projects gaining popularity</div>
      </div>

      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-purple-500/10 p-2">
            <Clock className="h-4 w-4 text-purple-500" />
          </div>
          <div className="font-medium">New This Week</div>
        </div>
        <div className="mt-3 text-2xl font-bold">{Math.round(totalProjects * 0.15)}</div>
        <div className="text-xs text-muted-foreground mt-1">Recently added projects</div>
      </div>
    </div>
  )
}
