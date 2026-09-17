const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Limpiar registros antiguos respetando el orden de llaves foráneas
  await prisma.appointment.deleteMany();
  await prisma.specialist.deleteMany();
  await prisma.service.deleteMany();

  // 1. Crear Servicios de Estética & Spa (Valores en COP)
  const service1 = await prisma.service.create({
    data: {
      name: 'Limpieza Facial Profunda + Hydrafacial',
      price: 130000,
      durationMin: 60,
      category: 'Facial',
    },
  });

  const service2 = await prisma.service.create({
    data: {
      name: 'Masaje Relajante y Descontracturante',
      price: 110000,
      durationMin: 60,
      category: 'Corporal',
    },
  });

  const service3 = await prisma.service.create({
    data: {
      name: 'Peeling Químico Renovador',
      price: 180000,
      durationMin: 45,
      category: 'Facial',
    },
  });

  const service4 = await prisma.service.create({
    data: {
      name: 'Depilación Láser Diodo',
      price: 210000,
      durationMin: 30,
      category: 'Corporal',
    },
  });

  // 2. Crear Especialistas y vincularlos a los servicios
  await prisma.specialist.create({
    data: {
      name: 'Dra. Mariana Londoño',
      email: 'mariana.londono@agendaya.com',
      specialty: 'Dermatología Estética',
      services: {
        connect: [{ id: service1.id }, { id: service3.id }],
      },
    },
  });

  await prisma.specialist.create({
    data: {
      name: 'Laura Camila Ríos',
      email: 'laura.rios@agendaya.com',
      specialty: 'Cosmiatría y Spa',
      services: {
        connect: [{ id: service1.id }, { id: service2.id }],
      },
    },
  });

  await prisma.specialist.create({
    data: {
      name: 'Dra. Carolina Vega',
      email: 'carolina.vega@agendaya.com',
      specialty: 'Medicina Estética',
      services: {
        connect: [{ id: service3.id }, { id: service4.id }],
      },
    },
  });

  await prisma.specialist.create({
    data: {
      name: 'Valeria Martínez',
      email: 'valeria.martinez@agendaya.com',
      specialty: 'Esteticista Corporal',
      services: {
        connect: [{ id: service2.id }, { id: service4.id }],
      },
    },
  });

  console.log('🌱 ¡Base de datos poblada con éxito con el catálogo de Estética & Spa!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });