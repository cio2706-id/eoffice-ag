import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase-auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import createReport from "docx-templates";

// POST /api/documents/[id]/generate - Generate document from template with placeholders
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await getAuthenticatedUser();

        if (!authResult) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Get document with template info
        const document = await prisma.document.findUnique({
            where: { id },
            include: {
                author: { select: { name: true, email: true, role: true } },
                workflow: {
                    orderBy: { order: "asc" },
                    include: { user: { select: { name: true, role: true } } },
                },
                template: true, // Include the template record
            },
        });

        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        if (!document.templateId || !document.template) {
            return NextResponse.json(
                { error: "Document has no template" },
                { status: 400 }
            );
        }

        // Always use the ORIGINAL template file path from Template table
        // NOT the document.templateUrl which might be a generated file
        const originalTemplateUrl = document.template.filePath;
        console.log("Using original template:", originalTemplateUrl);

        // Download the template from Supabase
        const templateResponse = await fetch(originalTemplateUrl);
        if (!templateResponse.ok) {
            console.error("Template download failed:", templateResponse.status, templateResponse.statusText);
            return NextResponse.json(
                { error: `Failed to download template: ${templateResponse.status}` },
                { status: 500 }
            );
        }

        // Check content type
        const contentType = templateResponse.headers.get("content-type");
        console.log("Template content type:", contentType);

        const templateBuffer = await templateResponse.arrayBuffer();
        console.log("Template buffer size:", templateBuffer.byteLength);

        if (templateBuffer.byteLength < 100) {
            return NextResponse.json(
                { error: "Template file is too small or empty" },
                { status: 500 }
            );
        }

        // Get signers from workflow
        const signers = document.workflow
            .filter(w => w.stepType === "signer")
            .map(w => w.user?.name || w.role);

        const reviewers = document.workflow
            .filter(w => w.stepType === "pemeriksa")
            .map(w => w.user?.name || w.role);

        // Format date in Indonesian
        const date = new Date();
        const months = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];
        const formattedDate = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;

        // Placeholder data
        const placeholderData = {
            // Document info
            tanggal: formattedDate,
            nomor_surat: document.number,
            judul: document.title,
            perihal: document.title,

            // People
            dari: document.author.name,
            pembuat: `${document.author.name} (${document.author.role})`,
            kepada: document.recipient || "Kepada Yth,",

            // Signers
            penandatangan: signers[0] || "Ketua",
            ttd_ketua: signers.find(s => s?.includes("KETUA")) || signers[0] || "",
            ttd_pemeriksa: reviewers.join(", ") || "",

            // Content
            isi: document.content || "",
        };

        console.log("Placeholder data:", placeholderData);

        // Process template with docx-templates
        const output = await createReport({
            template: Buffer.from(templateBuffer),
            data: placeholderData,
            cmdDelimiter: ["{{", "}}"],
        });

        // Upload processed document to Supabase
        const processedFileName = `generated/${id}_${Date.now()}.docx`;
        const { error: uploadError } = await supabaseAdmin.storage
            .from("documents")
            .upload(processedFileName, output, {
                contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                upsert: true,
            });

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return NextResponse.json(
                { error: "Failed to upload generated document" },
                { status: 500 }
            );
        }

        // Get public URL for the generated document
        const { data: urlData } = supabaseAdmin.storage
            .from("documents")
            .getPublicUrl(processedFileName);

        // Update document with generated URL
        const updatedDocument = await prisma.document.update({
            where: { id },
            data: {
                templateUrl: urlData.publicUrl,
            },
            include: {
                author: { select: { name: true, email: true } },
                workflow: {
                    orderBy: { order: "asc" },
                    include: { user: { select: { name: true, role: true } } },
                },
            },
        });

        return NextResponse.json({
            success: true,
            document: updatedDocument,
            generatedUrl: urlData.publicUrl,
        });
    } catch (error) {
        console.error("Generate document error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate document" },
            { status: 500 }
        );
    }
}
