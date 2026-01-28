import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/onlyoffice/callback - Handle OnlyOffice document saves
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log("OnlyOffice callback status:", body.status);

        // 2 = Ready for saving, 6 = Force saving
        if (body.status === 2 || body.status === 6) {
            const documentKey = body.key;
            let documentUrl = body.url;

            console.log("Processing save for key:", documentKey);
            console.log("Original download URL:", documentUrl);

            // FIX: If URL is internal/http, force it to use our public HTTPS endpoint
            // This is common when OnlyOffice runs in Docker
            const publicUrl = process.env.NEXT_PUBLIC_ONLYOFFICE_URL || "https://office.projoffice.store";
            if (documentUrl && !documentUrl.startsWith("http")) {
                documentUrl = `${publicUrl}${documentUrl}`;
            } else if (documentUrl) {
                // If it's using internal container name or IP, swap it
                // We blindly replace the base URL with our public one to be safe
                const urlObj = new URL(documentUrl);
                // Keep the path, change origin
                documentUrl = `${publicUrl}${urlObj.pathname}${urlObj.search}`;
            }

            console.log("Corrected download URL:", documentUrl);

            // Download the modified file from OnlyOffice
            const response = await fetch(documentUrl);
            if (!response.ok) {
                console.error("Failed to download from OnlyOffice:", response.status, response.statusText);
                return NextResponse.json({ error: 1 });
            }

            const fileBuffer = await response.arrayBuffer();

            // Extract document ID from key
            const docIdMatch = documentKey.match(/doc_([a-z0-9]+)/i);
            if (docIdMatch) {
                const docId = docIdMatch[1];

                // Upload to Supabase Storage
                // We use a new filename to avoid caching issues
                const fileName = `documents/${docId}_${Date.now()}.docx`;
                const { error: uploadError } = await supabaseAdmin.storage
                    .from("documents") // Ensure this bucket exists
                    .upload(fileName, fileBuffer, {
                        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        upsert: true
                    });

                if (uploadError) {
                    console.error("Supabase upload error:", uploadError);
                    return NextResponse.json({ error: 1 });
                }

                // Get public URL
                const { data: urlData } = supabaseAdmin.storage
                    .from("documents")
                    .getPublicUrl(fileName);

                // Update document record
                await prisma.document.update({
                    where: { id: docId },
                    data: {
                        templateUrl: urlData.publicUrl, // Update the FILE url, not the content text
                        updatedAt: new Date(),
                    },
                });
                console.log("Document updated successfully:", docId);
            }
        }

        return NextResponse.json({ error: 0 });
    } catch (error) {
        console.error("OnlyOffice callback error:", error);
        return NextResponse.json({ error: 1 });
    }
}
