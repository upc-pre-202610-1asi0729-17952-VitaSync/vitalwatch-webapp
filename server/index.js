require('dotenv').config({ path: 'server/.env' });

const crypto = require('crypto');
const express = require('express');
const jsonServer = require('json-server');
const Stripe = require('stripe');
const { Resend } = require('resend');

const server = jsonServer.create();
const router = jsonServer.router('server/db.json');
const middlewares = jsonServer.defaults();

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;


const stripe = process.env.STRIPE_SECRET_KEY
    ? Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

const PORT = 3000;

server.use(middlewares);

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


function getBillingInterval(plan) {
    return plan.billingPeriod === 'yearly' ? 'year' : 'month';
}

function getStripeObjectId(value) {
    if (!value) return null;
    return typeof value === 'string' ? value : value.id;
}

function activateSubscriptionFromCheckoutSession(session) {
    const db = router.db;
    const metadata = session.metadata ?? {};

    const organizationId = Number(metadata.organizationId);
    const administratorId = Number(metadata.administratorId);
    const subscriptionId = Number(metadata.subscriptionId);
    const checkoutSessionId = Number(metadata.checkoutSessionId);

    if (!organizationId || !administratorId || !subscriptionId || !checkoutSessionId) {
        return {
            activated: false,
            reason: 'Missing metadata in Stripe session.'
        };
    }

    const now = new Date().toISOString();

    const stripeSubscriptionId = getStripeObjectId(session.subscription);
    const stripeCustomerId = getStripeObjectId(session.customer);

    db.get('organizations')
        .find({ id: organizationId })
        .assign({
            status: 'ACTIVE',
            activatedAt: now
        })
        .write();

    db.get('users')
        .find({ id: administratorId })
        .assign({
            status: 'ACTIVE',
            activatedAt: now
        })
        .write();

    db.get('subscriptions')
        .find({ id: subscriptionId })
        .assign({
            status: 'ACTIVE',
            startedAt: now,
            stripeSubscriptionId,
            stripeCustomerId
        })
        .write();

    db.get('checkoutSessions')
        .find({ id: checkoutSessionId })
        .assign({
            status: 'COMPLETED',
            stripeSessionId: session.id,
            stripeSubscriptionId,
            stripeCustomerId,
            completedAt: now
        })
        .write();

    return {
        activated: true,
        organizationId,
        administratorId,
        subscriptionId,
        checkoutSessionId
    };
}

server.post('/api/v1/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) {
        return res.status(500).json({
            message: 'STRIPE_SECRET_KEY is not configured.'
        });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        return res.status(500).json({
            message: 'STRIPE_WEBHOOK_SECRET is not configured.'
        });
    }

    const signature = req.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error) {
        console.error('Stripe webhook signature error:', error.message);

        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;

            if (session.payment_status === 'paid') {
                const result = activateSubscriptionFromCheckoutSession(session);
                console.log('Stripe subscription activated:', result);
            }
        }

        if (event.type === 'checkout.session.expired') {
            const session = event.data.object;
            const checkoutSessionId = Number(session.metadata?.checkoutSessionId);

            if (checkoutSessionId) {
                const db = router.db;
                const now = new Date().toISOString();

                const checkoutSession = db.get('checkoutSessions')
                    .find({ id: checkoutSessionId })
                    .value();

                if (checkoutSession && checkoutSession.status !== 'COMPLETED') {
                    db.get('checkoutSessions')
                        .find({ id: checkoutSession.id })
                        .assign({
                            status: 'FAILED',
                            failedAt: now,
                            cancelledAt: now
                        })
                        .write();

                    db.get('subscriptions')
                        .find({ id: checkoutSession.subscriptionId })
                        .assign({
                            status: 'CANCELLED',
                            cancelledAt: now
                        })
                        .write();

                    db.get('users')
                        .find({ id: checkoutSession.administratorId })
                        .assign({
                            status: 'INACTIVE',
                            registrationStatus: 'CANCELLED',
                            cancelledAt: now
                        })
                        .write();

                    db.get('organizations')
                        .find({ id: checkoutSession.organizationId })
                        .assign({
                            status: 'INACTIVE',
                            registrationStatus: 'CANCELLED',
                            cancelledAt: now
                        })
                        .write();
                }
            }
        }

        return res.json({ received: true });

    } catch (error) {
        console.error('Stripe webhook handling error:', error);

        return res.status(500).json({
            message: error.message ?? 'Unexpected webhook error.'
        });
    }
});

