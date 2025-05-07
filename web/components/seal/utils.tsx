import { SealClient, SessionKey, NoAccessError, EncryptedObject } from '@mysten/seal';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import React from 'react';

export type MoveCallConstructor = (tx: Transaction, id: string) => void;

// 添加这个辅助函数用于检测文件类型
function detectMimeType(buffer: Uint8Array): string {
  // 检查文件头来确定格式
  const hex = Array.from(buffer.slice(0, 16))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('').toUpperCase();
  
  // 常见文件格式的Magic Numbers
  if (hex.startsWith('FFD8FF')) return 'image/jpeg';
  if (hex.startsWith('89504E47')) return 'image/png';
  if (hex.startsWith('47494638')) return 'image/gif';
  
  // 检查MP4格式 (通常在第4字节开始有"ftyp"标记)
  const view = new DataView(buffer.buffer);
  try {
    // 跳过文件大小(4字节)，检查类型标识
    const fourcc = new TextDecoder().decode(buffer.slice(4, 8));
    if (fourcc === 'ftyp') return 'video/mp4';
  } catch (e) {}
  
  // 检查WebM格式
  if (hex.startsWith('1A45DFA3')) return 'video/webm';
  
  // 检查MPEG格式
  if (hex.startsWith('000001BA') || hex.startsWith('000001B3')) return 'video/mpeg';
  
  // 添加PPT格式检测
  // PowerPoint (.ppt) - D0 CF 11 E0 A1 B1 1A E1
  if (hex.startsWith('D0CF11E0A1B11AE1')) {
    return 'application/vnd.ms-powerpoint';
  }
  
  // PowerPoint (.pptx) - 检查ZIP文件头和内部结构
  if (hex.startsWith('504B0304')) {
    // 这是ZIP格式，但需要进一步检查内容以确定是否为PPTX
    // 由于无法在前端轻松读取ZIP内容，我们只能基于文件扩展名猜测
    return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  }
  
  // 默认返回通用二进制类型
  return 'application/octet-stream';
}

export const downloadAndDecrypt = async (
  blobIds: string[],
  sessionKey: SessionKey,
  suiClient: SuiClient,
  sealClient: SealClient,
  moveCallConstructor: (tx: Transaction, id: string) => void,
  setError: (error: string | null) => void,
  setDecryptedFileUrls: (urls: { url: string; type: string }[]) => void,
  setIsDialogOpen: (open: boolean) => void,
  setReloadKey: (updater: (prev: number) => number) => void,
) => {
  const aggregators = ['aggregator1', 'aggregator2', 'aggregator3', 'aggregator4', 'aggregator5', 'aggregator6'];
  // First, download all files in parallel (ignore errors)
  const downloadResults = await Promise.all(
    blobIds.map(async (blobId) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const randomAggregator = aggregators[Math.floor(Math.random() * aggregators.length)];
        const aggregatorUrl = `/api/${randomAggregator}/v1/blobs/${blobId}`;
        const response = await fetch(aggregatorUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) {
          return null;
        }
        console.log(`Blob ${blobId} downloaded from Walrus`);
        console.log(`response`, response);
        return await response.arrayBuffer();
      } catch (err) {
        console.error(`Blob ${blobId} cannot be retrieved from Walrus`, err);
        return null;
      }
    }),
  );

  // Filter out failed downloads
  const validDownloads = downloadResults.filter((result): result is ArrayBuffer => result !== null);
  console.log('validDownloads count', validDownloads.length);

  if (validDownloads.length === 0) {
    const errorMsg =
      'Cannot retrieve files from this Walrus aggregator, try again (a randomly selected aggregator will be used). Files uploaded more than 1 epoch ago have been deleted from Walrus.';
    console.error(errorMsg);
    setError(errorMsg);
    return;
  }

  // Fetch keys in batches of <=10
  for (let i = 0; i < validDownloads.length; i += 10) {
    const batch = validDownloads.slice(i, i + 10);
    const ids = batch.map((enc) => EncryptedObject.parse(new Uint8Array(enc)).id);
    const tx = new Transaction();
    ids.forEach((id) => moveCallConstructor(tx, id));
    const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
    try {
      const aa = await sealClient.fetchKeys({ ids, txBytes, sessionKey, threshold: 2 });
      console.log('Keys fetched successfully',aa);
    } catch (err) {
      console.log(err);
      const errorMsg =
        err instanceof NoAccessError
          ? 'No access to decryption keys'
          : 'Unable to decrypt files, try again';
      console.error(errorMsg, err);
      setError(errorMsg);
      return;
    }
  }

  // Then, decrypt files sequentially
  const decryptedFileUrls: { url: string; type: string }[] = [];
  for (const encryptedData of validDownloads) {
    const fullId = EncryptedObject.parse(new Uint8Array(encryptedData)).id;
    const tx = new Transaction();
    moveCallConstructor(tx, fullId);
    const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
    try {
      // Note that all keys are fetched above, so this only local decryption is done
      const decryptedFile = await sealClient.decrypt({
        data: new Uint8Array(encryptedData),
        sessionKey,
        txBytes,
      });
      const mimeType = detectMimeType(decryptedFile);
      console.log(`检测到文件MIME类型: ${mimeType}`);
      const blob = new Blob([decryptedFile], { type: mimeType });
      decryptedFileUrls.push({ url: URL.createObjectURL(blob), type: mimeType });
    } catch (err) {
      console.log(err);
      const errorMsg =
        err instanceof NoAccessError
          ? 'No access to decryption keys'
          : 'Unable to decrypt files, try again';
      console.error(errorMsg, err);
      setError(errorMsg);
      return;
    }
  }

  if (decryptedFileUrls.length > 0) {
    setDecryptedFileUrls(decryptedFileUrls);
    setIsDialogOpen(true);
    setReloadKey((prev) => prev + 1);
  }
};

export const getObjectExplorerLink = (id: string): React.ReactElement => {
  return React.createElement(
    'a',
    {
      href: `https://testnet.suivision.xyz/object/${id}`,
      target: '_blank',
      rel: 'noopener noreferrer',
      style: { textDecoration: 'underline' },
    },
    id.slice(0, 10) + '...',
  );
};
