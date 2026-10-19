import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "../common/Button.jsx";
import { Card } from "../common/Card.jsx";
import { TextField } from "../form/TextField.jsx";
import { pinGateSchema } from "../../auth/authSchemas.js";
import { authErrorMessage, useParentGateMutation } from "../../auth/useAuth.js";

export function PinGate({ title = "Mở khóa phụ huynh", message = "Nhập PIN 4 số để tiếp tục." }) {
  const gate = useParentGateMutation();
  const form = useForm({
    resolver: zodResolver(pinGateSchema),
    defaultValues: { pin: "" }
  });

  async function onSubmit(values) {
    await gate.mutateAsync(values);
    form.reset({ pin: "" });
  }

  return (
    <section className="grid min-h-[60vh] place-items-center">
      <Card className="w-full max-w-md">
        <div className="target-56 inline-flex rounded-2xl bg-[var(--vc-mint)] p-4 text-[var(--vc-primary)]">
          <LockKeyhole aria-hidden="true" className="h-7 w-7" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-black">{title}</h1>
        <p className="mt-2 leading-7 text-[var(--vc-muted)]">{message}</p>
        <form className="mt-6 grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <TextField
            autoComplete="current-password"
            error={form.formState.errors.pin}
            inputMode="numeric"
            label="PIN phụ huynh"
            maxLength={4}
            registration={form.register("pin")}
            type="password"
          />
          {gate.isError ? <p className="rounded-2xl bg-[#fef2f2] p-3 text-sm font-bold text-[var(--vc-error)]">{authErrorMessage(gate.error)}</p> : null}
          <Button disabled={gate.isPending} type="submit">
            {gate.isPending ? "Đang kiểm tra..." : "Mở khóa"}
          </Button>
        </form>
      </Card>
    </section>
  );
}
