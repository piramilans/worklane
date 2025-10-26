import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function updatePassword() {
  try {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const user = await prisma.user.update({
      where: { email: "milan@aaws.ca" },
      data: { password: hashedPassword },
    });

    console.log("✅ Password updated successfully for:", user.email);
    console.log("You can now login with:");
    console.log("Email: milan@aaws.ca");
    console.log("Password: admin123");
  } catch (error) {
    console.error("❌ Error updating password:", error);
  }
}

updatePassword()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
