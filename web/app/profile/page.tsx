"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Download,
  Eye,
  FileText,
  Key,
  Lock,
  Shield,
  Unlock,
  Video,
  Upload,
  ExternalLink,
} from "lucide-react"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { loadMockUserProjects } from "@/lib/mock-data"
import { useRouter } from "next/navigation"
import { getProfileByUser } from "@/contracts/query"
import type { Project } from "@/types/index"

export default function ProjectPage() {
  const account = useCurrentAccount()
  const router = useRouter()
  const [userProjects, setUserProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [hasAccess, setHasAccess] = useState(true)
  const [isRequesting, setIsRequesting] = useState(false)
  const [accessRequested, setAccessRequested] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [demoAccount, setDemoAccount] = useState("")

  const fetchDemoAddress = async () => {
    try {
      if (account) {
        const profile = await getProfileByUser(account.address)
        if (profile) {
          setDemoAccount(String(profile.id.id))
        }
      }
    } catch (error) {
      console.error("获取用户资料失败:", error)
    }
  }

  useEffect(() => {
    fetchDemoAddress()
  }, [account])

  // 获取用户项目
  useEffect(() => {
    if (!account) {
      // 如果没有连接钱包，重定向到首页
      router.push("/")
      return
    }

    const fetchUserProjects = async () => {
      setIsLoading(true)
      try {
        // 使用loadMockUserProjects获取用户的项目
        const projects = await loadMockUserProjects(account.address)
        console.log("获取到的项目:", projects)
        // 设置获取到的项目
        setUserProjects(projects)
        if (projects.length > 0) {
          setSelectedProject(projects[0])
          // 默认已有访问权限
          setHasAccess(true)
        }
      } catch (error) {
        console.error("获取项目失败:", error)
        // 加载失败时使用默认数据
        const fallbackProjects: Project[] = [
          {
            id: "default-1",
            name: "示例项目",
            des: "这是一个默认示例项目，由于无法获取您的真实项目而创建",
            type: "demo",
            repo: "",
            profile: account.address.slice(0, 8),
            visitor_list: [],
          },
        ]

        setUserProjects(fallbackProjects)
        setSelectedProject(fallbackProjects[0])
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProjects()
  }, [account, router])


  // 加载中状态
  if (isLoading) {
    return (
      <div className="container max-w-6xl py-12">
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-96 w-full rounded-lg" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 无项目状态
  if (userProjects.length === 0) {
    return (
      <div className="container max-w-6xl py-16 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-muted inline-flex p-4 rounded-full mb-6">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-3xl font-bold mb-4">You haven't created any projects yet.</h2>
          <p className="text-muted-foreground mb-8">Start creating your first Demo, showcase your creativity and share it with others!</p>
          <Button asChild size="lg" className="gap-2">
            <Link href="/upload">
              <Upload className="h-4 w-4" />
              Create New Demo
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // 项目未找到状态
  if (!selectedProject) {
    return (
      <div className="container max-w-6xl py-16 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-muted inline-flex p-4 rounded-full mb-6">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Demo Not Found</h2>
          <p className="text-muted-foreground mb-8">无法加载所请求的项目，请返回探索页面查看其他项目</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-8 md:py-12">

      <div className="space-y-8">
        {/* 项目标题和信息 */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{selectedProject.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="default" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Access Demo
            </Button>
          </div>
        </div>


        {/* 主要内容区域 */}
        <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            {/* 项目描述 */}
            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="bg-muted/50 pb-4 border-b">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary/70" />
                  Project Description
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 px-6">
                <p className="text-muted-foreground leading-relaxed">{selectedProject.des}</p>
                {selectedProject.des.length < 100 && (
                  <p className="mt-4 text-sm text-muted-foreground italic">
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 项目内容 */}
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-muted/50 pb-4 border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary/70" />
                    Project Content
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground/80">View the project presentation file</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 px-6">
                  <Tabs defaultValue="files" className="w-full">
                    <TabsList className="mb-6 w-full justify-start rounded-md bg-muted/70 p-1">
                      <TabsTrigger value="files" className="flex items-center gap-2 rounded-md">
                        <FileText className="h-4 w-4" />
                        PPT
                      </TabsTrigger>
                      <TabsTrigger value="demo" className="flex items-center gap-2 rounded-md">
                        <Video className="h-4 w-4" />
                        Video
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="files" className="space-y-4">
                      {/* <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                        <div className="flex items-center gap-4">
                          <div className="rounded-md bg-primary/10 p-2">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">项目源代码</p>
                            <p className="text-sm text-muted-foreground">包含项目的完整源代码和资源文件</p>
                          </div>
                        </div>
                      </div> */}
                      <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/upload?demoId=${selectedProject.id}`)}
                            className="gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            Upload Files
                          </Button>
                        </div>
                    </TabsContent>
  
                  </Tabs>
                </CardContent>
              </Card>
          </div>

          <div className="space-y-8">
            {/* 其他项目 */}
            <Card className="overflow-hidden border-none shadow-sm">
              <CardHeader className="bg-muted/50 pb-4">
                <CardTitle>Your Other Demo</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {userProjects
                    .filter((p) => p.id !== selectedProject.id)
                    .map((project) => (
                      <Link
                        key={project.id}
                        href={`/demo/${project.id}`}
                        className="flex gap-4 rounded-lg hover:bg-muted/50 p-3 transition-colors border border-transparent hover:border-border"
                      >
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium line-clamp-1">{project.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{project.des}</p>
                        </div>
                      </Link>
                    ))}

                  {userProjects.length === 1 && (
                    <div className="text-center p-6 bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground mb-3">You currently only have one demo.</p>
                      <Button asChild size="sm" className="gap-2">
                        <Link href="/create">
                          <Upload className="h-4 w-4" />
                          Create New Demo
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
