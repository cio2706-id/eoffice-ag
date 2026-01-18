"use client";

import { Plus, Trash2, User, FileSignature, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLES = [
  { value: "STAFF", label: "Staff" },
  { value: "MANAGER", label: "Manager" },
  { value: "BENDAHARA", label: "Bendahara" },
  { value: "SEKERTARIS", label: "Sekertaris" },
  { value: "KETUA", label: "Ketua" },
];

const STEP_TYPES = [
  { value: "pemeriksa", label: "Pemeriksa (Reviewer)" },
  { value: "signer", label: "Penandatangan (Signer)" },
];

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface WorkflowStep {
  role: string;
  userId: string;
  type: string;
}

interface RecipientData {
  type: string; // "USER" or "EXTERNAL"
  value: string; // user ID or custom name
}

interface WorkflowBuilderProps {
  users: UserData[];
  workflow: WorkflowStep[];
  setWorkflow: (workflow: WorkflowStep[]) => void;
  recipient: RecipientData;
  setRecipient: (recipient: RecipientData) => void;
}

export default function WorkflowBuilder({
  users,
  workflow,
  setWorkflow,
  recipient,
  setRecipient
}: WorkflowBuilderProps) {

  const addStep = () => {
    setWorkflow([...workflow, { role: "MANAGER", userId: "", type: "pemeriksa" }]);
  };

  const removeStep = (index: number) => {
    setWorkflow(workflow.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof WorkflowStep, value: string) => {
    const updated = [...workflow];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "role") {
      updated[index].userId = "";
    }
    setWorkflow(updated);
  };

  const getUsersByRole = (role: string) => {
    return users.filter((u) => u.role === role);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Design Approval Workflow
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Define the recipient and approval chain.
        </p>
      </div>

      {/* Tujuan Surat Section */}
      <Card className="p-4 border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <Label className="text-base font-medium">Tujuan Surat (Recipient)</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              value={recipient.type}
              onValueChange={(val) => setRecipient({ type: val, value: "" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">
                  <div className="flex items-center gap-2">
                    <User size={14} /> Internal User
                  </div>
                </SelectItem>
                <SelectItem value="EXTERNAL">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} /> External / Other
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {recipient.type === "USER" ? (
              <Select
                value={recipient.value}
                onValueChange={(val) => setRecipient({ ...recipient, value: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select User" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Enter recipient name..."
                value={recipient.value}
                onChange={(e) => setRecipient({ ...recipient, value: e.target.value })}
              />
            )}
          </div>
        </div>
      </Card>

      {/* Approval Steps */}
      <div className="space-y-4 relative">
        <Label className="text-base font-medium">Approval Steps</Label>

        <div className="absolute left-6 top-12 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800 -z-10" />

        {workflow.map((step, index) => (
          <Card
            key={index}
            className={`p-4 flex items-center gap-4 transition-all duration-200 border-l-4 ${step.type === "signer"
                ? "border-l-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                : "border-l-slate-300 dark:border-l-slate-700"
              }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 ${step.type === "signer"
                  ? "bg-indigo-600 text-white"
                  : "bg-white border-2 border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400"
                }`}
            >
              {index + 1}
            </div>

            <div className="text-slate-400">
              {step.type === 'signer' ? <FileSignature size={20} /> : <User size={20} />}
            </div>

            <div className="flex-1 grid grid-cols-3 gap-3">
              <Select
                value={step.type}
                onValueChange={(val) => updateStep(index, "type", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {STEP_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={step.role}
                onValueChange={(val) => updateStep(index, "role", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={step.userId}
                onValueChange={(val) => updateStep(index, "userId", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Person" />
                </SelectTrigger>
                <SelectContent>
                  {getUsersByRole(step.role).length > 0 ? (
                    getUsersByRole(step.role).map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No users with this role
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-red-500"
              onClick={() => removeStep(index)}
              disabled={workflow.length === 1}
            >
              <Trash2 size={18} />
            </Button>
          </Card>
        ))}

        <Button
          onClick={addStep}
          variant="outline"
          className="w-full border-dashed border-2 py-6 text-slate-500 hover:border-indigo-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:border-indigo-400 dark:hover:text-indigo-400"
        >
          <Plus size={18} className="mr-2" /> Add Next Step
        </Button>
      </div>
    </div>
  );
}
