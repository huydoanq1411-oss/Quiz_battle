import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const BASE = 'https://kanjiapi.dev/v1';

async function main() {
  for (const jlpt of [5, 4, 3, 2, 1]) {
    const list: string[] = await (await fetch(`${BASE}/kanji/jlpt-${jlpt}`)).json();
    for (let start = 0; start < list.length; start += 8) {
      const batch = list.slice(start, start + 8);
      await Promise.all(batch.map(async (ch) => {
        const k: any = await (await fetch(`${BASE}/kanji/${encodeURIComponent(ch)}`)).json();
        if (!k.meanings?.length) return;
        const data = {
          meanings: k.meanings,
          kunReadings: k.kun_readings,
          onReadings: k.on_readings,
          jlpt: k.jlpt ?? jlpt,
          grade: k.grade ?? null,
        };
        await prisma.kanjiCard.upsert({ where: { kanji: ch }, update: data, create: { kanji: ch, ...data } });
      }));
    }
    console.log('xong JLPT N' + jlpt);
  }
}
main().finally(() => prisma.$disconnect());