server.use(jsonServer.bodyParser);

server.post('/api/v1/billing/create-checkout-session', async (req, res) => {
    let localCheckoutSession = null;

    try {
        if (!stripe) {
            return res.status(500).json({
                message: 'STRIPE_SECRET_KEY is not configured.'
            });
        }

        const { planCode, organization, administrator } = req.body;

        if (!planCode || !organization || !administrator) {
            return res.status(400).json({
                message: 'planCode, organization and administrator are required.'
            });
        }

        const db = router.db;

        const plan = db.get('plans')
            .find({ code: planCode })
            .value();

        if (!plan) {
            return res.status(404).json({
                message: 'Plan not found.'
            });
        }

        const existingUser = db.get('users')
            .find(user =>
                user.email === administrator.email &&
                user.registrationStatus !== 'CANCELLED'
            )
            .value();

        if (existingUser) {
            return res.status(409).json({
                message: 'Ya existe un usuario registrado con este correo.'
            });
        }

        const now = new Date().toISOString();

        const createdOrganization = db.get('organizations')
            .insert({
                name: organization.name,
                ruc: organization.ruc,
                address: organization.address,
                phone: organization.phone,
                planId: plan.id,
                status: 'INACTIVE',
                createdAt: now
            })
            .write();

        const createdAdministrator = db.get('users')
            .insert({
                organizationId: createdOrganization.id,
                firstName: administrator.firstName,
                lastName: administrator.lastName,
                email: administrator.email,
                password: administrator.password,
                phone: administrator.phone,
                role: 'HOSPITAL_ADMIN',
                status: 'PENDING',
                createdAt: now
            })
            .write();

        const createdSubscription = db.get('subscriptions')
            .insert({
                organizationId: createdOrganization.id,
                planId: plan.id,
                status: 'PENDING',
                startedAt: null,
                createdAt: now
            })
            .write();

        localCheckoutSession = db.get('checkoutSessions')
            .insert({
                organizationId: createdOrganization.id,
                administratorId: createdAdministrator.id,
                subscriptionId: createdSubscription.id,
                planId: plan.id,
                planCode: plan.code,
                status: 'PENDING',
                createdAt: now
            })
            .write();

        const appPublicUrl = process.env.APP_PUBLIC_URL || 'http://localhost:4200';

        const metadata = {
            organizationId: String(createdOrganization.id),
            administratorId: String(createdAdministrator.id),
            subscriptionId: String(createdSubscription.id),
            checkoutSessionId: String(localCheckoutSession.id),
            planId: String(plan.id),
            planCode: plan.code
        };

        const stripeSession = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            customer_email: createdAdministrator.email,
            client_reference_id: String(localCheckoutSession.id),
            line_items: [
                {
                    price_data: {
                        currency: (plan.currency ?? 'USD').toLowerCase(),
                        unit_amount: Math.round(Number(plan.price) * 100),
                        recurring: {
                            interval: getBillingInterval(plan)
                        },
                        product_data: {
                            name: `VitalWatch ${plan.name}`,
                            description: plan.description ?? plan.descriptionKey ?? ''
                        }
                    },
                    quantity: 1
                }
            ],
            metadata,
            subscription_data: {
                metadata
            },
            success_url: `${appPublicUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appPublicUrl}/checkout/cancelled?plan=${plan.code}&checkoutSessionId=${localCheckoutSession.id}`
        });

        db.get('checkoutSessions')
            .find({ id: localCheckoutSession.id })
            .assign({
                stripeSessionId: stripeSession.id,
                stripeUrl: stripeSession.url
            })
            .write();

        return res.status(201).json({
            checkoutUrl: stripeSession.url,
            stripeSessionId: stripeSession.id,
            organizationId: createdOrganization.id,
            administratorId: createdAdministrator.id,
            subscriptionId: createdSubscription.id,
            checkoutSessionId: localCheckoutSession.id
        });

    } catch (error) {
        console.error('Stripe checkout error:', error);

        if (localCheckoutSession?.id) {
            router.db
                .get('checkoutSessions')
                .find({ id: localCheckoutSession.id })
                .assign({
                    status: 'FAILED',
                    failedAt: new Date().toISOString(),
                    errorMessage: error.message ?? 'Stripe checkout error'
                })
                .write();
        }

        return res.status(500).json({
            message: error.message ?? 'Unexpected error while creating checkout session.'
        });
    }
});

