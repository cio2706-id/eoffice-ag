import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase-auth";
import { prisma } from "@/lib/prisma";

// GET /api/users - List all users (for workflow assignment)
export async function GET() {
    const authResult = await getAuthenticatedUser();

    if (!authResult) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
        orderBy: { name: "asc" },
    });

    return NextResponse.json(users);
}
