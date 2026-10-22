"use client";

import { useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

export function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    // Design only — no API call yet.
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  function handleVerifyTwoFactor(e: FormEvent) {
    e.preventDefault();
    // Design only — no API call yet.
    setIsTwoFactorEnabled(true);
    setIsTwoFactorModalOpen(false);
    setVerificationCode("");
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-zinc-950">Change password</h2>
        <p className="mt-1 text-sm text-zinc-600">Choose a strong password you don&apos;t use elsewhere.</p>

        <form onSubmit={handlePasswordSubmit} className="mt-4 flex flex-col gap-4">
          <Input
            label="Current password"
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="New password"
            type="password"
            required
            hint="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Confirm new password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <div className="mt-2 flex justify-end">
            <Button type="submit">Update password</Button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-950">Two-factor authentication</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Add an extra layer of security — you&apos;ll need a code from your phone to sign in.
              </p>
            </div>
          </div>
          <Badge variant={isTwoFactorEnabled ? "green" : "zinc"}>{isTwoFactorEnabled ? "Enabled" : "Disabled"}</Badge>
        </div>

        <div className="mt-4 flex justify-end">
          {isTwoFactorEnabled ? (
            <Button variant="outline" onClick={() => setIsTwoFactorEnabled(false)}>
              Disable 2FA
            </Button>
          ) : (
            <Button onClick={() => setIsTwoFactorModalOpen(true)}>Set up 2FA</Button>
          )}
        </div>
      </section>

      <Modal
        open={isTwoFactorModalOpen}
        onClose={() => setIsTwoFactorModalOpen(false)}
        title="Set up two-factor authentication"
        description="Scan this code with your authenticator app, then enter the 6-digit code it generates."
      >
        <form onSubmit={handleVerifyTwoFactor} className="flex flex-col gap-4">
          <div className="flex h-40 w-40 items-center justify-center self-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-400">
            QR code
          </div>
          <Input
            label="Verification code"
            required
            placeholder="123456"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsTwoFactorModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Verify & enable</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
