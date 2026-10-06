import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();
    if (!apiKey) {
      return NextResponse.json({ error: 'Chưa cung cấp API Key' }, { status: 400 });
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`);
    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const data = await res.json();
    const models = (data.models || []).map((m: any) => ({
      name: m.name?.replace('models/', ''),
      displayName: m.displayName,
      description: m.description,
      supportedGenerationMethods: m.supportedGenerationMethods,
    }));

    return NextResponse.json({ success: true, models });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
