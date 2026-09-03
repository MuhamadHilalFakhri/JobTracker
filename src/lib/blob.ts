import { put, del, head } from "@vercel/blob"
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from "@/lib/constants"

export async function uploadPrivateFile(file: File, userId: string): Promise<{ url: string; size: number; mime: string }> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran file maksimal 10 MB")
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("Tipe file tidak diizinkan. Gunakan PDF, DOC, DOCX, PNG, atau JPG")
  }

  // File disimpan dengan access: private — hanya bisa diakses via handler terautentikasi.
  const blob = await put(`documents/${userId}/${Date.now()}-${file.name}`, file, {
    access: "private",
    contentType: file.type,
  })
  return { url: blob.url, size: file.size, mime: file.type }
}

export async function deletePrivateFile(url: string) {
  try {
    await del(url)
  } catch (e) {
    console.error("Gagal menghapus blob:", e)
  }
}

export async function getFileInfo(url: string) {
  return head(url)
}
