"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/ui/table";
import { approveApplication, rejectApplication } from "@/lib/actions/admissions";
import { formatDate } from "@/lib/format";

export type ApplicationRow = {
  id: string;
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  state: string;
  dateOfBirth: string;
  educationLevel: string;
  statement: string;
  photoIdUrl: string | null;
  documentUrl: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewerNote: string | null;
  submittedAt: string;
  programName: string;
  programId: string;
  courseTitle: string | null;
};

export function AdmissionsDesk({
  applications,
  programs,
}: {
  applications: ApplicationRow[];
  programs: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [programId, setProgramId] = useState("ALL");
  const [selected, setSelected] = useState<ApplicationRow | null>(null);
  const [note, setNote] = useState("");
  const [issued, setIssued] = useState<{ studentNumber: string; email: string; password: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return applications.filter((application) => {
      const matchesQuery =
        !needle ||
        [application.fullName, application.email, application.reference, application.programName]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      const matchesStatus = status === "ALL" || application.status === status;
      const matchesProgram = programId === "ALL" || application.programId === programId;
      return matchesQuery && matchesStatus && matchesProgram;
    });
  }, [applications, programId, query, status]);

  function approve(id: string) {
    startTransition(() => {
      void (async () => {
        const result = await approveApplication(id);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        setIssued({ studentNumber: result.studentNumber, email: result.email, password: result.password });
        setSelected((current) => (current ? { ...current, status: "APPROVED" } : current));
        toast.success(result.message);
        router.refresh();
      })();
    });
  }

  function reject(id: string) {
    startTransition(() => {
      void (async () => {
        const result = await rejectApplication(id, note);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success(result.message);
        setSelected(null);
        setNote("");
        router.refresh();
      })();
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, or reference" />
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </Select>
        <Select value={programId} onChange={(event) => setProgramId(event.target.value)}>
          <option value="ALL">All programmes</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.name}
            </option>
          ))}
        </Select>
      </div>
      <p className="text-sm text-charcoal/70">{rows.length} applications</p>
      <div className="rounded-3xl border border-navy/10 bg-paper">
        <Table>
          <thead>
            <tr>
              <Th>Applicant</Th>
              <Th>Programme</Th>
              <Th>Submitted</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.map((application) => (
              <tr key={application.id}>
                <Td>
                  <p className="font-semibold text-navy">{application.fullName}</p>
                  <p className="text-xs text-charcoal/60">{application.reference}</p>
                </Td>
                <Td>
                  {application.programName}
                  <span className="block text-xs text-charcoal/60">{application.courseTitle ?? "Course to be assigned"}</span>
                </Td>
                <Td>{formatDate(application.submittedAt)}</Td>
                <Td>
                  <Badge tone={statusTone(application.status)}>{application.status}</Badge>
                </Td>
                <Td className="text-right">
                  <Button size="sm" variant="outline" onClick={() => { setSelected(application); setNote(application.reviewerNote ?? ""); setIssued(null); }}>
                    Review
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.fullName}</DialogTitle>
                <DialogDescription>
                  {selected.reference} · {selected.email} · {selected.phone}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 text-sm md:grid-cols-2">
                <p><span className="font-semibold text-navy">State.</span> {selected.state}</p>
                <p><span className="font-semibold text-navy">Date of birth.</span> {formatDate(selected.dateOfBirth)}</p>
                <p><span className="font-semibold text-navy">Education.</span> {selected.educationLevel}</p>
                <p><span className="font-semibold text-navy">Programme.</span> {selected.programName}</p>
              </div>
              <p className="mt-4 text-sm leading-6 text-charcoal">{selected.statement}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                {selected.photoIdUrl ? (
                  <a className="text-teal-deep underline" href={selected.photoIdUrl} target="_blank" rel="noreferrer">
                    Photo ID
                  </a>
                ) : (
                  <span className="text-charcoal/50">No photo ID</span>
                )}
                {selected.documentUrl ? (
                  <a className="text-teal-deep underline" href={selected.documentUrl} target="_blank" rel="noreferrer">
                    Supporting document
                  </a>
                ) : (
                  <span className="text-charcoal/50">No supporting document</span>
                )}
              </div>
              {selected.reviewerNote ? <p className="mt-4 text-sm text-charcoal/70">Note: {selected.reviewerNote}</p> : null}
              {issued ? (
                <div className="mt-5 rounded-2xl border border-gold bg-[#F3E7C3] p-4 text-sm text-navy">
                  <p className="font-semibold">Student ID {issued.studentNumber}</p>
                  <p className="mt-1">Portal email {issued.email}</p>
                  <p className="mt-1">Temporary password {issued.password}</p>
                  <p className="mt-2 text-xs">Share this password once. It is not stored in plain text.</p>
                  <Button
                    className="mt-3"
                    size="sm"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(`${issued.email} / ${issued.password} / ${issued.studentNumber}`)}
                  >
                    Copy credentials
                  </Button>
                </div>
              ) : null}
              {selected.status !== "APPROVED" ? (
                <div className="mt-5 space-y-3">
                  <Field>
                    <Label htmlFor="note">Decision note</Label>
                    <Textarea id="note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Required if you do not admit this applicant." />
                  </Field>
                  <div className="flex flex-wrap gap-3">
                    <Button disabled={pending} onClick={() => approve(selected.id)}>
                      Approve and issue student ID
                    </Button>
                    <Button disabled={pending} variant="danger" onClick={() => reject(selected.id)}>
                      Do not admit
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
