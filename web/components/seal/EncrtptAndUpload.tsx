import React, { useState } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { networkConfig } from '@/contracts/index';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { AlertCircle, FileUp, Upload, Check, Link, ExternalLink } from 'lucide-react';
import { Button, Card, Flex, Text, Badge, Box, Progress, Separator } from '@radix-ui/themes';
import { getAllowlistedKeyServers, SealClient } from '@mysten/seal';
import { fromHex, toHex } from '@mysten/sui/utils';
import { useRouter } from 'next/navigation';

export type Data = {
  status: string;
  blobId: string;
  endEpoch: string;
  suiRefType: string;
  suiRef: string;
  suiBaseUrl: string;
  blobUrl: string;
  suiUrl: string;
  isImage: string;  
  isVideo: string;
  isPPT?: boolean;
};

interface WalrusUploadProps {
  policyObject: string;
  cap_id: string;
  moduleName: string;
}

type WalrusService = {
  id: string;
  name: string;
  publisherUrl: string;
  aggregatorUrl: string;
};

export function WalrusUpload({ policyObject, cap_id, moduleName }: WalrusUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<Data | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [selectedService, setSelectedService] = useState<string>('service1');
  const [uploadStep, setUploadStep] = useState<'idle' | 'encrypting' | 'uploading' | 'binding' | 'complete'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  const SUI_VIEW_TX_URL = `https://suiscan.xyz/testnet/tx`;
  const SUI_VIEW_OBJECT_URL = `https://suiscan.xyz/testnet/object`;

  const NUM_EPOCH = 1;
  const packageId = networkConfig.testnet.variables.Package;
  const suiClient = useSuiClient();
  const client = new SealClient({
    suiClient,
    serverObjectIds: getAllowlistedKeyServers('testnet'),
    verifyKeyServers: false,
  });

  const services: WalrusService[] = [
    {
      id: 'service1',
      name: 'walrus.space',
      publisherUrl: '/publisher1',
      aggregatorUrl: '/aggregator1',
    },
    {
      id: 'service2',
      name: 'staketab.org',
      publisherUrl: '/publisher2',
      aggregatorUrl: '/aggregator2',
    },
    {
      id: 'service3',
      name: 'redundex.com',
      publisherUrl: '/publisher3',
      aggregatorUrl: '/aggregator3',
    },
    {
      id: 'service4',
      name: 'nodes.guru',
      publisherUrl: '/publisher4',
      aggregatorUrl: '/aggregator4',
    },
    {
      id: 'service5',
      name: 'banansen.dev',
      publisherUrl: '/publisher5',
      aggregatorUrl: '/aggregator5',
    },
    {
      id: 'service6',
      name: 'everstake.one',
      publisherUrl: '/publisher6',
      aggregatorUrl: '/aggregator6',
    },
  ];

  function getAggregatorUrl(path: string): string {
    const service = services.find((s) => s.id === selectedService);
    const cleanPath = path.replace(/^\/+/, '').replace(/^v1\//, '');
    return `/api${service?.aggregatorUrl}/v1/${cleanPath}`;
  }

  function getPublisherUrl(path: string): string {
    const service = services.find((s) => s.id === selectedService);
    const cleanPath = path.replace(/^\/+/, '').replace(/^v1\//, '');
    return `/api${service?.publisherUrl}/v1/${cleanPath}`;
  }

  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
          showEffects: true,
        },
      }),
  });

  const handleFileChange = (event: any) => {
    const file = event.target.files[0];
    if (file.size > 100 * 1024 * 1024) {
      alert('文件大小必须小于100MB');
      return;
    }
    
    const validTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
      'application/vnd.openxmlformats-officedocument.presentationml.template'
    ];
    
    if (!validTypes.some(type => file.type === type)) {
      alert('仅支持图片、视频和PowerPoint文件');
      return;
    }
    
    setFile(file);
    setInfo(null);
  };

  const handleUploadAndBind = async () => {
    if (!file) {
      setError('请先选择文件');
      return;
    }
    
    if (!policyObject || !cap_id) {
      setError('缺少必要的项目配置');
      return;
    }
    
    setIsUploading(true);
    setUploadStep('encrypting');
    setUploadProgress(10);
    setError(null);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async function (event) {
        if (event.target && event.target.result) {
          const result = event.target.result;
          if (result instanceof ArrayBuffer) {
            try {
              setUploadProgress(30);
              const nonce = crypto.getRandomValues(new Uint8Array(5));
              const policyObjectBytes = fromHex(policyObject);
              const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));
              
              const { encryptedObject: encryptedBytes } = await client.encrypt({
                threshold: 2,
                packageId,
                id,
                data: new Uint8Array(result),
              });
              
              setUploadStep('uploading');
              setUploadProgress(60);
              
              const storageInfo = await storeBlob(encryptedBytes);
              const uploadInfo = displayUpload(storageInfo.info, file.type);
              
              setUploadStep('binding');
              setUploadProgress(80);
              
              await publishToContract(policyObject, cap_id, moduleName, uploadInfo.blobId);
              
              setUploadStep('complete');
              setUploadProgress(100);
              
              setTimeout(() => {
                router.push('/explore');
              }, 2000);
              
            } catch (error: any) {
              console.error('处理过程中出错:', error);
              setError(`上传失败: ${error.message}`);
              setUploadStep('idle');
              setIsUploading(false);
            }
          } else {
            setError('文件格式不支持');
            setUploadStep('idle');
            setIsUploading(false);
          }
        }
      };
      
      reader.readAsArrayBuffer(file);
      
    } catch (error: any) {
      setError(`上传过程出错: ${error.message}`);
      setUploadStep('idle');
      setIsUploading(false);
    }
  };

  const publishToContract = (wl_id: string, cap_id: string, moduleName: string, blobId: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        const tx = new Transaction();
        tx.moveCall({
          target: `${packageId}::${moduleName}::publish`,
          arguments: [tx.object(wl_id), tx.object(cap_id), tx.pure.string(blobId)],
        });

        tx.setGasBudget(10000000);
        
        signAndExecute(
          {
            transaction: tx,
          },
          {
            onSuccess: async (result) => {
              console.log('合约绑定成功:', result);
              resolve();
            },
            onError: (error) => {
              console.error('合约绑定失败:', error);
              setError(`绑定失败: ${error.message}`);
              reject(error);
            }
          },
        );
      } catch (error) {
        reject(error);
      }
    });
  };

  const displayUpload = (storage_info: any, media_type: any): Data => {
    let info;
    const isPPT = media_type.includes('powerpoint') || 
                 media_type.includes('presentation') ||
                 media_type.endsWith('.ppt') || 
                 media_type.endsWith('.pptx');
    
    if ('alreadyCertified' in storage_info) {
      info = {
        status: 'Already certified',
        blobId: storage_info.alreadyCertified.blobId,
        endEpoch: storage_info.alreadyCertified.endEpoch,
        suiRefType: 'Previous Sui Certified Event',
        suiRef: storage_info.alreadyCertified.event.txDigest,
        suiBaseUrl: SUI_VIEW_TX_URL,
        blobUrl: getAggregatorUrl(`/v1/blobs/${storage_info.alreadyCertified.blobId}`),
        suiUrl: `${SUI_VIEW_OBJECT_URL}/${storage_info.alreadyCertified.event.txDigest}`,
        isImage: media_type.startsWith('image'),
        isVideo: media_type.startsWith('video'),
        isPPT: isPPT,
      };
    } else if ('newlyCreated' in storage_info) {
      info = {
        status: 'Newly created',
        blobId: storage_info.newlyCreated.blobObject.blobId,
        endEpoch: storage_info.newlyCreated.blobObject.storage.endEpoch,
        suiRefType: 'Associated Sui Object',
        suiRef: storage_info.newlyCreated.blobObject.id,
        suiBaseUrl: SUI_VIEW_OBJECT_URL,
        blobUrl: getAggregatorUrl(`/v1/blobs/${storage_info.newlyCreated.blobObject.blobId}`),
        suiUrl: `${SUI_VIEW_OBJECT_URL}/${storage_info.newlyCreated.blobObject.id}`,
        isImage: media_type.startsWith('image'),
        isVideo: media_type.startsWith('video'),
        isPPT: isPPT,
      };
    } else {
      throw Error('Unhandled successful response!');
    }
    setInfo(info);
    return info;
  };

  const storeBlob = (encryptedData: Uint8Array) => {
    const url = getPublisherUrl(`/v1/blobs?epochs=${NUM_EPOCH}`);
    console.log('===DEBUG=== 上传URL:', url);
    console.log('===DEBUG=== 选择的服务:', selectedService);
    console.log('===DEBUG=== 加密数据大小:', encryptedData.byteLength);
    console.log('===DEBUG=== 服务对象:', services.find(s => s.id === selectedService));
    
    return fetch(url, {
      method: 'PUT',
      body: encryptedData,
      headers: {
        'Content-Type': 'application/octet-stream'
      }
    }).then((response) => {
      console.log('===DEBUG=== 响应状态:', response.status, response.statusText);
      
      if (response.status === 200) {
        return response.json().then((info) => {
          console.log('===DEBUG=== 成功响应:', info);
          return { info };
        });
      } else {
        console.error('===DEBUG=== 错误响应:', response.status);
        response.text().then(text => console.error('===DEBUG=== 错误详情:', text));
        alert('Error publishing the blob on Walrus, please select a different Walrus service.');
        setIsUploading(false);
        throw new Error('Something went wrong when storing the blob!');
      }
    }).catch(error => {
      console.error('===DEBUG=== 捕获到错误:', error);
      throw error;
    });
  };

  return (
    <Card className="p-6 shadow-md">
      <Flex direction="column" gap="4">
        <Box>
          <Text size="5" weight="bold" className="mb-2">上传加密文件</Text>
          <Text size="2" color="gray">
            上传后的文件将被加密并存储在Walrus服务上，自动绑定到您的项目
          </Text>
        </Box>
        
        <Separator size="4" />
        
        <Card className="p-4 border-2 border-blue-100">
          <Flex direction="column" gap="3">
            <Flex gap="2" align="center" className="mb-2">
              <Text size="2">Walrus服务提供商:</Text>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="px-3 py-1 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Select Walrus service"
                disabled={isUploading}
              >
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </Flex>
            
            <Box className={`border-2 border-dashed ${isUploading ? 'border-gray-300 bg-gray-50' : 'border-blue-300 hover:bg-blue-50'} rounded-lg p-6 text-center transition-colors`}>
              <Flex direction="column" align="center" gap="2">
                <FileUp size={32} className={isUploading ? "text-gray-400" : "text-blue-400"} />
                
                {!isUploading ? (
                  <>
                    <Text size="2" as="label" htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-blue-500 font-medium">点击选择文件</span>
                      <span> 或拖放文件到此处</span>
                    </Text>
                    
                    <input
                      id="file-upload"
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*,video/*,.ppt,.pptx,.ppsx,.potx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                      className="hidden"
                      aria-label="选择文件上传"
                      disabled={isUploading}
                    />
                  </>
                ) : (
                  <Text size="2" color="gray">文件处理中，请稍候...</Text>
                )}
                
                {file && (
                  <Badge color="green" className="mt-2">
                    已选择: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </Badge>
                )}
                
                <Text size="1" color="gray">
                  文件大小限制为100MB。支持图片、视频和PowerPoint文件。
                </Text>
              </Flex>
            </Box>
            
            {error && (
              <Flex gap="2" align="center" className="p-3 bg-red-50 rounded-md">
                <AlertCircle size={16} className="text-red-500" />
                <Text size="2" color="red">{error}</Text>
              </Flex>
            )}
            
            {isUploading && (
              <Box className="p-4 border border-blue-100 rounded-md bg-blue-50">
                <Flex direction="column" gap="2">
                  <Flex justify="between">
                    <Text size="2" weight="medium">
                      {uploadStep === 'encrypting' && '正在加密文件...'}
                      {uploadStep === 'uploading' && '正在上传到Walrus...'}
                      {uploadStep === 'binding' && '正在绑定到项目...'}
                      {uploadStep === 'complete' && '处理完成!'}
                    </Text>
                    <Text size="2">{uploadProgress}%</Text>
                  </Flex>
                  
                  <Progress value={uploadProgress} max={100} size="2" 
                    color={uploadStep === 'complete' ? 'green' : 'blue'} />
                  
                  <Text size="1" color="gray">
                    {uploadStep === 'encrypting' && '加密确保文件安全...'}
                    {uploadStep === 'uploading' && '上传到分布式存储中...'}
                    {uploadStep === 'binding' && '将文件绑定到您的项目...'}
                    {uploadStep === 'complete' && '所有步骤完成，即将跳转...'}
                  </Text>
                </Flex>
              </Box>
            )}
            
            <Button
          onClick={handleUploadAndBind}
          disabled={!file || isUploading || !policyObject || !cap_id}
          className="mt-2"
          variant="solid"
          color="blue"
          size="3"
        >
          <Flex gap="2" align="center">
            <Upload size={16} /> 
            加密上传并绑定到项目
          </Flex>
        </Button>
          </Flex>
        </Card>
        
        {uploadStep === 'complete' && info && (
          <Box className="p-4 bg-green-50 border-2 border-green-100 rounded-md">
            <Flex direction="column" gap="3">
              <Flex align="center" gap="2">
                <Check size={18} className="text-green-600" />
                <Text size="3" weight="medium" color="green">处理完成!</Text>
              </Flex>
              
              <Separator size="1" className="my-1" />
              
              <Flex gap="2" align="center">
                <Text size="2">文件ID:</Text>
                <Badge variant="soft" color="gray" size="1">
                  {info.blobId.substring(0, 16)}...
                </Badge>
              </Flex>
              
              <Flex gap="3">
                <Button size="1" variant="soft" asChild>
                  <a
                    href={info.blobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Flex gap="1" align="center">
                      <Link size={12} /> 
                      查看加密文件
                    </Flex>
                  </a>
                </Button>
                
                <Button size="1" variant="soft" asChild>
                  <a
                    href={info.suiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Flex gap="1" align="center">
                      <ExternalLink size={12} /> 
                      查看区块链记录
                    </Flex>
                  </a>
                </Button>
              </Flex>
              
              <Text size="2" color="green">
                上传和绑定成功，即将跳转到浏览页面...
              </Text>
            </Flex>
          </Box>
        )}
      </Flex>
    </Card>
  );
}

export default WalrusUpload;
