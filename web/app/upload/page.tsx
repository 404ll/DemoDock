"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { getCapByDemoId } from "@/contracts/query"
import { WalrusUpload } from "@/components/seal/EncrtptAndUpload"
import { useCurrentAccount } from "@mysten/dapp-kit"

// 分离出使用 useSearchParams 的内部组件
function UploadContent() {
  // 导入移到组件内部
  const { useSearchParams } = require('next/navigation');
  const searchParams = useSearchParams();
  const demoId = searchParams.get('demoId');
  const currentAccount = useCurrentAccount()
  const [policyId, setPolicyId] = useState('')
  const [capId, setCapId] = useState('')
  const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null)

  // 从URL获取demoId并只设置一次
  useEffect(() => {
    if (demoId) {
      console.log("从URL获取到Demo ID:", demoId);
      setSelectedDemoId(demoId);
    }
  }, [demoId]); // 添加demoId作为依赖
  
  useEffect(() => {
    async function fetchCapId() {
      if (currentAccount?.address && selectedDemoId) {
        try {
          const result = await getCapByDemoId(currentAccount.address, selectedDemoId);
          
          // 只有当结果有效时才更新状态
          if (result) {
            console.log("获取到的CapID:", result);
            console.log("获取到的PolicyID:", selectedDemoId);
            setCapId(result);
            setPolicyId(selectedDemoId);
          }
        } catch (error) {
          console.error("获取CapID失败:", error);
        }
      }
    }

    // 确保只有当两个值都存在时才执行
    if (currentAccount?.address && selectedDemoId) {
      fetchCapId();
    }
  }, [currentAccount?.address, selectedDemoId]);

  return (
    <WalrusUpload 
      policyObject={policyId} 
      cap_id={capId} 
      moduleName="demo" 
    />
  );
}

// 主页面组件
export default function UploadPage() {
  return (
    <div className="container py-8">
      <div className="mx-auto max-w-2xl">
        <Suspense fallback={<div className="text-center p-4">加载中...</div>}>
          <UploadContent />
        </Suspense>
      </div>
    </div>

  )
}
