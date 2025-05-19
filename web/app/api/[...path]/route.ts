import { NextRequest, NextResponse } from 'next/server';

// Walrus 节点映射表
const WALRUS_ENDPOINTS: { [key: string]: string } = {
  'publisher1': 'https://publisher.walrus-testnet.walrus.space',
  'publisher2': 'https://wal-publisher-testnet.staketab.org',
  'publisher3': 'https://walrus-testnet-publisher.redundex.com',
  'publisher4': 'https://walrus-testnet-publisher.nodes.guru',
  'publisher5': 'https://publisher.walrus.banansen.dev',
  'publisher6': 'https://walrus-testnet-publisher.everstake.one',
  'aggregator1': 'https://aggregator.walrus-testnet.walrus.space',
  'aggregator2': 'https://wal-aggregator-testnet.staketab.org',
  'aggregator3': 'https://walrus-testnet-aggregator.redundex.com',
  'aggregator4': 'https://walrus-testnet-aggregator.nodes.guru',
  'aggregator5': 'https://aggregator.walrus.banansen.dev',
  'aggregator6': 'https://walrus-testnet-aggregator.everstake.one',
};

export async function GET(request: NextRequest) {
  return handleRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return handleRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return handleRequest(request, 'PUT');
}

async function handleRequest(request: NextRequest, method: string) {
  const { pathname, search } = request.nextUrl;

  // /api/[...path] => 获取 [...path]
  const pathSegments = pathname.split('/').slice(2); // 忽略空和 api

  console.log('✅ API请求已接收:', method, pathSegments);
  console.log('🔍 请求URL:', request.url);

  const serviceName = pathSegments[0];
  const remainingPath = pathSegments.slice(1).join('/');

  if (!WALRUS_ENDPOINTS[serviceName]) {
    console.error(`未知的服务名称: ${serviceName}`);
    return NextResponse.json({ error: 'Unknown service' }, { status: 404 });
  }

  const targetUrl = `${WALRUS_ENDPOINTS[serviceName]}/${remainingPath}${search}`;

  console.log(`🚀 正在转发到: ${targetUrl}`);

  try {
    const headers = new Headers();
    for (const [key, value] of request.headers.entries()) {
      if (!['host', 'connection'].includes(key.toLowerCase())) {
        headers.append(key, value);
      }
    }

    headers.set('Content-Type', 'application/octet-stream');

    const response = await fetch(targetUrl, {
      method,
      headers,
      body: method !== 'GET' ? await request.arrayBuffer() : undefined,
      redirect: 'follow',
    });

    const responseData = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    return new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error: unknown) {
    console.error(`❌ 转发请求失败:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      { error: `Failed to proxy request: ${errorMessage}` },
      { status: 500 }
    );
  }
}
