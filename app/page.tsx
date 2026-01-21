"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Plus,
  Search,
  Eye,
  PenLine,
  Activity,
  LogOut,
  User,
  Inbox
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Document {
  id: string;
  title: string;
  number: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  author: { name: string; email: string };
  workflow: { order: number; status: string; role: string }[];
}

export default function Dashboard() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);

  // Fetch current user
  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const res = await fetch("/api/users");
          if (res.ok) {
            const users = await res.json();
            const userData = users.find((u: { email: string }) => u.email === user.email);
            if (userData) {
              setCurrentUser(userData);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    }
    fetchCurrentUser();
  }, [supabase]);

  // Fetch documents
  useEffect(() => {
    async function fetchDocuments() {
      try {
        const res = await fetch("/api/documents");
        if (res.ok) {
          const data = await res.json();
          setDocuments(data);
        }
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDocuments();
  }, []);

  const stats = {
    pending: documents.filter((d) => d.status === "PENDING").length,
    approved: documents.filter((d) => d.status === "APPROVED").length,
    draft: documents.filter((d) => d.status === "DRAFT").length,
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCurrentStep = (doc: Document) => {
    const pendingStep = doc.workflow.find((s) => s.status === "PENDING");
    return pendingStep ? pendingStep.role : "Finalized";
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      APPROVED: "border-green-500 text-green-600 bg-green-50",
      PENDING: "border-yellow-500 text-yellow-600 bg-yellow-50",
      DRAFT: "border-slate-500 text-slate-600 bg-slate-50",
      REJECTED: "border-red-500 text-red-600 bg-red-50",
    };
    return styles[status] || "";
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-6 shadow-sm dark:bg-slate-950 dark:border-slate-800">
        <div className="flex items-center gap-2 font-semibold text-lg text-slate-900 dark:text-slate-50">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <FileText size={18} />
          </div>
          <span>E-Office</span>
        </div>
        <div className="flex-1" />

        <Button variant="ghost" size="icon" asChild className="text-slate-500 hover:text-indigo-600">
          <Link href="/inbox">
            <Inbox size={20} />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback className="bg-indigo-100 text-indigo-700">
                  {currentUser?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{currentUser?.name || "User"}</p>
              <p className="text-xs text-slate-500">{currentUser?.email}</p>
              <Badge variant="secondary" className="mt-1 text-xs">
                {currentUser?.role || "USER"}
              </Badge>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={async () => {
              await supabase.auth.signOut();
              router.push("/sign-in");
            }}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">

        {/* Actions & Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400">
              Welcome back, {currentUser?.name?.split(" ")[0] || "User"}!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[200px] pl-9 bg-white dark:bg-slate-900"
              />
            </div>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20">
              <Link href="/create">
                <Plus className="mr-2 h-4 w-4" /> New Document
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-yellow-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Pending Review
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{stats.pending}</div>
              <p className="text-xs text-slate-500 mt-1">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Approved
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{stats.approved}</div>
              <p className="text-xs text-slate-500 mt-1">Completed</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-slate-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                My Drafts
              </CardTitle>
              <FileText className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{stats.draft}</div>
              <p className="text-xs text-slate-500 mt-1">Work in progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card className="shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead>Document Title</TableHead>
                <TableHead>Doc Number</TableHead>
                <TableHead>Current Step</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Loading documents...
                  </TableCell>
                </TableRow>
              ) : filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No documents found. Create your first document!
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((doc) => (
                  <TableRow key={doc.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <TableCell>
                      <Badge variant="outline" className={getStatusBadge(doc.status)}>
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                      {doc.title}
                    </TableCell>
                    <TableCell className="text-slate-500 font-mono text-xs">{doc.number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700">
                            {getCurrentStep(doc).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {getCurrentStep(doc)}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/document/${doc.id}`}>
                              <Eye className="mr-2 h-4 w-4 text-slate-500" /> View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <PenLine className="mr-2 h-4 w-4 text-slate-500" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Activity className="mr-2 h-4 w-4 text-slate-500" /> Track
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