server.get('/api/v1/billing/checkout-session-status', async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({
                message: 'STRIPE_SECRET_KEY is not configured.'
            });
        }

        const sessionId = req.query.session_id;

        if (!sessionId) {
            return res.status(400).json({
                message: 'session_id is required.'
            });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        let activation = null;

        if (session.status === 'complete' && session.payment_status === 'paid') {
            activation = activateSubscriptionFromCheckoutSession(session);
        }

        return res.json({
            stripeSessionId: session.id,
            status: session.status,
            paymentStatus: session.payment_status,
            activated: activation?.activated ?? false
        });

    } catch (error) {
        console.error('Stripe session status error:', error);

        return res.status(500).json({
            message: error.message ?? 'Unexpected error while checking checkout session.'
        });
    }
});

server.post('/api/v1/billing/cancel-checkout-session', (req, res) => {
    try {
        const checkoutSessionId = Number(req.body.checkoutSessionId);

        if (!checkoutSessionId) {
            return res.status(400).json({
                message: 'checkoutSessionId is required.'
            });
        }

        const db = router.db;

        const checkoutSession = db.get('checkoutSessions')
            .find({ id: checkoutSessionId })
            .value();

        if (!checkoutSession) {
            return res.status(404).json({
                message: 'Checkout session not found.'
            });
        }

        if (checkoutSession.status === 'COMPLETED') {
            return res.status(409).json({
                message: 'This checkout session is already completed.'
            });
        }

        const now = new Date().toISOString();

        db.get('checkoutSessions')
            .find({ id: checkoutSession.id })
            .assign({
                status: 'FAILED',
                cancelledAt: now
            })
            .write();

        db.get('subscriptions')
            .find({ id: checkoutSession.subscriptionId })
            .assign({
                status: 'CANCELLED',
                cancelledAt: now
            })
            .write();

        db.get('users')
            .find({ id: checkoutSession.administratorId })
            .assign({
                status: 'INACTIVE',
                registrationStatus: 'CANCELLED',
                cancelledAt: now
            })
            .write();

        db.get('organizations')
            .find({ id: checkoutSession.organizationId })
            .assign({
                status: 'INACTIVE',
                registrationStatus: 'CANCELLED',
                cancelledAt: now
            })
            .write();

        return res.json({
            cancelled: true,
            checkoutSessionId: checkoutSession.id
        });

    } catch (error) {
        console.error('Cancel checkout session error:', error);

        return res.status(500).json({
            message: error.message ?? 'Unexpected error while cancelling checkout session.'
        });
    }
});

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

        const existingActiveOrPendingUser = db.get('users')
            .filter(user =>
                user.email === administrator.email &&
                user.status !== 'CANCELLED'
            )
            .value()[0];

        if (existingActiveOrPendingUser) {
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
    console.log(`VitalWatch fake API running on http://localhost:${PORT}/api/v1`);
});