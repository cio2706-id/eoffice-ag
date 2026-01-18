"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
    ArrowLeft,
    Upload,
    FileText,
    Trash2,
    Download,
    Plus,
    Loader2,
    File,
    X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Template {
    id: string;
    name: string;
    description: string | null;
    fileName: string;
    filePath: string;
    fileType: string;
    createdAt: string;
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        name: "",
        description: "",
        file: null as File | null,
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    async function fetchTemplates() {
        try {
            const res = await fetch("/api/templates");
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error("Failed to fetch templates:", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleUpload() {
        if (!uploadForm.file || !uploadForm.name) {
            alert("Please provide a name and select a file");
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", uploadForm.file);
            formData.append("name", uploadForm.name);
            formData.append("description", uploadForm.description);

            const res = await fetch("/api/templates", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                setShowUploadDialog(false);
                setUploadForm({ name: "", description: "", file: null });
                fetchTemplates();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to upload template");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload template");
        } finally {
            setIsUploading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this template?")) return;

        try {
            const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchTemplates();
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    }

    const getFileIcon = (fileType: string) => {
        if (fileType === "docx" || fileType === "doc") {
            return <File className="h-5 w-5 text-blue-600" />;
        }
        return <FileText className="h-5 w-5 text-slate-500" />;
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-6 shadow-sm dark:bg-slate-950 dark:border-slate-800">
                <Button variant="ghost" size="icon" asChild className="text-slate-500">
                    <Link href="/">
                        <ArrowLeft size={18} />
                    </Link>
                </Button>
                <div className="flex items-center gap-2 font-semibold text-lg text-slate-900 dark:text-slate-50">
                    <FileText size={20} className="text-indigo-600" />
                    Template Library
                </div>
                <div className="flex-1" />
                <Button
                    onClick={() => setShowUploadDialog(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    <Plus size={16} className="mr-2" /> Upload Template
                </Button>
            </header>

            <main className="p-6 md:p-8 max-w-6xl mx-auto">
                <Card className="shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">Type</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Filename</TableHead>
                                <TableHead>Uploaded</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                                    </TableCell>
                                </TableRow>
                            ) : templates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                        No templates yet. Upload your first template!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                templates.map((template) => (
                                    <TableRow key={template.id}>
                                        <TableCell>{getFileIcon(template.fileType)}</TableCell>
                                        <TableCell className="font-medium">{template.name}</TableCell>
                                        <TableCell className="text-slate-500">
                                            {template.description || "-"}
                                        </TableCell>
                                        <TableCell className="text-slate-500 font-mono text-xs">
                                            {template.fileName}
                                        </TableCell>
                                        <TableCell className="text-slate-500">
                                            {formatDistanceToNow(new Date(template.createdAt), { addSuffix: true })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    asChild
                                                >
                                                    <a href={template.filePath} target="_blank" download>
                                                        <Download size={14} />
                                                    </a>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-500 hover:text-red-700"
                                                    onClick={() => handleDelete(template.id)}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </main>

            {/* Upload Dialog */}
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Template</DialogTitle>
                        <DialogDescription>
                            Upload a .docx template file to use when creating documents.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Template Name *</Label>
                            <Input
                                placeholder="e.g., Surat Keterangan"
                                value={uploadForm.name}
                                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                placeholder="Brief description of this template..."
                                value={uploadForm.description}
                                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>File *</Label>
                            <div
                                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {uploadForm.file ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <File className="h-5 w-5 text-indigo-600" />
                                        <span className="text-sm">{uploadForm.file.name}</span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setUploadForm({ ...uploadForm, file: null });
                                            }}
                                        >
                                            <X size={14} />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-slate-500">
                                        <Upload className="h-8 w-8 mx-auto mb-2" />
                                        <p>Click to select a file (.docx, .doc)</p>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".docx,.doc"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setUploadForm({ ...uploadForm, file });
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowUploadDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={isUploading || !uploadForm.file || !uploadForm.name}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 size={14} className="mr-2 animate-spin" /> Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload size={14} className="mr-2" /> Upload
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
