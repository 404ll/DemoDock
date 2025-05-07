"use client"

import type React from "react"
import { useState,useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {getCapByDemoId} from "@/contracts/query"
import {WalrusUpload} from "@/components/seal/EncrtptAndUpload"
import { Plus, X, Check, Github } from "lucide-react"
import { useSearchParams } from 'next/navigation';
import { useCurrentAccount } from "@mysten/dapp-kit"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"



export default function CreatePage() {
  const searchParams = useSearchParams();
  const demoId = searchParams.get('demoId');
  const currentAccount = useCurrentAccount()
  const [policyId, setPolicyId] = useState('')
  const [capId, setCapId] = useState('')
  const router = useRouter()
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null)

  const handleAddTag = () => {
    if (tagInput.trim() !== "" && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  useEffect(() => {
    if (demoId) {
      console.log("从URL获取到Demo ID:", demoId);
      // 设置表单中的demoId值或更新状态
      setSelectedDemoId(demoId);
    }
  }, [demoId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false)
      setShowSuccess(true)

      // Redirect after showing success message
      setTimeout(() => {
        router.push("/explore")
      }, 2000)
    }, 1500)
  }
  
  useEffect(() => {
    async function fetchCapId() {
      if (currentAccount?.address) {
        try {
          const demoId = selectedDemoId;
          const result = await getCapByDemoId(currentAccount.address, demoId!);
          setCapId(result);
          setPolicyId(demoId!);
          console.log("获取到的CapID:", result);
          console.log("获取到的PolicyID:", demoId);
        } catch (error) {
          console.error("获取CapID失败:", error);
        }
      }
    }

    fetchCapId();
  }, [currentAccount]);


  return (
    <div className="container py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-xl font-bold mb-4">上传加密文件</h1>
        
        {/* 只保留WalrusUpload组件 */}
        <WalrusUpload 
          policyObject={policyId} 
          cap_id={capId} 
          moduleName="demo" 
        />
      </div>
    </div>
  );
}
