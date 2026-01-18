import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/documents/[id]/pdf - Generate PDF for approved document
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session?.user) {
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

    // Generate simple HTML PDF content
    const approvalHistory = document.workflow
        .filter((step) => step.status === "APPROVED")
        .map((step) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${step.role}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${step.user?.name || "-"}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${step.stepType === "signer" ? "Penandatangan" : "Pemeriksa"}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${step.actedAt ? new Date(step.actedAt).toLocaleDateString("id-ID") : "-"}</td>
      </tr>
    `)
        .join("");

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${document.title}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
        h1 { color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; }
        .meta { color: #666; margin-bottom: 20px; }
        .content { margin: 30px 0; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #4F46E5; color: white; padding: 10px; text-align: left; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>${document.title}</h1>
      <div class="meta">
        <strong>Nomor Dokumen:</strong> ${document.number}<br>
        <strong>Pembuat:</strong> ${document.author.name}<br>
        <strong>Status:</strong> ${document.status}<br>
        ${document.recipient ? `<strong>Tujuan:</strong> ${document.recipient}<br>` : ""}
      </div>
      
      <div class="content">
        ${document.content || "<p><em>Dokumen ini tidak memiliki konten.</em></p>"}
      </div>
      
      <h2>Riwayat Persetujuan</h2>
      <table>
        <thead>
          <tr>
            <th>Jabatan</th>
            <th>Nama</th>
            <th>Tipe</th>
            <th>Tanggal</th>
          </tr>
        </thead>
        <tbody>
          ${approvalHistory || "<tr><td colspan='4' style='padding: 8px; text-align: center;'>Belum ada persetujuan</td></tr>"}
        </tbody>
      </table>
      
      <div class="footer">
        Dokumen ini dihasilkan oleh sistem E-Office Koperasi BKI pada ${new Date().toLocaleDateString("id-ID")}
      </div>
    </body>
    </html>
  `;

    // Return HTML as downloadable file (browser can print to PDF)
    return new NextResponse(html, {
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Disposition": `inline; filename="${document.number.replace(/\//g, "-")}.html"`,
        },
    });
}
