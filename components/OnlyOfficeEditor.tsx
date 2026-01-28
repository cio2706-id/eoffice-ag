"use client";

import { useEffect, useRef } from "react";

interface OnlyOfficeEditorProps {
    documentUrl: string;
    documentKey: string;
    documentTitle: string;
    documentType?: "word" | "cell" | "slide";
    mode?: "edit" | "view";
    onSave?: (data: unknown) => void;
    userEmail?: string;
    userName?: string;
}

declare global {
    interface Window {
        DocsAPI?: {
            DocEditor: new (placeholder: string, config: unknown) => unknown;
        };
    }
}

export default function OnlyOfficeEditor({
    documentUrl,
    documentKey,
    documentTitle,
    documentType = "word",
    mode = "edit",
    userEmail = "anonymous@example.com",
    userName = "Anonymous",
}: OnlyOfficeEditorProps) {
    const editorRef = useRef<unknown>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load OnlyOffice API script from self-hosted server
        const onlyOfficeUrl = process.env.NEXT_PUBLIC_ONLYOFFICE_URL || "https://office.projoffice.store";
        const scriptUrl = `${onlyOfficeUrl}/web-apps/apps/api/documents/api.js`;

        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        script.onload = initEditor;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    function initEditor() {
        if (!window.DocsAPI || !containerRef.current) return;

        const config = {
            document: {
                fileType: documentType === "word" ? "docx" : documentType === "cell" ? "xlsx" : "pptx",
                key: documentKey,
                title: documentTitle,
                url: documentUrl,
            },
            documentType: documentType,
            editorConfig: {
                mode: mode,
                // Use current origin for callback (works both locally and in production)
                callbackUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/onlyoffice/callback`,
                user: {
                    id: userEmail,
                    name: userName,
                },
                customization: {
                    autosave: true,
                    chat: false,
                    comments: true,
                    feedback: false,
                    forcesave: true,
                    compactHeader: false,
                    toolbarNoTabs: false,
                },
            },
            height: "100%",
            width: "100%",
        };

        editorRef.current = new window.DocsAPI.DocEditor("onlyoffice-editor", config);
    }

    return (
        <div ref={containerRef} className="w-full h-full">
            <div id="onlyoffice-editor" className="w-full h-full" />
        </div>
    );
}
