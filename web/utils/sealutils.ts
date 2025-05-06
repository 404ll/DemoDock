import { SealClient, SessionKey, NoAccessError, EncryptedObject } from '@mysten/seal';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { fromHex, toHex } from '@mysten/sui/utils';
import { getAllowlistedKeyServers } from '@mysten/seal';

// 修改服务配置
export const WALRUS_SERVICES = [
  {
    id: 'service1',
    name: 'walrus.space',
    publisherUrl: '/api/walrus/publisher1',
    aggregatorUrl: '/api/walrus/aggregator1',
  },
  {
    id: 'service2',
    name: 'staketab.org',
    publisherUrl: '/api/walrus/publisher2',
    aggregatorUrl: '/api/walrus/aggregator2',
  },
  {
    id: 'service3',
    name: 'redundex.com',
    publisherUrl: '/api/walrus/publisher3',
    aggregatorUrl: '/api/walrus/aggregator3',
  },
  {
    id: 'service4',
    name: 'nodes.guru',
    publisherUrl: '/api/walrus/publisher4',
    aggregatorUrl: '/api/walrus/aggregator4',
  },
  {
    id: 'service5',
    name: 'banansen.dev',
    publisherUrl: '/api/walrus/publisher5',
    aggregatorUrl: '/api/walrus/aggregator5',
  },
];

// 获取服务URL
export function getPublisherUrl(path: string, serviceId: string = 'service1'): string {
  const service = WALRUS_SERVICES.find(s => s.id === serviceId);
  const cleanPath = path.replace(/^\/+/, '').replace(/^v1\//, '');
  return `${service?.publisherUrl}/v1/${cleanPath}`;
}

export function getAggregatorUrl(path: string, serviceId: string = 'service1'): string {
  const service = WALRUS_SERVICES.find(s => s.id === serviceId);
  const cleanPath = path.replace(/^\/+/, '').replace(/^v1\//, '');
  return `${service?.aggregatorUrl}/v1/${cleanPath}`;
}

// 检测文件MIME类型
export function detectMimeType(buffer: Uint8Array): string {
  // 检查文件头来确定格式
  const hex = Array.from(buffer.slice(0, 16))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('').toUpperCase();
  
  // 常见文件格式的Magic Numbers
  if (hex.startsWith('FFD8FF')) return 'image/jpeg';
  if (hex.startsWith('89504E47')) return 'image/png';
  if (hex.startsWith('47494638')) return 'image/gif';
  
  // 检查MP4格式
  try {
    const fourcc = new TextDecoder().decode(buffer.slice(4, 8));
    if (fourcc === 'ftyp') return 'video/mp4';
  } catch (e) {}
  
  // 检查WebM格式
  if (hex.startsWith('1A45DFA3')) return 'video/webm';
  
  // 检查MPEG格式
  if (hex.startsWith('000001BA') || hex.startsWith('000001B3')) return 'video/mpeg';
  
  // 添加PPT格式检测
  if (hex.startsWith('D0CF11E0A1B11AE1')) {
    return 'application/vnd.ms-powerpoint';
  }
  
  // PowerPoint (.pptx)
  if (hex.startsWith('504B0304')) {
    return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  }
  
  return 'application/octet-stream';
}

// 更新加密上传函数
export async function encryptAndUpload(
  file: File,
  policyObject: string,
  suiClient: SuiClient,
  packageId: string,
  serviceId: string = 'service1'
): Promise<{ blobId: string; fileName: string; fileType: string }> {
  // 1. 读取文件
  const arrayBuffer = await file.arrayBuffer();
  const fileData = new Uint8Array(arrayBuffer);
  
  // 2. 创建SealClient
  const sealClient = new SealClient({
    suiClient,
    serverObjectIds: getAllowlistedKeyServers('testnet'),
    verifyKeyServers: false,
  });
  
  // 3. 生成正确的ID (关键修复点)
  const nonce = crypto.getRandomValues(new Uint8Array(5));
  const policyObjectBytes = fromHex(policyObject);
  const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));
  
  // 4. 加密文件
  const { encryptedObject } = await sealClient.encrypt({
    threshold: 2,
    packageId,
    id,
    data: fileData,
  });
  
  // 5. 根据serviceId参数选择服务
  const service = WALRUS_SERVICES.find(s => s.id === serviceId);
  if (!service) {
    throw new Error(`指定的服务 ${serviceId} 不存在`);
  }
  
  console.log(`尝试上传到指定服务: ${service.name} (ID: ${serviceId})`);
  
  try {
    const publisherUrl = service.publisherUrl;
    const response = await fetch(`${publisherUrl}/blobs?epochs=1`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: encryptedObject,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${service.name} 上传失败: ${response.status} - ${errorText}`);
    }
    
    // 解析响应
    const result = await response.json();
    let blobId = '';
    
    if ('alreadyCertified' in result) {
      blobId = result.alreadyCertified.blobId;
      console.log(`文件已存在于 ${service.name}, blobId: ${blobId}`);
    } else if ('newlyCreated' in result) {
      blobId = result.newlyCreated.blobObject.blobId;
      console.log(`成功上传到 ${service.name}, blobId: ${blobId}`);
    } else {
      throw new Error(`${service.name} 返回未知格式响应`);
    }
    
    // 成功上传
    return {
      blobId,
      fileName: file.name,
      fileType: file.type || detectMimeType(fileData),
    };
  } catch (error) {
    throw new Error(`上传到 ${service.name} 失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 下载并解密文件 - 修复为正确实现
export async function downloadAndDecrypt(
  blobIds: string[],
  sessionKey: SessionKey,
  suiClient: SuiClient,
  sealClient: SealClient,
  moveCallConstructor: (tx: Transaction, id: string) => void,
  setError: (error: string) => void,
  onSuccess: (files: {url: string, type: string}[]) => void
) {
  try {
    // 下载所有文件，忽略失败的下载
    const downloadResults = await Promise.all(
      blobIds.map(async (blobId) => {
        try {
          const response = await fetch(getAggregatorUrl(`/blobs/${blobId}`));
          if (!response.ok) {
            return null;
          }
          return await response.arrayBuffer();
        } catch (err) {
          console.error(`无法从Walrus获取Blob ${blobId}`, err);
          return null;
        }
      })
    );
    
    // 过滤掉失败的下载
    const validDownloads = downloadResults.filter((result): result is ArrayBuffer => result !== null);
    
    if (validDownloads.length === 0) {
      setError('无法从Walrus获取文件，请稍后再试');
      return;
    }
    
    // 批量获取密钥 (每批最多10个)
    for (let i = 0; i < validDownloads.length; i += 10) {
      const batch = validDownloads.slice(i, i + 10);
      const ids = batch.map((enc) => EncryptedObject.parse(new Uint8Array(enc)).id);
      const tx = new Transaction();
      ids.forEach((id) => moveCallConstructor(tx, id));
      const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
      
      try {
        await sealClient.fetchKeys({ ids, txBytes, sessionKey, threshold: 2 });
      } catch (err) {
        const errorMsg = err instanceof NoAccessError
          ? '没有访问解密密钥的权限'
          : '无法解密文件，请重试';
        console.error(errorMsg, err);
        setError(errorMsg);
        return;
      }
    }
    
    // 顺序解密文件
    const decryptedFileUrls: {url: string, type: string}[] = [];
    
    for (const encryptedData of validDownloads) {
      const fullId = EncryptedObject.parse(new Uint8Array(encryptedData)).id;
      const tx = new Transaction();
      moveCallConstructor(tx, fullId);
      const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
      
      try {
        // 所有密钥已经获取，这里只做本地解密
        const decryptedData = await sealClient.decrypt({
          data: new Uint8Array(encryptedData),
          sessionKey,
          txBytes,
        });
        
        // 检测MIME类型并创建URL
        const mimeType = detectMimeType(decryptedData);
        const blob = new Blob([decryptedData], { type: mimeType });
        decryptedFileUrls.push({ 
          url: URL.createObjectURL(blob), 
          type: mimeType 
        });
      } catch (err) {
        const errorMsg = err instanceof NoAccessError
          ? '没有访问解密密钥的权限'
          : '无法解密文件，请重试';
        console.error(errorMsg, err);
        setError(errorMsg);
        return;
      }
    }
    
    if (decryptedFileUrls.length > 0) {
      onSuccess(decryptedFileUrls);
    } else {
      setError('没有文件被成功解密');
    }
    
  } catch (error) {
    console.error('解密过程发生错误:', error);
    setError(error instanceof Error ? error.message : '解密失败');
  }
}