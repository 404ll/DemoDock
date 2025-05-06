import { NextRequest, NextResponse } from 'next/server';

// 正确的Walrus服务URL配置
const WALRUS_SERVICE_URLS = {
  publisher1: 'https://walrus.space/publisher1',
  aggregator1: 'https://walrus.space/aggregator1',
  publisher2: 'https://staketab.org/publisher2',
  aggregator2: 'https://staketab.org/aggregator2',
  publisher3: 'https://redundex.com/publisher3',
  aggregator3: 'https://redundex.com/aggregator3',
  publisher4: 'https://nodes.guru/publisher4',
  aggregator4: 'https://nodes.guru/aggregator4',
  publisher5: 'https://banansen.dev/publisher5',
  aggregator5: 'https://banansen.dev/aggregator5',
  publisher6: 'https://everstake.one/publisher6',
  aggregator6: 'https://everstake.one/aggregator6',
};

export async function GET(
  request: NextRequest,
  { params }: { params: { service: string; path: string[] } }
) {
  const { service, path } = params;
  const baseUrl = WALRUS_SERVICE_URLS[service as keyof typeof WALRUS_SERVICE_URLS];
  
  if (!baseUrl) {
    return NextResponse.json({ error: 'Invalid service' }, { status: 400 });
  }
  
  const pathString = path.join('/');
  // 注意URL构建方式
  const targetUrl = `${baseUrl}/v1/${pathString}${request.nextUrl.search}`;
  console.log(`GET请求Walrus: ${targetUrl}`);
  
  try {
    const response = await fetch(targetUrl);
    const data = await response.arrayBuffer();
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
      },
    });
  } catch (error) {
    console.error("Walrus GET错误:", error);
    return NextResponse.json({ error: 'Failed to fetch from Walrus service' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { service: string; path: string[] } }
) {
  const { service, path } = params;
  const baseUrl = WALRUS_SERVICE_URLS[service as keyof typeof WALRUS_SERVICE_URLS];
  
  if (!baseUrl) {
    return NextResponse.json({ error: 'Invalid service' }, { status: 400 });
  }
  
  const pathString = path.join('/');
  const targetUrl = `${baseUrl}/v1/${pathString}${request.nextUrl.search}`;
  console.log(`PUT请求Walrus: ${targetUrl}`);
  
  try {
    const body = await request.arrayBuffer();
    console.log(`上传数据大小: ${body.byteLength} 字节`);
    
    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: body,
    });
    
    if (!response.ok) {
      console.error(`Walrus响应错误: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`错误详情: ${errorText}`);
      return NextResponse.json({ 
        error: 'Walrus service error',
        status: response.status,
        message: errorText
      }, { status: response.status });
    }
    
    const responseData = await response.json();
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Walrus上传错误:", error);
    return NextResponse.json({ 
      error: 'Failed to upload to Walrus service',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}