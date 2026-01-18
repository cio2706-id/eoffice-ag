import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    const hashedPassword = await bcrypt.hash("password123", 10);

    // Create users with different roles
    const users: { email: string; name: string; role: Role }[] = [
        { email: "staff@bki.co.id", name: "Budi", role: "STAFF" },
        { email: "manager@bki.co.id", name: "Dea", role: "MANAGER" },
        { email: "bendahara@bki.co.id", name: "Nissa", role: "BENDAHARA" },
        { email: "sekertaris@bki.co.id", name: "Adityo", role: "SEKERTARIS" },
        { email: "ketua@bki.co.id", name: "Adesta", role: "KETUA" },
    ];

    for (const user of users) {
        await prisma.user.upsert({
            where: { email: user.email },
            update: { name: user.name },
            create: {
                email: user.email,
                name: user.name,
                role: user.role,
                password: hashedPassword,
            },
        });
        console.log(`✅ Created/Updated user: ${user.name} (${user.role})`);
    }

    console.log("✨ Seeding complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
