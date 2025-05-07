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

  const handleRequestAccess = () => {
    setIsRequesting(true)
    // 模拟请求过程
    setTimeout(() => {
      setIsRequesting(false)
      setAccessRequested(true)
    }, 2000)
  }


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
          <h2 className="text-3xl font-bold mb-4">您还没有创建任何项目</h2>
          <p className="text-muted-foreground mb-8">开始创建您的第一个项目，展示您的创意并与他人分享</p>
          <Button asChild size="lg" className="gap-2">
            <Link href="/upload">
              <Upload className="h-4 w-4" />
              创建新项目
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
          <h2 className="text-3xl font-bold mb-4">项目未找到</h2>
          <p className="text-muted-foreground mb-8">无法加载所请求的项目，请返回探索页面查看其他项目</p>
          <Button asChild size="lg" variant="outline" className="gap-2">
            <Link href="/explore">
              <ArrowLeft className="h-4 w-4" />
              返回探索页面
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-8 md:py-12">
      <Button variant="ghost" size="sm" asChild className="mb-6 group transition-all hover:translate-x-[-2px]">
        <Link href="/explore" className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-[-2px]" />
          返回探索页面
        </Link>
      </Button>

      <div className="space-y-8">
        {/* 项目标题和信息 */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{selectedProject.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/identicon/svg?seed=${selectedProject.profile}`}
                    alt={selectedProject.profile}
                  />
                  <AvatarFallback>{selectedProject.profile.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{selectedProject.profile}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              查看详情
            </Button>
            <Button variant="default" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              访问项目
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
                  关于此项目
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
            {hasAccess ? (
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-muted/50 pb-4 border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary/70" />
                    项目内容
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground/80">查看项目文件和演示</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 px-6">
                  <Tabs defaultValue="files" className="w-full">
                    <TabsList className="mb-6 w-full justify-start rounded-md bg-muted/70 p-1">
                      <TabsTrigger value="files" className="flex items-center gap-2 rounded-md">
                        <FileText className="h-4 w-4" />
                        文件
                      </TabsTrigger>
                      <TabsTrigger value="demo" className="flex items-center gap-2 rounded-md">
                        <Video className="h-4 w-4" />
                        演示
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="files" className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                        <div className="flex items-center gap-4">
                          <div className="rounded-md bg-primary/10 p-2">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">项目源代码</p>
                            <p className="text-sm text-muted-foreground">包含项目的完整源代码和资源文件</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/upload?demoId=${selectedProject.id}`)}
                            className="gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            上传文件
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
  
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden border-none shadow-sm">
                <CardContent className="p-8 flex flex-col items-center justify-center gap-6 text-center">
                  <div className="rounded-full bg-muted p-4">
                    <Lock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">此内容已加密</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      您需要向项目所有者请求访问权限才能查看完整内容。请求批准后，您将获得查看和下载权限。
                    </p>
                  </div>
                  {accessRequested ? (
                    <Alert className="max-w-md bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-900">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>已请求访问</AlertTitle>
                      <AlertDescription>您的请求已发送给项目所有者。授予访问权限后，您将收到通知。</AlertDescription>
                    </Alert>
                  ) : (
                    <Button onClick={handleRequestAccess} disabled={isRequesting} className="gap-2">
                      {isRequesting ? (
                        <>请求中...</>
                      ) : (
                        <>
                          <Key className="h-4 w-4" />
                          请求访问
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-8">
            {/* 访问信息 */}
   

            {/* 其他项目 */}
            <Card className="overflow-hidden border-none shadow-sm">
              <CardHeader className="bg-muted/50 pb-4">
                <CardTitle>您的其他项目</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {userProjects
                    .filter((p) => p.id !== selectedProject.id)
                    .map((project) => (
                      <Link
                        key={project.id}
                        href={`/project?id=${project.id}`}
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
                      <p className="text-muted-foreground mb-3">您目前只有一个项目</p>
                      <Button asChild size="sm" className="gap-2">
                        <Link href="/upload">
                          <Upload className="h-4 w-4" />
                          创建新项目
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
