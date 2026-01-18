import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/documents/[id]/reject - Reject current workflow step
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { comment } = body;

    if (!comment) {
        return NextResponse.json(
            { error: "Comment is required when rejecting" },
            { status: 400 }
        );
    }

    const userRole = (session.user as { role?: string }).role;

    // Find the document and its current pending step
    const document = await prisma.document.findUnique({
        where: { id },
        include: {
            workflow: {
                orderBy: { order: "asc" },
            },
        },
    });

    if (!document) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Find the current pending step that matches user's role
    const currentStep = document.workflow.find(
        (step) => step.status === "PENDING" && step.role === userRole
    );

    if (!currentStep) {
        return NextResponse.json(
            { error: "No pending approval step for your role" },
            { status: 403 }
        );
    }

    // Reject the step
    await prisma.approval.update({
        where: { id: currentStep.id },
        data: {
            status: "REJECTED",
            userId: session.user.id,
            comment,
            actedAt: new Date(),
        },
    });

    // Update document status to rejected
    await prisma.document.update({
        where: { id },
        data: { status: "REJECTED" },
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
