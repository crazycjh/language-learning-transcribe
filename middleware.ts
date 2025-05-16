import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
    matcher: '/youtube/sse'
};

export async function middleware(request: NextRequest) {
    console.log("pathname : ------",request.nextUrl.pathname);
    if(request.nextUrl.pathname.startsWith("/youtube/sse")) {
        console.log("Rewriting to FastAPI SSE endpoint");
        const params = request.nextUrl.searchParams;
        const youtubeUrl = params.get("link");
        console.log("Youtube URL:", youtubeUrl);
        
        // 建立新的 URL，使用 localhost 而不是 0.0.0.0
        const fastWhisperUrl = `http://localhost:8000/youtube/sse?link=${youtubeUrl}`;
        
        // 設置適當的 headers
        const response = NextResponse.rewrite(fastWhisperUrl);
        
        // 允許 SSE 所需的 headers
        response.headers.set('Cache-Control', 'no-cache, no-transform');
        response.headers.set('Connection', 'keep-alive');
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Content-Type', 'text/event-stream');
        
        return response;
    }
    return NextResponse.next();
}
