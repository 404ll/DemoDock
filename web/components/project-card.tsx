import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/utils"
import { useState, useEffect } from "react"
import { RequestAccessDialog } from "@/components/demos/request"
import { ExternalLink, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCurrentAccount } from "@mysten/dapp-kit"

// 使用与DisplayDemo接口一致的简化类型
interface Project {
  id: string
  name: string
  des: string
  profile: string,
  visitor_list?: string[] // 修改为可选，增加健壮性
}

interface ProjectCardProps {
  project: Project
  className?: string
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  const [requestSuccess, setRequestSuccess] = useState(false)
  const account = useCurrentAccount()
  const { toast } = useToast()
  const [isVisitor, setIsVisitor] = useState(false)
  
  // 检查当前用户是否在该 demo 的访问列表中
  useEffect(() => {
    if (!account?.address) {
      setIsVisitor(false);
      return;
    }
    
    // 增加防御性检查
    const visitorList = project.visitor_list || [];
    console.log(`检查用户 ${account.address} 是否在 Demo ${project.name} 的访问列表中:`, visitorList);
    
    const hasAccess = visitorList.includes(account.address);
    console.log(`访问结果: ${hasAccess ? '有权访问' : '无权访问'}`);
    
    setIsVisitor(hasAccess);
  }, [account?.address, project.visitor_list, project.name]);
  
  // 处理成功提交的请求
  const handleRequestSuccess = () => {
    setRequestSuccess(true);
    toast({
      title: "Request submitted",
      description: "Your access request has been submitted successfully!",
      duration: 3000,
    });
    
    // 可选：标记为已请求，避免重复请求
    // 也可以考虑刷新数据以获取最新的访问状态
  }
  
  // 处理请求错误
  const handleRequestError = (error: unknown) => {
    toast({
      title: "Request failed",
      description: "Failed to submit your access request. Please try again.",
      variant: "destructive",
      duration: 3000,
    });
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
          <span className="text-xs text-muted-foreground ml-2">创建者:{project.profile}</span>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <div className="flex w-full gap-2">
            {isVisitor ? (
              // 用户在当前demo的访问列表中 - 显示Details按钮
              <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white">
                <Link href={`/demo/${project.id}`}>
                  View Demo <Eye className="ml-2 h-4 w-4" />
                </Link>
              </Button>

            ) : (
              // 用户不在当前demo的访问列表中 - 显示Request按钮
              <div className="flex-1">
                <RequestAccessDialog
                  demoId={project.id}
                  trigger={
                    <Button className="w-full">
                      Request Access <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  }
                  onSuccess={handleRequestSuccess}
                  onError={handleRequestError}
                />
              </div>
            )}
          </div>
          
          {/* 请求成功提示 */}
          {requestSuccess && (
            <div className="w-full px-3 py-2 text-sm text-center bg-green-50 text-green-700 rounded-md">
              Request submitted successfully!
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
