import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Temporalmente deshabilitado para evitar problemas con Prisma
    return NextResponse.json(
      { error: 'Registro temporalmente deshabilitado' },
      { status: 503 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
