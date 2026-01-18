import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/onlyoffice/callback - Handle OnlyOffice document saves
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // OnlyOffice callback statuses:
        // 0 - document is being edited
        // 1 - document is ready for saving
        // 2 - document saving error
        // 3 - document is closed with no changes
        // 4 - document is closed after saving
        // 6 - document is being edited but saving request was made
        // 7 - document is being force saved

        console.log("OnlyOffice callback:", body);

        if (body.status === 2 || body.status === 6) {
            // Document ready for saving (status 2) or force save (status 6)
            const documentUrl = body.url;
            const documentKey = body.key;

            // Download the saved document from OnlyOffice
            const response = await fetch(documentUrl);
            const content = await response.text();

            // Update document in database
            // Note: The key format should be "doc_{documentId}"
            const docIdMatch = documentKey.match(/doc_([a-z0-9]+)/i);
            if (docIdMatch) {
                const docId = docIdMatch[1];
                await prisma.document.update({
                    where: { id: docId },
                    data: {
                        content,
                        updatedAt: new Date(),
                    },
                });
            }
        }

        // OnlyOffice expects {"error": 0} for success
        return NextResponse.json({ error: 0 });
    } catch (error) {
        console.error("OnlyOffice callback error:", error);
        return NextResponse.json({ error: 1 });
    }
}
