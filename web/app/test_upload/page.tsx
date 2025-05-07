"use client";
import React, { useState,useEffect } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { 
  Card, 
  Flex, 
  Heading, 
  Tabs, 
  Text, 
  Button,
  Dialog,
  ScrollArea
} from '@radix-ui/themes';
import { SealClient, SessionKey } from '@mysten/seal';
import { getAllowlistedKeyServers } from '@mysten/seal';
import { Transaction } from '@mysten/sui/transactions';
import { networkConfig } from '@/contracts/index';
import { WalrusUpload } from '@/components/seal/EncrtptAndUpload';
import { downloadAndDecrypt } from '@/components/seal/utils';
import {getCapByDemoId} from "@/contracts/query"
import { useCurrentAccount } from "@mysten/dapp-kit"

export default function TestUploadPage() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [policyId, setPolicyId] = useState('');
  const [capId, setCapId] = useState('');
  const [allowlistId, setAllowlistId] = useState('');
  const [blobIds, setBlobIds] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [decryptedFileUrls, setDecryptedFileUrls] = useState<{url: string; type: string}[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const packageId = networkConfig.testnet.variables.Package;
  // const demoCapId = await getCapByDemoId(currentAccount?.address ?? "00",demoId);
  useEffect(() => {
    async function fetchCapId() {
      if (currentAccount?.address) {
        try {
          const demoId = "0xb6082813aab7ec2f5ed2f79018e9fadd51967f051142571fd7291b0455545526";
          const result = await getCapByDemoId(currentAccount.address, demoId);
          setCapId(result);
          setPolicyId(demoId);
          console.log("获取到的CapID:", result);
          console.log("获取到的PolicyID:", demoId);
        } catch (error) {
          console.error("获取CapID失败:", error);
        }
      }
    }
    
    fetchCapId();
  }, [currentAccount?.address]);

  // 创建SealClient
  const sealClient = new SealClient({
    suiClient,
    serverObjectIds: getAllowlistedKeyServers('testnet'),
    verifyKeyServers: false,
  });

  // 构建Move调用函数
  const constructMoveCall = (allowlistId: string) => {
    return (tx: Transaction, id: string) => {
      tx.moveCall({
        target: `${packageId}::demo::seal_approve`,
        arguments: [tx.pure.string(id), tx.object(allowlistId)],
      });
    };
  };

  // 解密文件函数
  const handleDecrypt = async () => {
    if (!allowlistId || blobIds.length === 0) {
      setError('请输入允许列表ID和Blob ID');
      return;
    }
    
    setIsDecrypting(true);
    setError(null);
    
    try {
      // 创建新的会话密钥
      const sessionKey = new SessionKey({
        address: '0x0', // 这里会在签名过程中被替换
        packageId,
        ttlMin: 10,
      });
      
      // 使用用户选择的服务
      const moveCallConstructor = constructMoveCall(allowlistId);
      
      // 修改downloadAndDecrypt函数以使用选定的服务
      await downloadAndDecrypt(
        blobIds,
        sessionKey,
        suiClient,
        sealClient,
        moveCallConstructor,
        setError,
        setDecryptedFileUrls,
        setIsDialogOpen,
        setReloadKey
      );
    } catch (error: any) {
      console.error('解密失败:', error);
      setError(`解密失败: ${error.message}`);
    } finally {
      setIsDecrypting(false);
    }
  };

  // 媒体项组件
  const MediaItem = ({ fileUrl, mimeType, index }: { fileUrl: string, mimeType: string, index: number }) => {
    const isVideo = mimeType.startsWith('video/');
    const isPPT = mimeType.includes('powerpoint') || mimeType.includes('presentation');
    
    return (
      <div className="media-item" style={{ marginBottom: '20px' }}>
        <Text size="2" weight="bold">文件 {index + 1}</Text>
        {isVideo ? (
          <video 
            controls 
            width="100%" 
            src={fileUrl}
            style={{ maxHeight: '300px' }}
          >
            您的浏览器不支持视频播放。
          </video>
        ) : isPPT ? (
          <div style={{ textAlign: 'center', padding: '20px', border: '1px solid #ccc' }}>
            <Text>PowerPoint文件</Text>
            <Button asChild>
              <a href={fileUrl} download={`file-${index}.pptx`}>下载查看</a>
            </Button>
          </div>
        ) : (
          <img 
            src={fileUrl} 
            alt={`解密文件 ${index + 1}`} 
            style={{ maxWidth: '100%', maxHeight: '300px' }}
          />
        )}
      </div>
    );
  };

  return (
    <Card className="test-page" style={{ maxWidth: '800px', margin: '20px auto' }}>
      <Heading size="4" style={{ marginBottom: '20px' }}>Walrus 加密文件测试</Heading>

      <Tabs.Root defaultValue="upload">
        <Tabs.List>
          <Tabs.Trigger value="upload">加密上传</Tabs.Trigger>
          <Tabs.Trigger value="decrypt">解密下载</Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value="upload">
          <Card style={{ padding: '20px', margin: '16px 0' }}>
            <Flex direction="column" gap="3">
              <Text size="2">请输入Policy对象ID和Cap ID</Text>       
                <WalrusUpload 
                  policyObject={policyId} 
                  cap_id={capId} 
                  moduleName="demo" 
                />
              )
            </Flex>
          </Card>
        </Tabs.Content>
        
        <Tabs.Content value="decrypt">
          <Card style={{ padding: '20px', margin: '16px 0' }}>
            <Flex direction="column" gap="3">
              <Text size="2">请输入Allowlist ID和Blob ID</Text>
              <input
                type="text"
                placeholder="Allowlist ID"
                value={allowlistId}
                onChange={(e) => setAllowlistId(e.target.value)}
                style={{ padding: '8px' }}
              />
              <textarea
                placeholder="Blob IDs (每行一个)"
                value={blobIds.join('\n')}
                onChange={(e) => setBlobIds(e.target.value.split('\n').filter(id => id.trim() !== ''))}
                style={{ padding: '8px', height: '100px' }}
              />
              
              <Button 
                onClick={handleDecrypt}
                disabled={isDecrypting || !allowlistId || blobIds.length === 0}
              >
                {isDecrypting ? '解密中...' : '解密文件'}
              </Button>
              
              {error && (
                <Text color="red" size="2">{error}</Text>
              )}
            </Flex>
          </Card>
        </Tabs.Content>
      </Tabs.Root>
      
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Content style={{ maxWidth: '80vw', maxHeight: '80vh' }}>
          <Dialog.Title>解密文件预览</Dialog.Title>
          <ScrollArea style={{ height: '60vh' }}>
            <Flex direction="column" gap="4" p="4">
              {decryptedFileUrls.map((file, index) => (
                <MediaItem 
                  key={`${index}-${reloadKey}`}
                  fileUrl={file.url} 
                  mimeType={file.type} 
                  index={index} 
                />
              ))}
            </Flex>
          </ScrollArea>
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button>关闭</Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Card>
  );
}