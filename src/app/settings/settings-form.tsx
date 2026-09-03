"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TextInput, Field } from "@/components/form/inputs"
import { SelectField } from "@/components/form/select-wrapper"
import { Separator } from "@/components/ui/separator"
import { updateProfile } from "@/app/actions/profile"
import { CURRENCIES, DATE_FORMATS } from "@/lib/constants"

type UserData = {
  name: string
  email: string
  image: string | null
  timezone: string
  locale: string
  currency: string
  dateFormat: string
  theme: "light" | "dark" | "system"
}

const TIMEZONES = Intl.supportedValuesOf?.("timeZone") ?? [
  "Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura", "Asia/Singapore", "UTC",
]

const THEMES = ["light", "dark", "system"] as const

export function SettingsForm({ user }: { user: UserData }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState(user)

  const set = (k: keyof UserData, v: string) => setValues((p) => ({ ...p, [k]: v }))

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        await updateProfile(values)
        toast.success("Pengaturan disimpan")
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal menyimpan")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
        <CardDescription>Nama dan preferensi akun kamu.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Nama" value={values.name}
            onChange={(e) => set("name", e.target.value)} />
          <TextInput label="Email" value={values.email} disabled />
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Tema" value={values.theme}
            onChange={(v) => set("theme", v)} options={THEMES} />
          <SelectField label="Mata Uang" value={values.currency}
            onChange={(v) => set("currency", v)} options={CURRENCIES} />
          <SelectField label="Format Tanggal" value={values.dateFormat}
            onChange={(v) => set("dateFormat", v)} options={DATE_FORMATS} />
          <SelectField label="Zona Waktu" value={values.timezone}
            onChange={(v) => set("timezone", v)} options={TIMEZONES} />
        </div>

        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </CardContent>
    </Card>
  )
}