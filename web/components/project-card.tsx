import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle,CardFooter } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { RequestAccessDialog } from "@/components/demos/request"
import { ExternalLink, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCurrentAccount } from "@mysten/dapp-kit"

interface ProjectCardProps {
  project: {
    id?: string
    name: string       
    des: string    
    profile: string
    type?: string
    repo?: string
    visitor_list?: string[]
  }
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
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
    
    const hasAccess = visitorList.includes(account.address) || account.address === project.profile;
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
    <Card className="bg-card text-card-foreground shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
        <CardDescription>{project.des}</CardDescription>
      </CardHeader>
      <CardContent >
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {project.type && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {project.type}
            </span>
          )}
          <span className="text-xs text-muted-foreground">owner: {project.profile}</span>
        </div>

        {project.repo && (
          <div className="flex items-center mt-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 mr-1 text-muted-foreground"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
            <a
              href={project.repo.startsWith("http") ? project.repo : `${project.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary truncate max-w-[200px]"
            >
              {project.repo}
            </a>
          </div>
        )}
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
                demoId={project.id || ""}
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
  )
}

export default ProjectCard
