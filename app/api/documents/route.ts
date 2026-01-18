import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/documents - List documents for current user
export async function GET() {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    const userId = session.user.id;

    let documents;

    if (userRole === "STAFF") {
        // Staff sees only their own documents
        documents = await prisma.document.findMany({
            where: { authorId: userId },
            include: {
                author: { select: { name: true, email: true } },
                workflow: {
                    orderBy: { order: "asc" },
                    include: { user: { select: { name: true } } },
                },
            },
            orderBy: { updatedAt: "desc" },
        });
    } else {
        // Other roles see:
        // 1. Their own documents
        // 2. Documents awaiting their approval (PENDING)
        // 3. Documents they already approved/reviewed
        documents = await prisma.document.findMany({
            where: {
                OR: [
                    { authorId: userId },
                    {
                        workflow: {
                            some: {
                                role: userRole,
                            },
                        },
                    },
                ],
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
    }

    return NextResponse.json(documents);
}

// POST /api/documents - Create new document
export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, content, workflow, asDraft, recipient, recipientType, templateId, templateUrl } = body;

        if (!title || !workflow || workflow.length === 0) {
            return NextResponse.json(
                { error: "Title and workflow are required" },
                { status: 400 }
            );
        }

        // Generate document number
        const count = await prisma.document.count();
        const year = new Date().getFullYear();
        const number = `DOC/${year}/${String(count + 1).padStart(3, "0")}`;

        // Always save as draft when creating
        const documentStatus = "DRAFT";
        const workflowStatus = "WAITING";

        // Debug: Check if author exists
        const authorExists = await prisma.user.findUnique({
            where: { id: session.user.id as string },
        });
        console.log("Author ID:", session.user.id, "Exists:", !!authorExists);

        if (!authorExists) {
            return NextResponse.json(
                { error: "Your session is invalid. Please sign out and sign in again." },
                { status: 401 }
            );
        }

        const document = await prisma.document.create({
            data: {
                title,
                number,
                content: content || "",
                status: documentStatus,
                recipient: recipient || null,
                templateId: templateId || null,
                templateUrl: templateUrl || null,
                recipientType: recipientType || null,
                authorId: session.user.id as string,
                workflow: {
                    create: workflow.map((step: { role: string; userId?: string; type?: string }, index: number) => ({
                        order: index + 1,
                        role: step.role,
                        // Only include userId if it's a non-empty string
                        ...(step.userId && step.userId.trim() !== "" ? { userId: step.userId } : {}),
                        stepType: step.type || "pemeriksa",
                        status: workflowStatus,
                    })),
                },
            },
            include: {
                workflow: true,
                author: { select: { name: true, email: true } },
            },
        });

        return NextResponse.json(document, { status: 201 });
    } catch (error) {
        console.error("Error creating document:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create document" },
            { status: 500 }
        );
    }
}
