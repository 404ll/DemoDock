"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Clock, Key, X } from "lucide-react"
import { DemoRequest } from "@/types"
import { getAdminApplication,getCapByDemoId,addVisitorByUser } from "@/contracts/query"
import { useCurrentAccount } from '@mysten/dapp-kit'
import { useBetterSignAndExecuteTransaction } from "@/hooks/useBetterTx"

export default function AccessRequestsPage() {
  const account = useCurrentAccount()
  const [pendingRequests, setPendingRequests] = useState<DemoRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [approvedRequestIds, setApprovedRequestIds] = useState<Set<string>>(new Set()); // 新增 state
  const { handleSignAndExecuteTransaction: add } = useBetterSignAndExecuteTransaction({
    tx: addVisitorByUser,
  })
  async function fetchRequests() {
    if (!account?.address) return
    
    try {
      setLoading(true)
      const requests = await getAdminApplication(account.address)
      setPendingRequests(requests)
    } catch (error) {
      console.error("获取访问请求失败:", error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
   
    fetchRequests()
  }, [account?.address])

  const handleApprove = async(requestId: string,visitor:string) => {
    if (!account?.address) return
    // 防止重复点击，如果已在处理或已批准，则不执行
    if (approvedRequestIds.has(requestId)) return;

    try{
        const capId =await getCapByDemoId(account.address,requestId)
        add({demo:requestId,cap:capId,account:visitor}).onSuccess(() => {
         setApprovedRequestIds(prevIds => new Set(prevIds).add(requestId)); // 标记为已批准
         fetchRequests(); // 刷新列表
         // 可以在这里添加成功提示，例如：
         // window.alert("请求已批准！");
        }).onError((error) => {
          console.error("批准交易失败:", error);
          window.alert("批准失败，请重试。");
        }).execute();
    }catch(error){
        console.error("批准访问请求失败 (预处理错误):", error)
        window.alert("发起批准失败，请重试。");
    }
  }


  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">访问请求</h1>
          <p className="text-muted-foreground">管理您私有项目的访问请求</p>
        </div>

        <div className="w-full">
          <h2 className="text-xl font-semibold mb-4">
            申请访问列表
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingRequests.length}
              </Badge>
            )}
          </h2>

          {loading ? (
            <Card>
              <CardHeader>
                <CardTitle>加载中...</CardTitle>
                <CardDescription>正在获取访问请求数据</CardDescription>
              </CardHeader>
            </Card>
          ) : pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request.demo_id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">项目</Badge>
                          <span className="font-medium">{request.demo_id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>{request.visitor}</AvatarFallback>
                          </Avatar>
                        </div>

                        {request.des && (
                          <div className="mt-2 text-sm">
                            <p>描述: {request.des}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="gap-1" 
                          onClick={() => handleApprove(request.demo_id, request.visitor)}
                          disabled={approvedRequestIds.has(request.demo_id)} // 禁用按钮逻辑
                        >
                          {approvedRequestIds.has(request.demo_id) ? (
                            "已批准"
                          ) : (
                            <>
                              <Key className="h-4 w-4" />
                              批准
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>没有待处理的请求</CardTitle>
                <CardDescription>您目前没有任何待处理的访问请求。</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
