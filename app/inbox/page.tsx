"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import {
    FileText,
    Inbox as InboxIcon,
    CheckCircle2,
    Clock,
    XCircle,
    ArrowLeft,
    Send,
    Download
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

interface InboxItem {
    id: string;
    title: string;
    number: string;
    status: string;
    author: string;
    type: string;
    updatedAt: string;
}

export default function InboxPage() {
    const { data: session } = useSession();
    const [items, setItems] = useState<InboxItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchInbox() {
            try {
                const res = await fetch("/api/inbox");
                if (res.ok) {
                    const data = await res.json();
                    setItems(data);
                }
            } catch (error) {
                console.error("Failed to fetch inbox:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchInbox();
    }, []);

    const createdItems = items.filter((i) => i.type === "created");
    const receivedItems = items.filter((i) => i.type === "received");

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { class: string; icon: React.ReactNode }> = {
            APPROVED: {
                class: "border-green-500 text-green-600 bg-green-50",
                icon: <CheckCircle2 size={12} />
            },
            PENDING: {
                class: "border-yellow-500 text-yellow-600 bg-yellow-50",
                icon: <Clock size={12} />
            },
            DRAFT: {
                class: "border-slate-500 text-slate-600 bg-slate-50",
                icon: <FileText size={12} />
            },
            REJECTED: {
                class: "border-red-500 text-red-600 bg-red-50",
                icon: <XCircle size={12} />
            },
        };
        const style = styles[status] || styles.DRAFT;
        return (
            <Badge variant="outline" className={`${style.class} gap-1`}>
                {style.icon} {status}
            </Badge>
        );
    };

    const renderTable = (data: InboxItem[]) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Doc Number</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                            No documents found
                        </TableCell>
                    </TableRow>
                ) : (
                    data.map((item) => (
                        <TableRow key={item.id} className="group">
                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                            <TableCell className="font-medium">{item.title}</TableCell>
                            <TableCell className="text-slate-500 font-mono text-xs">{item.number}</TableCell>
                            <TableCell className="text-slate-500">{item.author}</TableCell>
                            <TableCell className="text-slate-500">
                                {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" asChild>
                                        <Link href={`/document/${item.id}`}>View</Link>
                                    </Button>
                                    {item.status === "APPROVED" && (
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href={`/api/documents/${item.id}/pdf`} target="_blank">
                                                <Download size={14} className="mr-1" /> PDF
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );

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
                    <InboxIcon size={20} className="text-indigo-600" />
                    My Documents
                </div>
            </header>

            <main className="p-6 md:p-8 max-w-7xl mx-auto">
                <Tabs defaultValue="created" className="space-y-6">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="created" className="gap-2">
                            <Send size={14} /> Created ({createdItems.length})
                        </TabsTrigger>
                        <TabsTrigger value="received" className="gap-2">
                            <Download size={14} /> Received ({receivedItems.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="created">
                        <Card className="shadow-sm">
                            {isLoading ? (
                                <div className="p-8 text-center text-slate-500">Loading...</div>
                            ) : (
                                renderTable(createdItems)
                            )}
                        </Card>
                    </TabsContent>

                    <TabsContent value="received">
                        <Card className="shadow-sm">
                            {isLoading ? (
                                <div className="p-8 text-center text-slate-500">Loading...</div>
                            ) : (
                                renderTable(receivedItems)
                            )}
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
