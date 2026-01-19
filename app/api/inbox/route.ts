import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase-auth";
import { prisma } from "@/lib/prisma";

// GET /api/inbox - List inbox items for current user
export async function GET() {
    const authResult = await getAuthenticatedUser();

    if (!authResult) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authResult.id;

    // Get all documents:
    // 1. Created by this user
    // 2. Received by this user (as recipient)
    // 3. User was part of the approval workflow
    const documents = await prisma.document.findMany({
        where: {
            OR: [
                { authorId: userId },
                {
                    workflow: {
                        some: {
                            userId: userId,
                        }
                    }
                }
            ]
        },
        include: {
            author: { select: { name: true, email: true } },
            workflow: {
                orderBy: { order: "asc" },
                include: { user: { select: { name: true } } },
            },
        },
        orderBy: { updatedAt: "desc" },
    });

    // Transform to inbox items
    const inboxItems = documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        number: doc.number,
        status: doc.status,
        author: doc.author.name,
        type: doc.authorId === userId ? "created" : "received",
        updatedAt: doc.updatedAt,
        workflow: doc.workflow,
    }));

    return NextResponse.json(inboxItems);
}
