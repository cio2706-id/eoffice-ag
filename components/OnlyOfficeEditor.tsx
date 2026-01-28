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
    const editorRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load OnlyOffice API script from self-hosted server
        const onlyOfficeUrl = process.env.NEXT_PUBLIC_ONLYOFFICE_URL || "https://office.projoffice.store";
        const scriptUrl = `${onlyOfficeUrl}/web-apps/apps/api/documents/api.js`;

        let docEditor: any = null;

        const init = () => {
            if (!window.DocsAPI || !containerRef.current) return;

            // Destroy existing editor if any to prevent duplicates
            const existingFrame = document.querySelector("iframe[name='onlyoffice-editor']");
            if (existingFrame) existingFrame.remove();

            // Reset container content
            containerRef.current.innerHTML = '<div id="onlyoffice-editor" class="w-full h-full"></div>';

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
                    callbackUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/onlyoffice/callback`,
                    user: {
                        id: userEmail,
                        name: userName,
                    },
                    customization: {
                        autosave: true,
                        forcesave: true, // Adds Save button
                        chat: false,
                        comments: true,
                    },
                },
                height: "100%",
                width: "100%",
            };

            docEditor = new window.DocsAPI.DocEditor("onlyoffice-editor", config);
            editorRef.current = docEditor;
        };

        // Check if script is already loaded
        if (window.DocsAPI) {
            init();
        } else {
            const script = document.createElement("script");
            script.src = scriptUrl;
            script.async = true;
            script.onload = init;
            document.body.appendChild(script);
        }

        return () => {
            if (docEditor && docEditor.destroyEditor) {
                try {
                    docEditor.destroyEditor();
                } catch (e) {
                    console.error("Failed to destroy editor", e);
                }
            }
        };
    }, [documentUrl, documentKey, documentTitle, documentType, mode, userEmail, userName]);

    return (
        <div ref={containerRef} className="w-full h-full">
            <div id="onlyoffice-editor" className="w-full h-full" />
        </div>
    );
}
