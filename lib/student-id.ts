import type { Prisma } from "@prisma/client";

export async function nextStudentNumber(tx: Prisma.TransactionClient) {
  const year = new Date().getFullYear();
  const row = await tx.idSequence.upsert({
    where: { year },
    create: { year, last: 1 },
    update: { last: { increment: 1 } },
  });
  return `KSEI-${year}-${String(row.last).padStart(4, "0")}`;
}

export function temporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let body = "";
  for (let i = 0; i < 6; i += 1) {
    body += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `Ksei-${body}`;
}

export function portraitFromUpload(url: string | null | undefined) {
  if (!url) return null;
  if (/\.(png|jpe?g|webp|gif|svg)$/i.test(url)) return url;
  return null;
}
