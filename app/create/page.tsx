"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import WorkflowBuilder from "@/components/WorkflowBuilder";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface Template {
    id: string;
    name: string;
    filePath: string;
}

export default function CreateDocumentPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [title, setTitle] = useState("");
    const [selectedTemplateId, setSelectedTemplateId] = useState("blank");
    const [users, setUsers] = useState<User[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [workflow, setWorkflow] = useState<{ role: string; userId: string; type: string }[]>([
        { role: "MANAGER", userId: "", type: "pemeriksa" },
    ]);
    const [recipient, setRecipient] = useState<{ type: string; value: string }>({
        type: "USER",
        value: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const [usersRes, templatesRes] = await Promise.all([
                    fetch("/api/users"),
                    fetch("/api/templates"),
                ]);
                if (usersRes.ok) {
                    const data = await usersRes.json();
                    setUsers(data);
                }
                if (templatesRes.ok) {
                    const data = await templatesRes.json();
                    setTemplates(data);
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        }
        fetchData();
    }, []);

    const handleCreate = async () => {
        if (!title.trim()) {
            alert("Please enter a document title");
            return;
        }

        setIsSubmitting(true);
        try {
            const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

            console.log("Creating document with:", { title, recipient, workflow, template: selectedTemplate });

            const res = await fetch("/api/documents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    content: "",
                    asDraft: true,
                    recipient: recipient.value || null,
                    recipientType: recipient.type,
                    templateId: selectedTemplate?.id || null,
                    templateUrl: selectedTemplate?.filePath || null,
                    workflow: workflow.map((w) => ({
                        role: w.role,
                        userId: w.userId || null,
                        type: w.type,
                    })),
                }),
            });

            console.log("Response status:", res.status, res.statusText);

            if (res.ok) {
                const doc = await res.json();
                console.log("Document created:", doc);
                router.push(`/document/${doc.id}`);
            } else {
                const text = await res.text();
                console.log("Error response:", text);
                try {
                    const error = JSON.parse(text);
                    alert(error.error || "Failed to create document");
                } catch {
                    alert("Failed to create document: " + text);
                }
            }
        } catch (error) {
            console.error("Failed to create document:", error);
            alert("Failed to create document: " + (error instanceof Error ? error.message : String(error)));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-white px-6 shadow-sm dark:bg-slate-950 dark:border-slate-800">
                <Button variant="ghost" asChild className="mr-4 -ml-2 text-slate-500 hover:text-slate-900">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Link>
                </Button>
                <div className="flex items-center gap-2 font-semibold text-lg text-slate-900 dark:text-slate-50">
                    Create New Document
                </div>
            </header>

            <main className="flex-1 w-full max-w-5xl mx-auto p-6 md:p-12">
                {/* Step Indicator */}
                <div className="mb-12">
                    <div className="flex items-center justify-center gap-4">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 ${step >= 1 ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200'}`}>
                                1
                            </div>
                            Document Details
                        </div>
                        <div className="w-12 h-0.5 bg-slate-200" />
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 ${step >= 2 ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200'}`}>
                                2
                            </div>
                            Approval Workflow
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border shadow-sm p-8 min-h-[500px]">
                    {step === 1 && (
                        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">What are we writing today?</h2>
                                <p className="text-slate-500 mt-2">Start by providing the basic details of your document.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Document Title</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. Monthly Budget Report"
                                        className="h-12 text-lg"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Document Template</Label>
                                    <p className="text-xs text-slate-500 mb-2">
                                        Select a template to use or start with a blank document.
                                    </p>
                                    <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select template" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="blank">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={16} />
                                                    Blank Document
                                                </div>
                                            </SelectItem>
                                            {templates.map((t) => (
                                                <SelectItem key={t.id} value={t.id}>
                                                    <div className="flex items-center gap-2">
                                                        <FileText size={16} />
                                                        {t.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="pt-8 flex justify-end">
                                <Button
                                    size="lg"
                                    onClick={() => setStep(2)}
                                    className="bg-slate-900 hover:bg-slate-800 text-white"
                                    disabled={!title.trim()}
                                >
                                    Next Step <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                            <WorkflowBuilder
                                users={users}
                                workflow={workflow}
                                setWorkflow={setWorkflow}
                                recipient={recipient}
                                setRecipient={setRecipient}
                            />

                            <div className="pt-8 flex justify-between max-w-2xl mx-auto border-t mt-8">
                                <Button variant="ghost" onClick={() => setStep(1)}>
                                    Back
                                </Button>
                                <Button
                                    size="lg"
                                    onClick={handleCreate}
                                    disabled={isSubmitting}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            Open Editor <ChevronRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
