/**
 * POST /api/download-file
 * 
 * Server-side file download — avoids CDN caching issues with client-side JS.
 * The frontend sends the file content + type, and the server returns it
 * with proper headers.
 *
 * Body: { content: string, fileName: string, fileType: string }
 * Returns: HTML page with rendered content + download toolbar (for all types)
 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const content: string = body.content || '';
    const fileName: string = body.fileName || 'download';
    const fileType: string = body.fileType || 'txt';

    if (!content) {
      return NextResponse.json({ error: 'No content provided.' }, { status: 400 });
    }

    // Build a complete HTML page with rendered content + download toolbar
    let html: string;

    if (content.trim().startsWith('<') || content.trim().startsWith('<!DOCTYPE')) {
      // Content is HTML — inject toolbar before </body>
      html = content.replace('</body>',
        `<div style="position:fixed;bottom:0;left:0;right:0;background:#1a1a1a;padding:12px;text-align:center;z-index:9999;">
          <button onclick="window.print()" style="padding:10px 24px;font-size:14px;cursor:pointer;background:#fff;border:none;border-radius:6px;margin:0 4px;">🖨️ Save as PDF</button>
          <button onclick="dl()" style="padding:10px 24px;font-size:14px;cursor:pointer;background:#3b82f6;color:#fff;border:none;border-radius:6px;margin:0 4px;">💾 Download HTML</button>
        </div>
        <script>
        function dl(){
          var b=new Blob([document.documentElement.outerHTML],{type:'text/html'});
          var u=URL.createObjectURL(b);var a=document.createElement('a');a.href=u;a.download='${fileName}.html';a.click();URL.revokeObjectURL(u);
        }
        </script>
        </body>`);
    } else {
      // Content is markdown or text — wrap in styled HTML
      html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${fileName}</title>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<style>
@page { margin: 1.5cm; }
body { font-family: Georgia, serif; max-width: 210mm; margin: 0 auto; padding: 20px 20px 80px; line-height: 1.6; color: #1a1a1a; }
h1 { font-size: 22pt; border-bottom: 2px solid #333; padding-bottom: 4px; }
h2 { font-size: 14pt; margin-top: 1.2em; text-transform: uppercase; letter-spacing: 1px; }
h3 { font-size: 12pt; }
ul, ol { padding-left: 1.5em; }
li { margin: 3px 0; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #999; padding: 6px; }
code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
pre { background: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; }
.toolbar { position: fixed; bottom: 0; left: 0; right: 0; background: #1a1a1a; padding: 12px; text-align: center; z-index: 9999; }
@media print { .toolbar { display: none !important; } body { padding: 20px; } }
</style>
</head><body>
<div id="content"></div>
<div class="toolbar">
  <button onclick="window.print()" style="padding:10px 24px;font-size:14px;cursor:pointer;background:#fff;border:none;border-radius:6px;margin:0 4px;">🖨️ Save as PDF</button>
  <button onclick="dlMD()" style="padding:10px 24px;font-size:14px;cursor:pointer;background:#3b82f6;color:#fff;border:none;border-radius:6px;margin:0 4px;">💾 Download .md</button>
  <button onclick="dlHTML()" style="padding:10px 24px;font-size:14px;cursor:pointer;background:#10b981;color:#fff;border:none;border-radius:6px;margin:0 4px;">💾 Download .html</button>
</div>
<script>
var rawContent = ${JSON.stringify(content)};
document.getElementById('content').innerHTML = marked.parse(rawContent);
function dlMD(){
  var b=new Blob([rawContent],{type:'text/markdown'});
  var u=URL.createObjectURL(b);var a=document.createElement('a');a.href=u;a.download='${fileName}.md';a.click();URL.revokeObjectURL(u);
}
function dlHTML(){
  var html='<!DOCTYPE html>\\n'+document.documentElement.outerHTML;
  var b=new Blob([html],{type:'text/html'});
  var u=URL.createObjectURL(b);var a=document.createElement('a');a.href=u;a.download='${fileName}.html';a.click();URL.revokeObjectURL(u);
}
</script>
</body></html>`;
    }

    // Return as HTML with no-cache headers
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to generate file.' }, { status: 500 });
  }
}
