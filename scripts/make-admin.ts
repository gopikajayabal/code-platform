import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: {
      username: "gopika_new",
    },
    data: {
      role: "ADMIN",
    },
  });

  console.log("Admin role updated successfully:");
  console.log(user.username, user.role);
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });