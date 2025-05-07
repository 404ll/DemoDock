"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Clock, Key, CheckCircle, AlertCircle, User, FileText, Loader2 } from "lucide-react"
import type { DemoRequest } from "@/types"
import { getAdminApplication, getCapByDemoId, addVisitorByUser } from "@/contracts/query"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { useBetterSignAndExecuteTransaction } from "@/hooks/useBetterTx"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function AccessRequestsPage() {
  const account = useCurrentAccount()
  const [pendingRequests, setPendingRequests] = useState<DemoRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [approvedRequestIds, setApprovedRequestIds] = useState<Set<string>>(new Set())
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

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
      console.error("Failed to fetch access requests:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [account?.address])

  const handleApprove = async (requestId: string, visitor: string) => {
    if (!account?.address) return
    // Prevent duplicate clicks
    if (approvedRequestIds.has(requestId) || processingIds.has(requestId)) return

    try {
      setProcessingIds((prev) => new Set(prev).add(requestId))
      const capId = await getCapByDemoId(account.address, requestId)

      add({ demo: requestId, cap: capId, account: visitor })
        .onSuccess(() => {
          setApprovedRequestIds((prevIds) => new Set(prevIds).add(requestId))
          setProcessingIds((prev) => {
            const newSet = new Set(prev)
            newSet.delete(requestId)
            return newSet
          })
          fetchRequests()
        })
        .onError((error) => {
          console.error("Approval transaction failed:", error)
          setProcessingIds((prev) => {
            const newSet = new Set(prev)
            newSet.delete(requestId)
            return newSet
          })
          window.alert("Approval failed. Please try again.")
        })
        .execute()
    } catch (error) {
      console.error("Failed to approve access request (pre-processing error):", error)
      setProcessingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(requestId)
        return newSet
      })
      window.alert("Failed to initiate approval. Please try again.")
    }
  }

  // Helper function to format addresses
  const formatAddress = (address: string) => {
    if (!address) return ""
    return address
  }

  // Helper function to get initials from address
  const getAddressInitials = (address: string) => {
    if (!address) return "?"
    return address.substring(0, 2)
  }

  return (
    <div className="container py-8 max-w-5xl">
      <div className="flex flex-col gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Access Requests</h1>
          <p className="text-muted-foreground">Manage access requests for your private projects</p>
        </div>

        <div className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              Pending Requests
              {pendingRequests.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingRequests.length}
                </Badge>
              )}
            </h2>
            <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          </div>

          {loading ? (
            <Card className="border border-muted/30">
              <CardContent className="flex items-center justify-center py-10">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading access requests...</p>
                </div>
              </CardContent>
            </Card>
          ) : pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request.demo_id} className="overflow-hidden transition-all hover:shadow-md">
                  <CardHeader className="bg-muted/20 pb-3">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-medium">
                          Project
                        </Badge>
                        <CardTitle className="text-base font-medium">{request.demo_id}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="px-2 py-1 w-fit">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 border">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getAddressInitials(request.visitor)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">Requester</h3>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-5 w-5">
                                    <User className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Visitor Address</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <p className="text-sm font-mono bg-muted/30 p-1.5 rounded-md overflow-x-auto whitespace-nowrap">
                            {formatAddress(request.visitor)}
                          </p>
                        </div>
                      </div>

                      {request.des && (
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-medium">Request Description</h3>
                            <p className="text-sm bg-muted/30 p-2 rounded-md">{request.des}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/10 flex justify-end py-3">
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleApprove(request.demo_id, request.visitor)}
                      disabled={approvedRequestIds.has(request.demo_id) || processingIds.has(request.demo_id)}
                    >
                      {approvedRequestIds.has(request.demo_id) ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Approved
                        </>
                      ) : processingIds.has(request.demo_id) ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Key className="h-4 w-4" />
                          Approve Access
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border border-muted/30">
              <CardHeader>
                <CardTitle>No Pending Requests</CardTitle>
                <CardDescription>You currently don't have any pending access requests.</CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
                    <p>Your request queue is empty</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
