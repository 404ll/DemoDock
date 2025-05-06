import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/utils"

// 使用与DisplayDemo接口一致的简化类型
interface Project {
  id: string
  name: string
  des: string
  profile: string
}

interface ProjectCardProps {
  project: Project
  className?: string
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  return (
    <Link href={`/project/${project.id}`}>
      <Card className={cn("overflow-hidden transition-all hover:shadow-md", className)}>
        <CardHeader className="p-4 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold line-clamp-1">{project.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{project.des}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex items-center">
          <Avatar className="h-6 w-6">
            <AvatarImage src={project.profile || "/placeholder.svg"} alt={project.name} />
            <AvatarFallback>{project.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground ml-2">创建者:{project.profile}</span>
        </CardContent>
      </Card>
    </Link>
  )
}
