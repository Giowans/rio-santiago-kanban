
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeding de la base de datos...');

  // Crear usuarios
  const adminPassword = await bcrypt.hash('admin123', 12);
  const colaboradorPassword = await bcrypt.hash('johndoe123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ceti.mx' },
    update: {},
    create: {
      name: 'Administrador CETI',
      email: 'admin@ceti.mx',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const testUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john@doe.com',
      password: colaboradorPassword,
      role: 'ADMIN', // Admin para testing
    },
  });

  const colaboradores = await Promise.all([
    prisma.user.upsert({
      where: { email: 'maria.lopez@ceti.mx' },
      update: {},
      create: {
        name: 'María López',
        email: 'maria.lopez@ceti.mx',
        password: await bcrypt.hash('maria123', 12),
        role: 'COLABORADOR',
      },
    }),
    prisma.user.upsert({
      where: { email: 'carlos.rodriguez@ceti.mx' },
      update: {},
      create: {
        name: 'Carlos Rodríguez',
        email: 'carlos.rodriguez@ceti.mx',
        password: await bcrypt.hash('carlos123', 12),
        role: 'COLABORADOR',
      },
    }),
    prisma.user.upsert({
      where: { email: 'ana.martinez@ceti.mx' },
      update: {},
      create: {
        name: 'Ana Martínez',
        email: 'ana.martinez@ceti.mx',
        password: await bcrypt.hash('ana123', 12),
        role: 'COLABORADOR',
      },
    })
  ]);

  console.log('✅ Usuarios creados');

  // Crear programas
  const programas = await Promise.all([
    prisma.program.upsert({
      where: { id: 'programa-1' },
      update: {},
      create: {
        id: 'programa-1',
        name: 'Modernización de Laboratorios',
        description: 'Actualización de equipos y software en laboratorios de ingeniería',
        generalObjective: 'Mejorar la infraestructura tecnológica para el aprendizaje práctico',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-06-30'),
        status: 'ACTIVO',
      },
    }),
    prisma.program.upsert({
      where: { id: 'programa-2' },
      update: {},
      create: {
        id: 'programa-2',
        name: 'Certificación ISO 9001',
        description: 'Proceso de certificación de calidad para todos los programas académicos',
        generalObjective: 'Obtener la certificación ISO 9001 para garantizar calidad educativa',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-12-31'),
        status: 'ACTIVO',
      },
    }),
    prisma.program.upsert({
      where: { id: 'programa-3' },
      update: {},
      create: {
        id: 'programa-3',
        name: 'Vinculación con la Industria',
        description: 'Establecer convenios con empresas locales para prácticas profesionales',
        generalObjective: 'Fortalecer la relación academia-industria',
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-11-15'),
        status: 'ACTIVO',
      },
    })
  ]);

  console.log('✅ Programas creados');

  // Asignar colaboradores a programas
  await Promise.all([
    prisma.userProgram.upsert({
      where: { userId_programId: { userId: colaboradores[0].id, programId: programas[0].id } },
      update: {},
      create: {
        userId: colaboradores[0].id,
        programId: programas[0].id,
      },
    }),
    prisma.userProgram.upsert({
      where: { userId_programId: { userId: colaboradores[1].id, programId: programas[1].id } },
      update: {},
      create: {
        userId: colaboradores[1].id,
        programId: programas[1].id,
      },
    }),
    prisma.userProgram.upsert({
      where: { userId_programId: { userId: colaboradores[2].id, programId: programas[2].id } },
      update: {},
      create: {
        userId: colaboradores[2].id,
        programId: programas[2].id,
      },
    }),
    // Test user asignado a todos los programas
    prisma.userProgram.upsert({
      where: { userId_programId: { userId: testUser.id, programId: programas[0].id } },
      update: {},
      create: {
        userId: testUser.id,
        programId: programas[0].id,
      },
    }),
    prisma.userProgram.upsert({
      where: { userId_programId: { userId: testUser.id, programId: programas[1].id } },
      update: {},
      create: {
        userId: testUser.id,
        programId: programas[1].id,
      },
    }),
  ]);

  console.log('✅ Asignaciones de programas creadas');

  // Crear tareas
  const tareas = await Promise.all([
    // Programa 1: Modernización de Laboratorios
    prisma.task.create({
      data: {
        name: 'Inventario de Equipos Actuales',
        description: 'Realizar un inventario completo de todos los equipos en los laboratorios',
        creatorId: admin.id,
        programId: programas[0].id,
        dueDate: new Date('2025-02-15'),
        status: 'DONE',
        expectedDeliverables: 'Documento Excel con inventario completo, fotografías de equipos',
        progressPercentage: 100,
      },
    }),
    prisma.task.create({
      data: {
        name: 'Cotización de Nuevo Equipamiento',
        description: 'Obtener cotizaciones de proveedores para equipos de laboratorio',
        creatorId: admin.id,
        programId: programas[0].id,
        dueDate: new Date('2025-03-01'),
        status: 'IN_PROGRESS',
        expectedDeliverables: 'Cotizaciones de al menos 3 proveedores, análisis comparativo',
        progressPercentage: 60,
      },
    }),
    prisma.task.create({
      data: {
        name: 'Plan de Instalación',
        description: 'Desarrollar cronograma detallado para instalación de equipos',
        creatorId: admin.id,
        programId: programas[0].id,
        dueDate: new Date('2025-03-15'),
        status: 'TODO',
        expectedDeliverables: 'Cronograma detallado, plan de contingencias',
        progressPercentage: 0,
      },
    }),

    // Programa 2: Certificación ISO 9001
    prisma.task.create({
      data: {
        name: 'Análisis de Procesos Actuales',
        description: 'Documentar y analizar todos los procesos académicos y administrativos',
        creatorId: admin.id,
        programId: programas[1].id,
        dueDate: new Date('2025-03-30'),
        status: 'IN_PROGRESS',
        expectedDeliverables: 'Mapa de procesos, diagramas de flujo, documentación',
        progressPercentage: 40,
      },
    }),
    prisma.task.create({
      data: {
        name: 'Capacitación en ISO 9001',
        description: 'Organizar capacitación para todo el personal sobre normas ISO',
        creatorId: admin.id,
        programId: programas[1].id,
        dueDate: new Date('2025-04-15'),
        status: 'TODO',
        expectedDeliverables: 'Material de capacitación, registro de asistencia, evaluaciones',
        progressPercentage: 0,
      },
    }),

    // Programa 3: Vinculación con la Industria
    prisma.task.create({
      data: {
        name: 'Identificación de Empresas Objetivo',
        description: 'Crear base de datos de empresas potenciales para convenios',
        creatorId: admin.id,
        programId: programas[2].id,
        dueDate: new Date('2025-02-28'),
        status: 'DONE',
        expectedDeliverables: 'Base de datos con contactos, análisis de sectores',
        progressPercentage: 100,
      },
    }),
    prisma.task.create({
      data: {
        name: 'Presentación Institucional',
        description: 'Desarrollar presentación para empresas sobre programas CETI',
        creatorId: admin.id,
        programId: programas[2].id,
        dueDate: new Date('2025-03-10'),
        status: 'IN_PROGRESS',
        expectedDeliverables: 'Presentación PowerPoint, folletos informativos',
        progressPercentage: 75,
      },
    }),
  ]);

  console.log('✅ Tareas creadas');

  // Crear asignaciones de tareas (incluyendo múltiples asignados)
  await Promise.all([
    // Tarea 0: Inventario de Equipos Actuales - María López
    prisma.taskAssignee.create({
      data: {
        taskId: tareas[0].id,
        userId: colaboradores[0].id,
      },
    }),
    
    // Tarea 1: Cotización de Nuevo Equipamiento - María López y Carlos Rodríguez
    prisma.taskAssignee.create({
      data: {
        taskId: tareas[1].id,
        userId: colaboradores[0].id,
      },
    }),
    prisma.taskAssignee.create({
      data: {
        taskId: tareas[1].id,
        userId: colaboradores[1].id,
      },
    }),
    
    // Tarea 2: Plan de Instalación - María López
    prisma.taskAssignee.create({
      data: {
        taskId: tareas[2].id,
        userId: colaboradores[0].id,
      },
    }),
    
    // Tarea 3: Análisis de Procesos Actuales - Carlos Rodríguez
    prisma.taskAssignee.create({
      data: {
        taskId: tareas[3].id,
        userId: colaboradores[1].id,
      },
    }),
    
    // Tarea 4: Capacitación en ISO 9001 - Carlos Rodríguez y Ana Martínez
    prisma.taskAssignee.create({
      data: {
        taskId: tareas[4].id,
        userId: colaboradores[1].id,
      },
    }),
    prisma.taskAssignee.create({
      data: {
        taskId: tareas[4].id,
        userId: colaboradores[2].id,
      },
    }),
    
    // Tarea 5: Identificación de Empresas Objetivo - Ana Martínez
    prisma.taskAssignee.create({
      data: {
        taskId: tareas[5].id,
        userId: colaboradores[2].id,
      },
    }),
    
    // Tarea 6: Presentación Institucional - Ana Martínez y María López
    prisma.taskAssignee.create({
      data: {
        taskId: tareas[6].id,
        userId: colaboradores[2].id,
      },
    }),
    prisma.taskAssignee.create({
      data: {
        taskId: tareas[6].id,
        userId: colaboradores[0].id,
      },
    }),
  ]);

  console.log('✅ Asignaciones de tareas creadas');

  // Crear comentarios
  await Promise.all([
    prisma.comment.create({
      data: {
        content: 'Se completó el inventario de 3 laboratorios. Faltan 2 laboratorios menores.',
        taskId: tareas[0].id,
        authorId: colaboradores[0].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'Excelente trabajo en el inventario. Por favor continúa con las cotizaciones.',
        taskId: tareas[0].id,
        authorId: admin.id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'Se han contactado 2 proveedores. Esperando respuesta del tercero.',
        taskId: tareas[1].id,
        authorId: colaboradores[0].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'Base de datos completada con 25 empresas locales identificadas.',
        taskId: tareas[5].id,
        authorId: colaboradores[2].id,
      },
    }),
  ]);

  console.log('✅ Comentarios creados');

  // Crear logs de auditoría de ejemplo
  await Promise.all([
    prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Task',
        entityId: tareas[0].id,
        oldValues: { status: 'IN_PROGRESS', progressPercentage: 80 },
        newValues: { status: 'DONE', progressPercentage: 100 },
        userId: colaboradores[0].id,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Comment',
        entityId: 'comment-1',
        newValues: { content: 'Primer comentario de la tarea' },
        userId: admin.id,
      },
    }),
  ]);

  console.log('✅ Logs de auditoría creados');

  console.log('🎉 ¡Seeding completado exitosamente!');
  console.log('\n📋 Usuarios creados:');
  console.log('👤 Admin: admin@ceti.mx / admin123');
  console.log('👤 Test User: john@doe.com / johndoe123 (ADMIN para testing)');
  console.log('👤 María López: maria.lopez@ceti.mx / maria123');
  console.log('👤 Carlos Rodríguez: carlos.rodriguez@ceti.mx / carlos123');
  console.log('👤 Ana Martínez: ana.martinez@ceti.mx / ana123');
  console.log('\n📂 Programas creados: 3');
  console.log('📋 Tareas creadas: 7');
  console.log('💬 Comentarios creados: 4');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
