/**
 * /api/profile
 * - GET: return current profile
 * - PATCH: dual-purpose:
 *   • JSON body with { file: { text, sourceKind, fileName, fileSize } } → save parsed CV
 *   • JSON body with { fullName, targetRole, targetContext } → update metadata
 *
 * Files are parsed CLIENT-SIDE (in the browser) and only the extracted text
 * is sent to the server. This avoids the edge layer's body size limit and
 * multipart corruption issues.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 30;

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

    // Save parsed CV text (parsed client-side)
    if (body.file && body.file.text) {
      return handleSaveParsedText(body.file);
    }

    // Metadata update
    return handleMetadataUpdate(body);
  } catch (err: any) {
    console.error('PATCH error:', err);
    return NextResponse.json({ error: 'Request failed.', detail: err?.message }, { status: 500 });
  }
}

async function handleSaveParsedText(file: { text: string; sourceKind: string; fileName: string; fileSize: number }) {
  try {
    const extractedText = (file.text || '').trim();
    if (extractedText.length < 50) {
      return NextResponse.json(
        { error: 'The extracted text is too short. The file may be empty or unreadable.' },
        { status: 422 }
      );
    }

    const sourceKind = file.sourceKind === 'linkedin' ? 'linkedin' : 'resume';
    const existing = await db.profile.findFirst({ orderBy: { createdAt: 'desc' } });

    let profile;
    if (existing) {
      await db.skillRun.deleteMany({ where: { profileId: existing.id } });
      await db.uploadedFile.deleteMany({ where: { profileId: existing.id } });
      profile = await db.profile.update({
        where: { id: existing.id },
        data: { rawText: extractedText, sourceKind, fileName: file.fileName, parsedJson: null },
      });
    } else {
      profile = await db.profile.create({
        data: { rawText: extractedText, sourceKind, fileName: file.fileName },
      });
    }

    await db.uploadedFile.create({
      data: {
        profileId: profile.id,
        fileName: file.fileName,
        fileType: 'text/plain',
        fileSize: file.fileSize || extractedText.length,
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
    console.error('Save error:', err);
    return NextResponse.json(
      { error: 'Internal server error while saving profile.', detail: err?.message },
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
