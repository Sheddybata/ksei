"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StudentIdCard, type CardStudent } from "@/components/id-card/student-card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/ui/table";
import { resetStudentPassword } from "@/lib/actions/admissions";
import { gradeBand } from "@/lib/format";

export type StudentRow = CardStudent & {
  email: string;
  progress: number;
  grade: number | null;
};

export function StudentRoster({ students }: { students: StudentRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(students.map((student) => student.id));
  const [preview, setPreview] = useState<StudentRow | null>(null);
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [exporting, setExporting] = useState(false);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return students.filter((student) =>
      !needle || `${student.name} ${student.email} ${student.studentNumber} ${student.program}`.toLowerCase().includes(needle),
    );
  }, [query, students]);

  const chosen = students.filter((student) => selected.includes(student.id));
  const allVisibleSelected = rows.length > 0 && rows.every((student) => selected.includes(student.id));

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleVisible() {
    if (allVisibleSelected) {
      const visibleIds = new Set(rows.map((student) => student.id));
      setSelected((current) => current.filter((id) => !visibleIds.has(id)));
      return;
    }
    setSelected((current) => Array.from(new Set([...current, ...rows.map((student) => student.id)])));
  }

  async function exportPdf() {
    if (!chosen.length) {
      toast.error("Select at least one student.");
      return;
    }
    setExporting(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const cardWidth = 53.98;
      const cardHeight = 85.6;
      const gap = 16;
      const xStart = (297 - cardWidth * 2 - gap) / 2;
      const y = (210 - cardHeight) / 2;
      const sheets = Array.from(document.querySelectorAll<HTMLElement>("[data-export-student]"));
      for (let index = 0; index < sheets.length; index += 1) {
        if (index > 0) pdf.addPage();
        const faces = Array.from(sheets[index].querySelectorAll<HTMLElement>("[data-card]"));
        let x = xStart;
        for (const face of faces) {
          const canvas = await html2canvas(face, { scale: 2, backgroundColor: null, useCORS: true });
          pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, y, cardWidth, cardHeight);
          x += cardWidth + gap;
        }
      }
      pdf.save("KSEI-ID-Cards.pdf");
      toast.success("ID cards exported.");
    } catch {
      toast.error("The PDF could not be created. Use Print if the export fails.");
    } finally {
      setExporting(false);
    }
  }

  function resetPassword(studentId: string) {
    startTransition(() => {
      void (async () => {
        const result = await resetStudentPassword(studentId);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        setIssued({ email: result.email, password: result.password });
        toast.success(result.message);
        router.refresh();
      })();
    });
  }

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input className="md:max-w-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search students" />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            Print selected
          </Button>
          <Button disabled={exporting} onClick={exportPdf}>
            {exporting ? "Preparing PDF…" : "Bulk export PDF"}
          </Button>
        </div>
      </div>
      <div className="no-print rounded-3xl border border-navy/10 bg-paper">
        <Table>
          <thead>
            <tr>
              <Th>
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} aria-label="Select all visible students" />
              </Th>
              <Th>Student</Th>
              <Th>Programme</Th>
              <Th>Progress</Th>
              <Th>Standing</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.map((student) => (
              <tr key={student.id}>
                <Td>
                  <input
                    type="checkbox"
                    checked={selected.includes(student.id)}
                    onChange={() => toggle(student.id)}
                    aria-label={`Select ${student.name}`}
                  />
                </Td>
                <Td>
                  <p className="font-semibold text-navy">{student.name}</p>
                  <p className="text-xs tracking-wide text-charcoal/60">{student.studentNumber}</p>
                </Td>
                <Td>{student.program}</Td>
                <Td>{student.progress}%</Td>
                <Td>
                  <Badge tone={student.grade != null && student.grade >= 50 ? "teal" : "gold"}>
                    {gradeBand(student.grade)}
                  </Badge>
                </Td>
                <Td className="space-x-2 text-right">
                  <Button size="sm" variant="outline" onClick={() => { setPreview(student); setIssued(null); }}>
                    ID card
                  </Button>
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => resetPassword(student.id)}>
                    Reset password
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <section className="space-y-6">
        <h2 className="no-print font-display text-2xl text-navy">Print sheet · {chosen.length} selected</h2>
        {chosen.map((student) => (
          <div key={student.id} data-export-student className="flex flex-wrap gap-4">
            <StudentIdCard student={student} side="front" />
            <StudentIdCard student={student} side="back" />
          </div>
        ))}
      </section>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="w-[min(100%-1.5rem,1040px)]">
          {preview ? (
            <>
              <DialogHeader>
                <DialogTitle>{preview.name}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-wrap gap-4">
                <StudentIdCard student={preview} side="front" />
                <StudentIdCard student={preview} side="back" />
              </div>
              <p className="mt-3 text-sm">
                Status <Badge tone={statusTone(preview.status)}>{preview.status}</Badge>
              </p>
              {issued ? (
                <p className="mt-3 rounded-2xl bg-ivory-deep p-3 text-sm text-navy">
                  {issued.email} · temporary password {issued.password}
                </p>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
