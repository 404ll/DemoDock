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
import { Check, Info, ChevronDown } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createDemo, getProfileByUser } from "@/contracts/query"
import { useBetterSignAndExecuteTransaction } from '@/hooks/useBetterTx'
import { useCurrentAccount } from "@mysten/dapp-kit"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import {PROJECT_TYPES} from "@/types/index"


export default function CreatePage() {
  const router = useRouter()
  const [isPrivate, setIsPrivate] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const account = useCurrentAccount()
  const { handleSignAndExecuteTransaction: createDemoHandler } = useBetterSignAndExecuteTransaction({ tx: createDemo })
  
  // 项目类型相关状态
  const [projectType, setProjectType] = useState("")
  const [isCustomType, setIsCustomType] = useState(false)
  const [openTypePopover, setOpenTypePopover] = useState(false)
  
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
      
      // 处理项目类型
      let type = projectType
      if (isCustomType) {
        type = formData.get('custom-type') as string
      }
      
      if (!name || !des || !type) {
        alert("Please fill in all required fields including project type")
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
        repo: formData.get('repo') as string,
        type: type,
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

  // 处理类型选择
  const handleTypeSelect = (value: string) => {
    if (value === "custom") {
      setIsCustomType(true)
      setProjectType("")
    } else {
      setIsCustomType(false)
      setProjectType(value)
    }
    setOpenTypePopover(false)
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
                  <Label htmlFor="repo">Project Repo Link</Label>
                  <Input id="repo" name="repo" placeholder="Enter your project repository URL" required />
                </div>

                {/* 添加项目类型字段 */}
                <div className="space-y-2">
                  <Label htmlFor="type">Project Type</Label>
                  <div className="relative">
                    {isCustomType ? (
                      <div className="flex gap-2">
                        <Input 
                          id="custom-type" 
                          name="custom-type" 
                          placeholder="Enter custom project type" 
                          className="flex-1" 
                          required 
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCustomType(false)}
                          className="whitespace-nowrap"
                        >
                          Use Preset
                        </Button>
                      </div>
                    ) : (
                      <Popover open={openTypePopover} onOpenChange={setOpenTypePopover}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openTypePopover}
                            className="w-full justify-between"
                          >
                            {projectType ? 
                              PROJECT_TYPES.find(type => type.value === projectType)?.label 
                              : "Select project type"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search project type..." />
                            <CommandList>
                              <CommandEmpty>No type found.</CommandEmpty>
                              <CommandGroup>
                                {PROJECT_TYPES.map(type => (
                                  <CommandItem
                                    key={type.value}
                                    value={type.value}
                                    onSelect={handleTypeSelect}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        projectType === type.value ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {type.label}
                                  </CommandItem>
                                ))}
                                <CommandItem
                                  value="custom"
                                  onSelect={() => handleTypeSelect("custom")}
                                >
                                  <Check className="mr-2 h-4 w-4 opacity-0" />
                                  Enter Custom Type...
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="Describe your project" className="min-h-[120px]" required />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="private">Private Project</Label>
                      <p className="text-sm text-muted-foreground">Control who can access your project content</p>
                    </div>
                    <Switch id="private" checked={isPrivate} onCheckedChange={setIsPrivate} />
                  </div>

                  {/* 私有项目设置 */}
                  {isPrivate && (
                    <div className="rounded-lg border p-4">
                      {/* 私有项目设置内容 */}
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




