import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-auth";
import { prisma } from "@/lib/prisma";

// Helper to get Prisma user from Supabase auth user
async function getPrismaUser(supabaseUser: { email?: string }) {
    if (!supabaseUser.email) return null;
    return await prisma.user.findUnique({
        where: { email: supabaseUser.email },
    });
}

// GET /api/documents - List documents for current user
export async function GET() {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const prismaUser = await getPrismaUser(authUser);
        if (!prismaUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userRole = prismaUser.role;
        const userId = prismaUser.id;

        let documents;

        if (userRole === "STAFF") {
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
    } catch (error) {
        console.error("Documents fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }
}

// POST /api/documents - Create new document
export async function POST(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const prismaUser = await getPrismaUser(authUser);
        if (!prismaUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await req.json();
        const { title, content, workflow, recipient, recipientType, templateId, templateUrl } = body;

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

        const document = await prisma.document.create({
            data: {
                title,
                number,
                content: content || "",
                status: "DRAFT",
                recipient: recipient || null,
                templateId: templateId || null,
                templateUrl: templateUrl || null,
                recipientType: recipientType || null,
                authorId: prismaUser.id,
                workflow: {
                    create: workflow.map((step: { role: string; userId?: string; type?: string }, index: number) => ({
                        order: index + 1,
                        role: step.role,
                        ...(step.userId && step.userId.trim() !== "" ? { userId: step.userId } : {}),
                        stepType: step.type || "pemeriksa",
                        status: "WAITING",
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
