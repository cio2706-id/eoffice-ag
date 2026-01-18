"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    FileText,
    MessageSquare,
    ThumbsUp,
    ThumbsDown,
    Share2,
    XCircle,
    Loader2,
    Send,
    Download
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import OnlyOfficeEditor from "@/components/OnlyOfficeEditor";

interface Document {
    id: string;
    title: string;
    number: string;
    status: string;
    content: string | null;
    templateUrl: string | null;
    templateId: string | null;
    createdAt: string;
    updatedAt: string;
    authorId: string;
    author: { name: string; email: string };
    workflow: {
        id: string;
        order: number;
        status: string;
        role: string;
        comment: string | null;
        actedAt: string | null;
        user: { name: string; role: string } | null;
    }[];
}

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { data: session } = useSession();
    const [document, setDocument] = useState<Document | null>(null);
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isActing, setIsActing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectComment, setRejectComment] = useState("");

    const userRole = (session?.user as { role?: string })?.role;

    useEffect(() => {
        async function fetchDocument() {
            try {
                const res = await fetch(`/api/documents/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setDocument(data);
                    setContent(data.content || "");

                    // Auto-generate if document has template and hasn't been processed yet
                    // Check if templateUrl contains "generated/" - if not, it needs processing
                    if (data.templateId && data.templateUrl && !data.templateUrl.includes("/generated/")) {
                        console.log("Processing template placeholders...");
                        const genRes = await fetch(`/api/documents/${id}/generate`, {
                            method: "POST",
                        });
                        if (genRes.ok) {
                            const genData = await genRes.json();
                            setDocument(genData.document);
                            console.log("Template processed:", genData.generatedUrl);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch document:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchDocument();
    }, [id]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/documents/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });
            if (res.ok) {
                const updated = await res.json();
                setDocument(updated);
                alert("Saved successfully!");
            }
        } catch (error) {
            console.error("Failed to save:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const canApprove = document?.workflow.some(
        (step) => step.status === "PENDING" && step.role === userRole
    );

    const isAuthor = document?.authorId === session?.user?.id;
    const isDraft = document?.status === "DRAFT";
    const hasTemplate = document?.templateId;

    const handleRegenerate = async () => {
        setIsActing(true);
        try {
            console.log("Regenerating document with placeholders...");
            const res = await fetch(`/api/documents/${id}/generate`, {
                method: "POST",
            });
            if (res.ok) {
                const data = await res.json();
                setDocument(data.document);
                alert("Document regenerated successfully! Refresh to see changes.");
            } else {
                const error = await res.json();
                alert("Failed to regenerate: " + (error.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Failed to regenerate:", error);
            alert("Failed to regenerate document");
        } finally {
            setIsActing(false);
        }
    };

    const handleSubmit = async () => {
        setIsActing(true);
        try {
            const res = await fetch(`/api/documents/${id}/submit`, {
                method: "POST",
            });
            if (res.ok) {
                const updated = await res.json();
                setDocument(updated);
            }
        } catch (error) {
            console.error("Failed to submit:", error);
        } finally {
            setIsActing(false);
        }
    };

    const handleApprove = async () => {
        setIsActing(true);
        try {
            const res = await fetch(`/api/documents/${id}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ comment: "" }),
            });
            if (res.ok) {
                const updated = await res.json();
                setDocument(updated);
            }
        } catch (error) {
            console.error("Failed to approve:", error);
        } finally {
            setIsActing(false);
        }
    };

    const handleReject = async () => {
        if (!rejectComment.trim()) {
            alert("Please provide a reason for rejection");
            return;
        }
        setIsActing(true);
        try {
            const res = await fetch(`/api/documents/${id}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ comment: rejectComment }),
            });
            if (res.ok) {
                const updated = await res.json();
                setDocument(updated);
                setShowRejectDialog(false);
                setRejectComment("");
            }
        } catch (error) {
            console.error("Failed to reject:", error);
        } finally {
            setIsActing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!document) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4">
                <FileText className="h-16 w-16 text-slate-300" />
                <p className="text-slate-500">Document not found</p>
                <Button asChild>
                    <Link href="/">Go back to Dashboard</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Header */}
            <header className="h-14 border-b bg-white flex items-center px-4 justify-between z-20 shrink-0 dark:bg-slate-950 dark:border-slate-800">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="text-slate-500">
                        <Link href="/">
                            <ArrowLeft size={18} />
                        </Link>
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-100 text-blue-700 rounded-md">
                            <FileText size={16} />
                        </div>
                        <div>
                            <h1 className="font-semibold text-sm text-slate-900 dark:text-slate-50">{document.title}</h1>
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                <span>{document.number}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Clock size={10} /> Updated {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Badge
                        variant="outline"
                        className={`ml-2 ${document.status === "APPROVED" ? "bg-green-50 text-green-700 border-green-200" :
                            document.status === "REJECTED" ? "bg-red-50 text-red-700 border-red-200" :
                                "bg-yellow-50 text-yellow-700 border-yellow-200"
                            }`}
                    >
                        {document.status}
                    </Badge>
                </div>

                <div className="flex items-center gap-2">
                    {/* Author actions for DRAFT */}
                    {isAuthor && isDraft && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null}
                                Save Draft
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSubmit}
                                disabled={isActing}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {isActing ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Send size={14} className="mr-1" />}
                                Submit for Approval
                            </Button>
                        </>
                    )}
                    {/* Regenerate button for template documents */}
                    {hasTemplate && isAuthor && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRegenerate}
                            disabled={isActing}
                        >
                            {isActing ? <Loader2 size={14} className="mr-1 animate-spin" /> : null}
                            Fill Placeholders
                        </Button>
                    )}
                    {/* PDF Download for approved docs */}
                    {document.status === "APPROVED" && (
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/api/documents/${id}/pdf`} target="_blank">
                                <Download size={14} className="mr-1" /> Download
                            </Link>
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-slate-600">
                        <Share2 size={16} className="mr-2" /> Share
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Sidebar (Workflow Status) */}
                <aside className="w-80 bg-white border-r flex flex-col z-10 hidden md:flex dark:bg-slate-950 dark:border-slate-800">
                    <div className="p-4 border-b font-medium text-sm text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
                        Approval Workflow
                    </div>
                    <ScrollArea className="flex-1 p-4">
                        <div className="relative space-y-8 pl-2">
                            {/* Connector Line */}
                            <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800" />

                            {document.workflow.map((step, index) => (
                                <div key={step.id} className="relative flex gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-sm z-10 ${step.status === "APPROVED"
                                        ? "bg-green-100 text-green-600 border-white"
                                        : step.status === "REJECTED"
                                            ? "bg-red-100 text-red-600 border-white"
                                            : step.status === "PENDING" && index === document.workflow.findIndex(s => s.status === "PENDING")
                                                ? "bg-indigo-600 text-white border-indigo-100 animate-pulse"
                                                : "bg-white text-slate-400 border-slate-200"
                                        }`}>
                                        {step.status === "APPROVED" ? (
                                            <CheckCircle2 size={16} />
                                        ) : step.status === "REJECTED" ? (
                                            <XCircle size={16} />
                                        ) : (
                                            index + 1
                                        )}
                                    </div>
                                    <div className="pb-4">
                                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-50">{step.role}</p>
                                        {step.user && (
                                            <div className="flex items-center gap-2 mt-1">
                                                <Avatar className="h-5 w-5">
                                                    <AvatarFallback className="text-[9px]">{step.user.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <p className="text-xs text-slate-500">{step.user.name}</p>
                                            </div>
                                        )}
                                        {step.actedAt && (
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                {formatDistanceToNow(new Date(step.actedAt), { addSuffix: true })}
                                            </p>
                                        )}
                                        {step.comment && (
                                            <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-900 rounded text-xs text-slate-600 dark:text-slate-400">
                                                "{step.comment}"
                                            </div>
                                        )}
                                        {step.status === "PENDING" && index === document.workflow.findIndex(s => s.status === "PENDING") && (
                                            <Badge variant="secondary" className="mt-2 text-[10px] font-normal">In Progress</Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </aside>

                {/* Main Editor Area */}
                <main className="flex-1 bg-slate-100 dark:bg-slate-950 relative flex flex-col items-center justify-start py-8 overflow-y-auto">

                    {/* Floating Action Bar - For Draft Submission */}
                    {isAuthor && isDraft && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-indigo-600 text-white backdrop-blur-md px-6 py-3 rounded-full shadow-lg flex items-center gap-4 transition-transform hover:scale-105">
                            <span className="text-sm">This document is a draft.</span>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="bg-white text-indigo-700 hover:bg-indigo-50"
                                onClick={handleSubmit}
                                disabled={isActing}
                            >
                                {isActing ? (
                                    <Loader2 size={16} className="mr-2 animate-spin" />
                                ) : (
                                    <Send size={16} className="mr-2" />
                                )}
                                Submit for Approval
                            </Button>
                        </div>
                    )}

                    {/* Floating Action Bar - For Approvers */}
                    {canApprove && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 text-white backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-4 transition-transform hover:scale-105">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-white hover:text-green-400 hover:bg-white/10 rounded-full"
                                onClick={handleApprove}
                                disabled={isActing}
                            >
                                <ThumbsUp size={16} className="mr-2" /> Approve
                            </Button>
                            <Separator orientation="vertical" className="h-4 bg-white/20" />
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-white hover:text-red-400 hover:bg-white/10 rounded-full"
                                onClick={() => setShowRejectDialog(true)}
                                disabled={isActing}
                            >
                                <ThumbsDown size={16} className="mr-2" /> Reject
                            </Button>
                        </div>
                    )}

                    {/* The Editor - OnlyOffice or Textarea */}
                    {document.templateUrl ? (
                        <div className="w-full h-[800px] bg-white shadow-2xl rounded-sm ring-1 ring-slate-200 overflow-hidden">
                            <OnlyOfficeEditor
                                documentUrl={document.templateUrl}
                                documentKey={`doc_${document.id}_${Date.now()}`}
                                documentTitle={document.title}
                                documentType="word"
                                mode={isDraft && isAuthor ? "edit" : "view"}
                                userEmail={session?.user?.email || "user@example.com"}
                                userName={session?.user?.name || "User"}
                            />
                        </div>
                    ) : (
                        <div className="w-[816px] min-h-[1056px] bg-white shadow-2xl rounded-sm ring-1 ring-slate-200 dark:bg-white dark:ring-slate-800">
                            <div className="w-full h-full flex flex-col">
                                {/* Fake Toolbar */}
                                <div className="h-auto border-b bg-[#f9fbfd] p-2 flex flex-col gap-2">
                                    <div className="flex items-center gap-4 text-xs text-slate-600 px-2">
                                        <span>File</span><span>Edit</span><span>View</span><span>Insert</span><span>Format</span><span>Tools</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-2 pb-1">
                                        <div className="h-6 w-24 bg-slate-200 rounded" />
                                        <div className="h-6 w-6 bg-slate-200 rounded" />
                                        <div className="h-6 w-6 bg-slate-200 rounded" />
                                        <div className="h-6 w-32 bg-slate-200 rounded" />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-12 space-y-4 flex-1">
                                    <h1 className="text-3xl font-bold text-slate-900">{document.title}</h1>
                                    <p className="text-sm text-slate-500">
                                        Created by {document.author.name} • {document.number}
                                    </p>
                                    <Separator className="my-4" />
                                    {isDraft && isAuthor ? (
                                        <textarea
                                            className="w-full min-h-[400px] p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                                            placeholder="Type your document content here..."
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                        />
                                    ) : document.content ? (
                                        <p className="text-slate-700 whitespace-pre-wrap">{document.content}</p>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="h-4 w-3/4 bg-slate-100 rounded" />
                                            <div className="h-4 w-full bg-slate-100 rounded" />
                                            <div className="h-4 w-5/6 bg-slate-100 rounded" />
                                            <br />
                                            <div className="h-4 w-full bg-slate-100 rounded" />
                                            <div className="h-4 w-full bg-slate-100 rounded" />
                                            <p className="text-sm text-slate-400 italic mt-8">
                                                Document content will appear here when using templates...
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Document</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this document.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        placeholder="Reason for rejection..."
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                    />
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowRejectDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={isActing || !rejectComment.trim()}
                        >
                            {isActing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
