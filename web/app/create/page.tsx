"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUploader } from "@/components/file-uploader"
import { Check,Info} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createDemo,getProfileByUser } from "@/contracts/query"
import { useBetterSignAndExecuteTransaction } from '@/hooks/useBetterTx'
import { useCurrentAccount } from "@mysten/dapp-kit"

export default function CreatePage() {
  const router = useRouter()
  const [isPrivate, setIsPrivate] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const account = useCurrentAccount()
  const { handleSignAndExecuteTransaction: createDemoHandler } = useBetterSignAndExecuteTransaction({ tx: createDemo })

  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      if (!account?.address) {
        alert("Wallet not connected")
        return
      }
      
      // 获取表单元素值
      const formData = new FormData(e.currentTarget)
      const name = formData.get('title') as string
      const des = formData.get('description') as string
      
      if (!name || !des) {
        alert("Please fill in all required fields")
        return
      }
      
      const profile = await getProfileByUser(account.address)
      if (!profile) {
        alert("Please create a profile first")
        router.push("/profile")  // 重定向到创建资料页面
        return
      }
      
      // 调用创建函数
      createDemoHandler({ 
        name, 
        des, 
        profile: profile.id.id 
      }).onSuccess(async (result) => {
        console.log("Demo created:", result)
      // 显示成功信息
      setShowSuccess(true)
    }).execute()
    } catch (error) {
      console.error("Error creating demo:", error)
      alert("Failed to create project. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Create New Project</h1>
          <p className="text-muted-foreground">Share your demo with the community and control who can access it</p>
        </div>

        {showSuccess ? (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Success!</AlertTitle>
            <AlertDescription>
              Your project has been created successfully
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>Provide information about your project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title</Label>
                  <Input id="title" name="title" placeholder="Enter a title for your project" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="Describe your project" className="min-h-[120px]" required />
                </div>

                {/* <div className="space-y-4">
                  <Label>Cover Image</Label>
                  <FileUploader accept="image/*" maxFiles={1} />
                </div> */}
                

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="private">Private Project</Label>
                      <p className="text-sm text-muted-foreground">Control who can access your project content</p>
                    </div>
                    <Switch id="private" checked={isPrivate} onCheckedChange={setIsPrivate} />
                  </div>

                  {isPrivate && (
                    <div className="rounded-lg border p-4">
                      <div className="flex items-start gap-4">
                        <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div className="space-y-3">
                          <p className="text-sm">
                            Your project will be encrypted using Seal. Only users you approve will be able to access the
                            content.
                          </p>
                          <div className="space-y-2">
                            <Label htmlFor="access-type">Access Type</Label>
                            <Select defaultValue="manual">
                              <SelectTrigger id="access-type">
                                <SelectValue placeholder="Select access type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="manual">Manual Approval</SelectItem>
                                <SelectItem value="automatic">Automatic (NFT Holders)</SelectItem>
                                <SelectItem value="token">Token Gated</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => router.push("/explore")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Project"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        )}
      </div>
    </div>
  )
}
