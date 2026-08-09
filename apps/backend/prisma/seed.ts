import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Create Rooms
  const roomNames = ['Акваріум', 'Марс', 'Гагарін', 'Олімп', 'Київ'];
  const rooms = [];

  for (let i = 0; i < roomNames.length; i++) {
    const name = roomNames[i];
    let room = await prisma.room.findFirst({
      where: { name },
    });

    if (!room) {
      room = await prisma.room.create({
        data: {
          name,
          capacity: 10 + i * 5,
          floor: 1,
        },
      });
    }
    rooms.push(room);
  }

  // 2. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'test1@example.com' },
    update: {},
    create: {
      email: 'test1@example.com',
      password: passwordHash,
      name: 'Test User 1',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'test2@example.com' },
    update: {},
    create: {
      email: 'test2@example.com',
      password: passwordHash,
      name: 'Test User 2',
    },
  });

  // 3. Clear existing bookings & seed valid office-hours bookings
  await prisma.booking.deleteMany({});

  const booking1Start = new Date();
  booking1Start.setDate(booking1Start.getDate() + 1);
  booking1Start.setUTCHours(10, 0, 0, 0);

  const booking1End = new Date(booking1Start);
  booking1End.setUTCHours(11, 0, 0, 0);

  await prisma.booking.create({
    data: {
      title: 'Sprint Planning',
      userId: user1.id,
      roomId: rooms[0].id,
      startTime: booking1Start,
      endTime: booking1End,
    },
  });

  const booking2Start = new Date();
  booking2Start.setDate(booking2Start.getDate() + 1);
  booking2Start.setUTCHours(14, 0, 0, 0);

  const booking2End = new Date(booking2Start);
  booking2End.setUTCHours(15, 0, 0, 0);

  await prisma.booking.create({
    data: {
      title: 'Daily Standup',
      userId: user2.id,
      roomId: rooms[1].id,
      startTime: booking2Start,
      endTime: booking2End,
    },
  });

  console.log('Seed executed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });