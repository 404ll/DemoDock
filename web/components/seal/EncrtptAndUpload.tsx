import React, { useState } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { networkConfig } from '@/contracts/index';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Button, Card, Flex, Spinner, Text } from '@radix-ui/themes';
import { getAllowlistedKeyServers, SealClient } from '@mysten/seal';
import { fromHex, toHex } from '@mysten/sui/utils';

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
  const [selectedService, setSelectedService] = useState<string>('service1');

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
    // 扩大文件大小限制到100MB
    if (file.size > 100 * 1024 * 1024) {
      alert('文件大小必须小于100MB');
      return;
    }
    
    // 更新文件类型验证，添加PPT格式
    const validTypes = [
      // 图片类型
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // 视频类型
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
      // PPT类型
      'application/vnd.ms-powerpoint',                                // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.openxmlformats-officedocument.presentationml.slideshow',    // .ppsx
      'application/vnd.openxmlformats-officedocument.presentationml.template'      // .potx
    ];
    
    if (!validTypes.some(type => file.type === type)) {
      alert('仅支持图片、视频和PowerPoint文件');
      return;
    }
    
    setFile(file);
    setInfo(null);
  };

  const handleSubmit = () => {
    setIsUploading(true);
    if (file) {
      const reader = new FileReader();
      reader.onload = async function (event) {
        if (event.target && event.target.result) {
          const result = event.target.result;
          if (result instanceof ArrayBuffer) {
            const nonce = crypto.getRandomValues(new Uint8Array(5));
            const policyObjectBytes = fromHex(policyObject);
            const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));
            const { encryptedObject: encryptedBytes } = await client.encrypt({
              threshold: 2,
              packageId,
              id,
              data: new Uint8Array(result),
            });
            const storageInfo = await storeBlob(encryptedBytes);
            displayUpload(storageInfo.info, file.type);
            setIsUploading(false);
          } else {
            console.error('Unexpected result type:', typeof result);
            setIsUploading(false);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      console.error('No file selected');
    }
  };

  const displayUpload = (storage_info: any, media_type: any) => {
    let info;
    // 检测是否是PPT文件
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
      // 添加请求头调试
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

  async function handlePublish(wl_id: string, cap_id: string, moduleName: string) {
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::${moduleName}::publish`,
      arguments: [tx.object(wl_id), tx.object(cap_id), tx.pure.string(info!.blobId)],
    });

    tx.setGasBudget(10000000);
    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async (result) => {
          console.log('res', result);
          alert('Blob attached successfully, now share the link or upload more.');
        },
      },
    );
  }

  return (
    <Card>
      <Flex direction="column" gap="2" align="start">
        <Flex gap="2" align="center">
          <Text>Select Walrus service:</Text>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            aria-label="Select Walrus service"
          >
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </Flex>
        <input
          type="file"
          onChange={handleFileChange}
          accept="image/*,video/*,.ppt,.pptx,.ppsx,.potx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          aria-label="选择文件上传"
        />
        <p>文件大小限制为100MB。支持图片、视频和PowerPoint文件。</p>
        <Button
          onClick={() => {
            handleSubmit();
          }}
          disabled={file === null}
        >
          First step: Encrypt and upload to Walrus
        </Button>
        {isUploading && (
          <div role="status">
            <Spinner className="animate-spin" aria-label="Uploading" />
            <span>
              Uploading to Walrus (may take a few seconds, retrying with different service is
              possible){' '}
            </span>
          </div>
        )}

        {info && file && (
          <div id="uploaded-blobs" role="region" aria-label="Upload details">
            <dl>
              <dt>Status:</dt>
              <dd>{info.status}</dd>
              <dd>
                <a
                  href={info.blobUrl}
                  style={{ textDecoration: 'underline' }}
                  download
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(info.blobUrl, '_blank', 'noopener,noreferrer');
                  }}
                  aria-label="Download encrypted blob"
                >
                  Encrypted blob
                </a>
              </dd>
              <dd>
                <a
                  href={info.suiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'underline' }}
                  aria-label="View Sui object details"
                >
                  Sui Object
                </a>
              </dd>
            </dl>
          </div>
        )}
        <Button
          onClick={() => {
            handlePublish(policyObject, cap_id, moduleName);
          }}
          disabled={!info || !file || policyObject === ''}
          aria-label="Encrypt and upload file"
        >
          Second step: Associate file to Sui object
        </Button>
      </Flex>
    </Card>
  );
}

export default WalrusUpload;
