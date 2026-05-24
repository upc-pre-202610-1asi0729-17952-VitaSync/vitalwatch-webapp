require('dotenv').config({ path: 'server/.env' });

const crypto = require('crypto');
const jsonServer = require('json-server');
const { Resend } = require('resend');

const server = jsonServer.create();
const router = jsonServer.router('server/db.json');
const middlewares = jsonServer.defaults();

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const PORT = 3000;

server.use(middlewares);
server.use(jsonServer.bodyParser);

function generateToken() {
    return `inv-${crypto.randomUUID()}`;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function buildInvitationEmail({ email, role, invitationLink, organizationName }) {
    const roleLabel = role === 'SUPERVISOR' ? 'Supervisor clínico' : 'Personal médico';
    const medicalCenterName = organizationName || 'tu centro médico';

    const safeEmail = escapeHtml(email);
    const safeRoleLabel = escapeHtml(roleLabel);
    const safeMedicalCenterName = escapeHtml(medicalCenterName);
    const safeInvitationLink = escapeHtml(invitationLink);

    return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Invitación a VitalWatch</title>
      </head>

      <body style="margin:0; padding:0; background:#eef3ff; font-family:Arial, Helvetica, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#eef3ff; padding:48px 16px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="max-width:820px; background:#ffffff; border-radius:28px; padding:48px 44px 42px; box-shadow:0 18px 45px rgba(15,23,42,0.08);">

                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <h1 style="margin:0; color:#4f74ff; font-size:48px; line-height:1.1; font-weight:800; font-style:italic;">
                      VitalWatch
                    </h1>

                    <p style="margin:10px 0 0; color:#64748b; font-size:16px; line-height:1.5;">
                      Monitoreo inteligente para equipos de salud
                    </p>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding:0 20px;">
                    <p style="margin:0 0 24px; color:#050b18; font-size:25px; line-height:1.45;">
                      Hola, fuiste invitado a formar parte como
                      <strong style="color:#2563eb; font-style:italic;">${safeRoleLabel}</strong>
                      en el centro médico
                      <strong style="color:#2563eb; font-style:italic;">${safeMedicalCenterName}</strong>.
                    </p>

                    <p style="margin:0 0 24px; color:#050b18; font-size:24px; line-height:1.45;">
                      Se utilizará el correo
                      <strong style="color:#2563eb; font-style:italic;">${safeEmail}</strong>
                      para poder registrarte.
                    </p>

                    <p style="margin:0 0 32px; color:#050b18; font-size:24px; line-height:1.45;">
                      ¡Dale click al siguiente botón para poder iniciar tu registro!
                    </p>

                    <a href="${safeInvitationLink}"
                       style="display:inline-block; padding:18px 32px; border-radius:12px; background:#4f74ff; color:#ffffff; text-decoration:none; font-size:24px; font-weight:800; box-shadow:0 14px 28px rgba(79,116,255,0.24);">
                      Crear mi cuenta
                    </a>

                    <p style="margin:42px 0 16px; color:#050b18; font-size:24px; line-height:1.45;">
                      Si el botón no funciona, copia y pega este enlace en tu navegador:
                    </p>

                    <a href="${safeInvitationLink}"
                       style="display:block; color:#2563eb; font-size:22px; line-height:1.5; font-weight:800; font-style:italic; text-decoration:none; word-break:break-all;">
                      ${safeInvitationLink}
                    </a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

server.post('/api/v1/invitations/send', async (req, res) => {
    try {
        const { organizationId, email, role } = req.body;

        if (!organizationId || !email || !role) {
            return res.status(400).json({
                message: 'organizationId, email and role are required.'
            });
        }

        const db = router.db;
        const parsedOrganizationId = Number(organizationId);

        const existingUser = db.get('users')
            .find({
                organizationId: parsedOrganizationId,
                email
            })
            .value();

        if (existingUser) {
            return res.status(409).json({
                message: 'Ya existe un usuario registrado con este correo.'
            });
        }

        const existingPendingInvitation = db.get('invitations')
            .find({
                organizationId: parsedOrganizationId,
                email,
                status: 'PENDING'
            })
            .value();

        if (existingPendingInvitation) {
            return res.status(409).json({
                message: 'Ya existe una invitación pendiente para este correo.'
            });
        }

        const token = generateToken();
        const createdAt = new Date().toISOString();

        const invitation = db.get('invitations')
            .insert({
                organizationId: parsedOrganizationId,
                email,
                role,
                status: 'PENDING',
                token,
                createdAt,
                emailStatus: 'PENDING'
            })
            .write();

        const appPublicUrl = process.env.APP_PUBLIC_URL || 'http://localhost:4200';
        const invitationLink = `${appPublicUrl}/accept-invitation?token=${token}`;

        const organization = db.get('organizations')
            .find({ id: parsedOrganizationId })
            .value();

        if (!resend) {
            const updatedInvitation = db.get('invitations')
                .find({ id: invitation.id })
                .assign({
                    emailStatus: 'FAILED',
                    emailError: 'RESEND_API_KEY is not configured.'
                })
                .write();

            return res.status(201).json({
                ...updatedInvitation,
                invitationLink,
                message: 'La invitación fue creada, pero Resend no está configurado.'
            });
        }

        try {
            const { data, error } = await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'VitalWatch <onboarding@resend.dev>',
                to: [email],
                subject: 'Invitación para unirte a VitalWatch',
                html: buildInvitationEmail({
                    email,
                    role,
                    invitationLink,
                    organizationName: organization?.name
                })
            });

            if (error) {
                console.error('Resend error:', error);

                const updatedInvitation = db.get('invitations')
                    .find({ id: invitation.id })
                    .assign({
                        emailStatus: 'FAILED',
                        emailError: error.message ?? 'Resend error'
                    })
                    .write();

                return res.status(201).json({
                    ...updatedInvitation,
                    invitationLink,
                    message: 'La invitación fue creada, pero el correo no pudo enviarse.'
                });
            }

            const updatedInvitation = db.get('invitations')
                .find({ id: invitation.id })
                .assign({
                    emailStatus: 'SENT',
                    resendEmailId: data?.id ?? null
                })
                .write();

            return res.status(201).json({
                ...updatedInvitation,
                invitationLink
            });

        } catch (resendException) {
            console.error('Resend exception:', resendException);

            const updatedInvitation = db.get('invitations')
                .find({ id: invitation.id })
                .assign({
                    emailStatus: 'FAILED',
                    emailError: resendException.message ?? 'Resend exception'
                })
                .write();

            return res.status(201).json({
                ...updatedInvitation,
                invitationLink,
                message: 'La invitación fue creada, pero el correo no pudo enviarse.'
            });
        }

    } catch (error) {
        console.error('Unexpected invitation error:', error);

        return res.status(500).json({
            message: error.message ?? 'Unexpected error while sending invitation.'
        });
    }
});

server.use('/api/v1', router);

server.listen(PORT, () => {
    console.log(`VitalWatch fake API running on http://localhost:${PORT}`);
});