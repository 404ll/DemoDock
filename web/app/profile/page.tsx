"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
} from "lucide-react"
import { useCurrentAccount } from '@mysten/dapp-kit'
import { mockProjects, loadMockUserProjects } from "@/lib/mock-data"
import { useRouter } from "next/navigation"
import { getProfileByUser } from '@/contracts/query'
import { Project } from "@/types/index";


export default function ProjectPage() {
  const account = useCurrentAccount();
  const router = useRouter();
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [hasAccess, setHasAccess] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [accessRequested, setAccessRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [DemoAccount, setDemoAccount] = useState("");
  
  const DemoAddress = async () => {
    try {
      if (account) {
        const profile = await getProfileByUser(account.address);
        if (profile) {
          setDemoAccount(String(profile.id.id));
        } 
      }
    } catch (error) {
      console.error("获取用户资料失败:", error);
    }
  }
  
  useEffect(() => {
    DemoAddress();
  }, [account]);

  // 获取用户项目
  useEffect(() => {
    if (!account) {
      // 如果没有连接钱包，重定向到首页
      router.push('/');
      return;
    }

    const fetchUserProjects = async () => {
      setIsLoading(true);
      try {
        // 使用loadMockUserProjects获取用户的项目
        const projects = await loadMockUserProjects(account.address);
        
        // 设置获取到的项目
        setUserProjects(projects);
        
        if (projects.length > 0) {
          setSelectedProject(projects[0]);
          // 默认已有访问权限
          setHasAccess(true);
        }
        
      } catch (error) {
        console.error("获取项目失败:", error);
        // 加载失败时使用默认数据
        const fallbackProjects: Project[] = [{
          id: "default-1",
          name: "示例项目",
          des: "这是一个默认示例项目，由于无法获取您的真实项目而创建",
          profile: account.address.slice(0, 8)
        }];
        
        setUserProjects(fallbackProjects);
        setSelectedProject(fallbackProjects[0]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProjects();
  }, [account, router]);

  const handleRequestAccess = () => {
    setIsRequesting(true);
    // 模拟请求过程
    setTimeout(() => {
      setIsRequesting(false);
      setAccessRequested(true);
    }, 2000);
  };

  // 加载中状态
  if (isLoading || !selectedProject) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">正在加载您的项目...</h2>
          <p className="text-muted-foreground">请稍候，我们正在从区块链获取您的项目数据</p>
        </div>
      </div>
    );
  }

  // 无项目状态
  if (userProjects.length === 0) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">您还没有创建任何项目</h2>
          <p className="text-muted-foreground mb-6">开始创建您的第一个项目，展示您的创意</p>
          <Button asChild>
            <Link href="/upload">创建新项目</Link>
          </Button>
        </div>
      </div>
    );
  }

  // 创建一个随机日期作为创建日期（因为新的Project结构没有createdAt）
  const createdDate = new Date();
  createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30));

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/explore">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回探索页面
          </Link>
        </Button>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">{selectedProject.name}</h1>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="/placeholder.svg" alt={selectedProject.profile} />
                    <AvatarFallback>{selectedProject.profile.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{selectedProject.profile}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{createdDate.toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                查看详情
              </Button>
            </div>
          </div>

          {/* 移除tags展示，新结构中没有tags */}

          {/* 使用占位图片 */}
          {/* <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-slate-100 flex items-center justify-center">
            <div className="text-muted-foreground">项目预览图</div>
          </div> */}

          <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="mb-4 text-xl font-semibold">关于此项目</h2>
                  <p className="text-muted-foreground">{selectedProject.des}</p>
                  <p className="mt-4 text-muted-foreground">
                  </p>
                </CardContent>
              </Card>

              {hasAccess ? (
                <Card>
                  <CardContent className="p-6">
                    <Tabs defaultValue="files">
                      <TabsList className="mb-4">
                        <TabsTrigger value="files">文件</TabsTrigger>
                        <TabsTrigger value="demo">演示</TabsTrigger>
                      </TabsList>
                      <TabsContent value="files" className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">项目源代码</p>
                              <p className="text-xs text-muted-foreground">ZIP - 2.4 MB</p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="gap-2">
                            <Download className="h-4 w-4" />
                            下载
                          </Button>
                        </div>
                      </TabsContent>
                      <TabsContent value="demo">
                        <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                          <Video className="h-12 w-12 text-muted-foreground" />
                          <p className="ml-2 text-muted-foreground">演示视频将在此处播放</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 flex flex-col items-center justify-center gap-4 text-center">
                    <div className="rounded-full bg-muted p-3">
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold">此内容已加密</h3>
                    <p className="text-muted-foreground">
                      您需要向项目所有者请求访问权限才能查看完整内容
                    </p>
                    {accessRequested ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>已请求访问</AlertTitle>
                        <AlertDescription>
                          您的请求已发送给项目所有者。授予访问权限后，您将收到通知。
                        </AlertDescription>
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

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-4 text-lg font-semibold">访问信息</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">访问类型</span>
                      </div>
                      <span className="text-sm">加密访问</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">浏览量</span>
                      </div>
                      <span className="text-sm">--</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Unlock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">访问方式</span>
                      </div>
                      <span className="text-sm">手动批准</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-4 text-lg font-semibold">您的其他项目</h3>
                  <div className="space-y-4">
                    {userProjects
                      .filter((p) => p.id !== selectedProject.id)
                      .map((project) => (
                        <Link
                          key={project.id}
                          href={`/project?id=${project.id}`}
                          className="flex gap-3 rounded-lg hover:bg-muted p-2 transition-colors"
                        >
                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-slate-100 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="font-medium line-clamp-1">{project.name}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">{project.des}</p>
                          </div>
                        </Link>
                      ))}
                    
                    {userProjects.length === 1 && (
                      <div className="text-center p-4">
                        <p className="text-muted-foreground mb-2">您目前只有一个项目</p>
                        <Button asChild size="sm" variant="outline">
                          <Link href="/upload">创建新项目</Link>
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
    </div>
  )
}
