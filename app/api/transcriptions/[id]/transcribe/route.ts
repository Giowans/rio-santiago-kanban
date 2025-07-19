
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { readFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

// POST: Transcribir audio usando Whisper
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const transcription = await prisma.transcription.findUnique({
      where: {
        id: params.id
      }
    });

    if (!transcription) {
      return NextResponse.json(
        { error: 'Transcripción no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (transcription.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Verificar que no esté ya transcrito
    if (transcription.transcriptText) {
      return NextResponse.json(
        { error: 'Esta transcripción ya ha sido procesada' },
        { status: 400 }
      );
    }

    // Actualizar estado a TRANSCRIBING
    await prisma.transcription.update({
      where: {
        id: params.id
      },
      data: {
        status: 'TRANSCRIBING'
      }
    });

    // Leer archivo de audio
    const filePath = path.join(process.cwd(), 'uploads', 'transcriptions', transcription.filename);
    const audioBuffer = await readFile(filePath);
    const base64String = audioBuffer.toString('base64');

    // Preparar mensajes para la API de LLM
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'file',
            file: {
              filename: transcription.originalName,
              file_data: `data:${transcription.mimeType};base64,${base64String}`
            }
          },
          {
            type: 'text',
            text: 'Por favor, transcribe el audio en este archivo. Proporciona únicamente el texto transcrito, sin comentarios adicionales.'
          }
        ]
      }
    ];

    // Llamar a la API de LLM usando streaming
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'whisper-large-v3',
        messages: messages,
        stream: true,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      await prisma.transcription.update({
        where: { id: params.id },
        data: { status: 'ERROR' }
      });
      return NextResponse.json(
        { error: 'Error al conectar con el servicio de transcripción' },
        { status: 500 }
      );
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.error('No se pudo obtener el stream');
            return;
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  // Guardar transcripción completa en la base de datos
                  await prisma.transcription.update({
                    where: { id: params.id },
                    data: {
                      transcriptText: buffer,
                      status: 'COMPLETED'
                    }
                  });

                  // Crear log de auditoría
                  await createAuditLog({
                    action: 'TRANSCRIBE_AUDIO',
                    entity: 'transcription',
                    entityId: params.id,
                    userId: session.user.id
                  });

                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    buffer += content;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({content})}\n\n`));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          await prisma.transcription.update({
            where: { id: params.id },
            data: { status: 'ERROR' }
          });
          controller.error(error);
        }
      }
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error transcribing audio:', error);
    
    // Actualizar estado a ERROR
    await prisma.transcription.update({
      where: { id: params.id },
      data: { status: 'ERROR' }
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
