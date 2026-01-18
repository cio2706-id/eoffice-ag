import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/documents/[id]/submit - Submit draft for approval
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find the document
    const document = await prisma.document.findUnique({
        where: { id },
        include: { workflow: true },
    });

    if (!document) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check if user is the author
    if (document.authorId !== session.user.id) {
        return NextResponse.json(
            { error: "Only the document author can submit for approval" },
            { status: 403 }
        );
    }

    // Check if document is in DRAFT status
    if (document.status !== "DRAFT") {
        return NextResponse.json(
            { error: "Only draft documents can be submitted" },
            { status: 400 }
        );
    }

    // Update document status to PENDING and activate workflow
    await prisma.document.update({
        where: { id },
        data: { status: "PENDING" },
    });

    // Activate all workflow steps (change from WAITING to PENDING)
    await prisma.approval.updateMany({
        where: { documentId: id },
        data: { status: "PENDING" },
    });

    const updatedDocument = await prisma.document.findUnique({
        where: { id },
        include: {
            author: { select: { name: true, email: true } },
            workflow: {
                orderBy: { order: "asc" },
                include: { user: { select: { name: true, role: true } } },
            },
        },
    });

    return NextResponse.json(updatedDocument);
}
