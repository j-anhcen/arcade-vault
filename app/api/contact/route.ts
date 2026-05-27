import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)

  const { name, email, msg } = body ?? {}

  if (!name?.trim() || !email?.trim() || !msg?.trim()) {
    return Response.json({ ok: false, error: 'Todos los campos son requeridos.' }, { status: 400 })
  }

  const { error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'j.anhuaman@gmail.com',
    subject: `[Arcade Vault] Mensaje de ${name}`,
    html: `<p><strong>Nombre:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Mensaje:</strong><br>${msg.replace(/\n/g, '<br>')}</p>`,
  })

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}
