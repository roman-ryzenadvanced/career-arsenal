/**
 * /api/profile
 * - GET: return current profile
 * - PATCH: dual-purpose:
 *   • JSON body with { file: { name, data (base64) } } → file upload
 *   • JSON body with { fullName, targetRole, targetContext } → metadata update
 *
 * Multipart/form-data is NOT used because the edge layer corrupts it.
 * Files are sent as base64-encoded JSON instead.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import mammoth from 'mammoth';
import { extractText, getDocumentProxy } from 'unpdf';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

export async function GET() {
  const profile = await db.profile.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { skillRuns: true, uploads: true } } },
  });
  if (!profile) return NextResponse.json({ profile: null });

  return NextResponse.json({
    profile: {
      id: profile.id,
      fullName: profile.fullName,
      sourceKind: profile.sourceKind,
      fileName: profile.fileName,
      textPreview: profile.rawText.slice(0, 500),
      textLength: profile.rawText.length,
      rawText: profile.rawText,
      targetRole: profile.targetRole,
      targetContext: profile.targetContext,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      counts: {
        skillRuns: profile._count.skillRuns,
        uploads: profile._count.uploads,
      },
    },
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    // File upload via base64 JSON
    if (body.file && body.file.data) {
      return handleFileUpload(body.file.name, body.file.data);
    }

    // Metadata update
    return handleMetadataUpdate(body);
  } catch (err: any) {
    console.error('PATCH error:', err);
    return NextResponse.json({ error: 'Request failed.', detail: err?.message }, { status: 500 });
  }
}

async function handleFileUpload(fileName: string, base64Data: string) {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const lowerName = fileName.toLowerCase();

    let extractedText = '';
    try {
      if (lowerName.endsWith('.pdf')) {
        extractedText = await extractPdfText(buffer);
      } else if (lowerName.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value || '';
      } else if (lowerName.endsWith('.txt') || lowerName.endsWith('.md')) {
        extractedText = buffer.toString('utf-8');
      } else {
        return NextResponse.json(
          { error: 'Unsupported file type. Please upload PDF, DOCX, or TXT.' },
          { status: 400 }
        );
      }
    } catch (parseError: any) {
      console.error('Parse error:', parseError?.message || parseError);
      return NextResponse.json(
        { error: 'Failed to parse the file. Make sure it is a valid PDF/DOCX/TXT.' },
        { status: 422 }
      );
    }

    extractedText = extractedText.trim();
    if (extractedText.length < 50) {
      return NextResponse.json(
        { error: 'The file appears to be empty or could not be parsed (text too short).' },
        { status: 422 }
      );
    }

    const sourceKind = lowerName.includes('linkedin') ? 'linkedin' : 'resume';
    const existing = await db.profile.findFirst({ orderBy: { createdAt: 'desc' } });

    let profile;
    if (existing) {
      await db.skillRun.deleteMany({ where: { profileId: existing.id } });
      await db.uploadedFile.deleteMany({ where: { profileId: existing.id } });
      profile = await db.profile.update({
        where: { id: existing.id },
        data: { rawText: extractedText, sourceKind, fileName, parsedJson: null },
      });
    } else {
      profile = await db.profile.create({
        data: { rawText: extractedText, sourceKind, fileName },
      });
    }

    await db.uploadedFile.create({
      data: {
        profileId: profile.id,
        fileName,
        fileType: 'application/octet-stream',
        fileSize: buffer.length,
        extractedText,
      },
    });

    return NextResponse.json({
      ok: true,
      profile: {
        id: profile.id,
        fullName: profile.fullName,
        sourceKind: profile.sourceKind,
        fileName: profile.fileName,
        textPreview: extractedText.slice(0, 500),
        textLength: extractedText.length,
        targetRole: profile.targetRole,
        targetContext: profile.targetContext,
        createdAt: profile.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: 'Internal server error during upload.', detail: err?.message },
      { status: 500 }
    );
  }
}

async function handleMetadataUpdate(body: any) {
  const profile = await db.profile.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!profile) {
    return NextResponse.json({ error: 'No profile found. Upload a resume first.' }, { status: 404 });
  }

  const updated = await db.profile.update({
    where: { id: profile.id },
    data: {
      fullName: body.fullName !== undefined ? body.fullName : profile.fullName,
      targetRole: body.targetRole !== undefined ? body.targetRole : profile.targetRole,
      targetContext: body.targetContext !== undefined ? body.targetContext : profile.targetContext,
    },
  });

  return NextResponse.json({
    ok: true,
    profile: {
      id: updated.id,
      fullName: updated.fullName,
      targetRole: updated.targetRole,
      targetContext: updated.targetContext,
    },
  });
}
