import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/templates - List all templates
export async function GET() {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const templates = await prisma.template.findMany({
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(templates);
    } catch (error) {
        console.error("Templates fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
    }
}

// POST /api/templates - Upload new template
export async function POST(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;

        if (!file || !name) {
            return NextResponse.json(
                { error: "File and name are required" },
                { status: 400 }
            );
        }

        // Get file extension
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "docx";
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `templates/${fileName}`;

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Supabase Storage
        const { error: uploadError } = await supabaseAdmin.storage
            .from("documents")
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return NextResponse.json(
                { error: "Failed to upload file: " + uploadError.message },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
            .from("documents")
            .getPublicUrl(filePath);

        // Save template metadata to database
        const template = await prisma.template.create({
            data: {
                name,
                description: description || null,
                fileName: file.name,
                filePath: urlData.publicUrl,
                fileType: fileExt,
            },
        });

        return NextResponse.json(template, { status: 201 });
    } catch (error) {
        console.error("Template upload error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Upload failed" },
            { status: 500 }
        );
    }
}
