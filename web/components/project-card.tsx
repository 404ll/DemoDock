import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/utils"
import { useState } from "react"
import { RequestAccessDialog } from "@/components/demos/request"
import { ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
  const [requestSuccess, setRequestSuccess] = useState(false)
  const { toast } = useToast()
  // 处理成功提交的请求
  const handleRequestSuccess = () => {
    setRequestSuccess(true)
    toast({
      title: "Request submitted",
      description: "Your access request has been submitted successfully!",
      duration: 3000,
    })
  }
  
  // 处理请求错误
  const handleRequestError = (error: unknown) => {
    toast({
      title: "Request failed",
      description: "Failed to submit your access request. Please try again.",
      variant: "destructive",
      duration: 3000,
    })
  }

  return (
   <div>
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
        <CardFooter className="flex flex-col gap-2">
        <div className="flex w-full gap-2">

          {/* 请求访问按钮，打开弹窗 */}
          <div className="flex-1">
            <RequestAccessDialog
              demoId={project.id}
              trigger={
                <Button className="w-full">
                  Request <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              }
              onSuccess={handleRequestSuccess}
              onError={handleRequestError}
            />
          </div>
        </div>
        
      </CardFooter>
      </Card>
    </div>
  )
}
