import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/templates/[id] - Get template details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const template = await prisma.template.findUnique({
        where: { id },
    });

    if (!template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(template);
}

// DELETE /api/templates/[id] - Delete template
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const template = await prisma.template.findUnique({
        where: { id },
    });

    if (!template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Extract file path from URL for deletion
    const url = new URL(template.filePath);
    const storagePath = url.pathname.split("/storage/v1/object/public/documents/")[1];

    if (storagePath) {
        // Delete from Supabase Storage
        await supabaseAdmin.storage.from("documents").remove([storagePath]);
    }

    // Delete from database
    await prisma.template.delete({
        where: { id },
    });

    return NextResponse.json({ success: true });
}
