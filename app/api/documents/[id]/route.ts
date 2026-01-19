import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase-auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/documents/[id] - Update document content
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await getAuthenticatedUser();

    if (!authResult) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { content } = body;

    const document = await prisma.document.findUnique({
        where: { id },
    });

    if (!document) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Only author can edit
    if (document.authorId !== authResult.id) {
        return NextResponse.json(
            { error: "Only the document author can edit" },
            { status: 403 }
        );
    }

    // Only draft documents can be edited
    if (document.status !== "DRAFT") {
        return NextResponse.json(
            { error: "Can only edit draft documents" },
            { status: 400 }
        );
    }

    const updated = await prisma.document.update({
        where: { id },
        data: { content },
        include: {
            author: { select: { name: true, email: true } },
            workflow: {
                orderBy: { order: "asc" },
                include: { user: { select: { name: true, role: true } } },
            },
        },
    });

    return NextResponse.json(updated);
}

// GET /api/documents/[id] - Get single document
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await getAuthenticatedUser();

    if (!authResult) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const document = await prisma.document.findUnique({
        where: { id },
        include: {
            author: { select: { name: true, email: true } },
            workflow: {
                orderBy: { order: "asc" },
                include: { user: { select: { name: true, role: true } } },
            },
        },
    });

    if (!document) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json(document);
}
