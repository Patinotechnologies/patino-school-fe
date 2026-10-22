"use client";

import { useState, type FormEvent } from "react";
import { Wallet, TrendingUp, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge, type BadgeProps } from "@/components/ui/badge";

// Mock data — no API wired yet, this is a design pass only.
const FEE_STRUCTURE = [
  { grade: "Nursery", term: "Term 1, 2026", amount: "₦85,000" },
  { grade: "Primary 1–6", term: "Term 1, 2026", amount: "₦110,000" },
  { grade: "JSS 1–3", term: "Term 1, 2026", amount: "₦140,000" },
];

const INVOICES = [
  { id: "1", pupil: "Amaka Obi", class: "Primary 1", due: 110000, paid: 110000, status: "paid" },
  { id: "2", pupil: "Chioma Eze", class: "Primary 1", due: 110000, paid: 60000, status: "partial" },
  { id: "3", pupil: "Daniel Afolabi", class: "JSS 1", due: 140000, paid: 0, status: "unpaid" },
  { id: "4", pupil: "Esther Idowu", class: "Nursery 1", due: 85000, paid: 85000, status: "paid" },
  { id: "5", pupil: "Fatima Lawal", class: "JSS 1", due: 140000, paid: 50000, status: "partial" },
];

const STATUS_BADGE: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
  paid: { variant: "green", label: "Paid" },
  partial: { variant: "amber", label: "Partial" },
  unpaid: { variant: "red", label: "Unpaid" },
};

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

export default function FeesPage() {
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  const totalInvoiced = INVOICES.reduce((sum, i) => sum + i.due, 0);
  const totalCollected = INVOICES.reduce((sum, i) => sum + i.paid, 0);
  const collectionRate = Math.round((totalCollected / totalInvoiced) * 100);
  const activeInvoice = INVOICES.find((i) => i.id === activeInvoiceId) ?? null;

  function handleRecordPayment(e: FormEvent) {
    e.preventDefault();
    // Design only — no API call yet.
    setActiveInvoiceId(null);
    setPaymentAmount("");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Fees & Bursary" description="Fee structure, invoices, and collection across your schools." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total invoiced" value={formatNaira(totalInvoiced)} icon={Wallet} hint="This term" />
        <StatCard label="Total collected" value={formatNaira(totalCollected)} icon={TrendingUp} hint="This term" />
        <StatCard label="Collection rate" value={`${collectionRate}%`} icon={AlertCircle} hint="Collected vs invoiced" />
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-950">Fee structure</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3 font-medium">Grade</th>
                <th className="px-5 py-3 font-medium">Term</th>
                <th className="px-5 py-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {FEE_STRUCTURE.map((row) => (
                <tr key={row.grade} className="border-b border-zinc-50 last:border-0">
                  <td className="px-5 py-4 font-medium text-zinc-950">{row.grade}</td>
                  <td className="px-5 py-4 text-zinc-700">{row.term}</td>
                  <td className="px-5 py-4 text-zinc-700">{row.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-950">Invoices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3 font-medium">Pupil</th>
                <th className="px-5 py-3 font-medium">Class</th>
                <th className="px-5 py-3 font-medium">Due</th>
                <th className="px-5 py-3 font-medium">Paid</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((invoice) => (
                <tr key={invoice.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50">
                  <td className="px-5 py-4 font-medium text-zinc-950">{invoice.pupil}</td>
                  <td className="px-5 py-4 text-zinc-700">{invoice.class}</td>
                  <td className="px-5 py-4 text-zinc-700">{formatNaira(invoice.due)}</td>
                  <td className="px-5 py-4 text-zinc-700">{formatNaira(invoice.paid)}</td>
                  <td className="px-5 py-4">
                    <Badge variant={STATUS_BADGE[invoice.status].variant}>{STATUS_BADGE[invoice.status].label}</Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {invoice.status !== "paid" && (
                      <Button variant="outline" size="sm" onClick={() => setActiveInvoiceId(invoice.id)}>
                        Record payment
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={activeInvoice !== null}
        onClose={() => setActiveInvoiceId(null)}
        title="Record a payment"
        description={activeInvoice ? `${activeInvoice.pupil} · outstanding ${formatNaira(activeInvoice.due - activeInvoice.paid)}` : undefined}
      >
        <form onSubmit={handleRecordPayment} className="flex flex-col gap-4">
          <Input
            label="Amount"
            type="number"
            required
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setActiveInvoiceId(null)}>
              Cancel
            </Button>
            <Button type="submit">Record payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
