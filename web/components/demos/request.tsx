"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useBetterSignAndExecuteTransaction } from '@/hooks/useBetterTx'
import { requestDemo } from "@/contracts/query"

interface RequestAccessDialogProps {
  demoId: string
  trigger?: React.ReactNode // 自定义触发按钮
  onSuccess?: () => void // 请求成功的回调
  onError?: (error: unknown) => void // 请求失败的回调
}

export function RequestAccessDialog({ 
  demoId, 
  trigger, 
  onSuccess, 
  onError 
}: RequestAccessDialogProps) {
  const [requestDescription, setRequestDescription] = useState("")
  const [isRequesting, setIsRequesting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { handleSignAndExecuteTransaction: request } =
    useBetterSignAndExecuteTransaction({ tx: requestDemo })

  // 处理提交请求
  const handleSubmitRequest = async () => {
    
    try {
      setIsRequesting(true)
      console.log("Submitting request:", { demoId, requestDescription })
      request({ demo: demoId, des: requestDescription })
      .onSuccess((result) => {
        console.log("Request submitted successfully:", result);
        setRequestDescription("");
        setIsDialogOpen(false);
        
        // 添加调试日志确认回调被触发
        console.log("触发 onSuccess 回调");
        if (onSuccess) onSuccess();
      })
      .onError((error) => {
        console.error("Request failed:", error);
        if (onError) onError(error);
      })    
      .execute();
    } catch (error) {
      console.error("Error:", error)
      onError?.(error)
      setIsRequesting(false)
    }
    setIsRequesting(false)
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {trigger || <Button className="w-full">Request Access</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Demo Access</DialogTitle>
          <DialogDescription>
            Please provide a brief description of why you'd like to access this demo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="request-description">Request Description</Label>
            <Textarea
              id="request-description"
              placeholder="I'm interested in this demo because..."
              value={requestDescription}
              onChange={(e) => setRequestDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitRequest} 
            disabled={isRequesting || !requestDescription.trim()}
          >
            {isRequesting ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}