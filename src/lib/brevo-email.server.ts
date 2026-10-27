import type { StoredVolunteerInput } from "./volunteer-schema.ts";

type BrevoMessage = {
  sender: { name: string; email: string };
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
  textContent: string;
};

const API_URL = "https://api.brevo.com/v3/smtp/email";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character]!;
  });
}

function brandedEmail(title: string, content: string, preheader: string): string {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f4f0e7;font-family:Arial,Helvetica,sans-serif;color:#243746;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f0e7;padding:28px 12px;"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#fffdf8;border:1px solid #e5dccb;border-radius:16px;overflow:hidden;"><tr><td style="background:#174b3b;padding:26px 32px;border-bottom:4px solid #c7a45b;"><p style="margin:0;color:#f7f0df;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">Fundación V.N.E.</p><h1 style="margin:10px 0 0;color:#fff;font-size:24px;line-height:1.3;">${escapeHtml(title)}</h1></td></tr><tr><td style="padding:30px 32px;font-size:15px;line-height:1.75;color:#243746;">${content}<div style="height:1px;background:#e8dfd0;margin:28px 0 18px;"></div><p style="margin:0;color:#66756f;font-size:12px;">Fundación V.N.E. · Esperanza que se construye con oportunidades.</p></td></tr></table><p style="margin:16px 0 0;color:#7b817b;font-size:11px;text-align:center;">Mensaje automático de Fundación V.N.E.</p></td></tr></table></body></html>`;
}

function emailConfig() {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const senderName =
    process.env.BREVO_SENDER_NAME?.trim() || "Fundación Venezuela Nueva Esperanza";
  const notificationEmail = process.env.VOLUNTEER_NOTIFICATION_EMAIL?.trim();

  if (!apiKey || !senderEmail || !notificationEmail) return null;
  return { apiKey, senderEmail, senderName, notificationEmail };
}

async function sendBrevoMessage(
  apiKey: string,
  message: BrevoMessage,
  event: "volunteer-confirmation" | "volunteer-admin-notification" | "volunteer-status-update",
): Promise<void> {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      // Do not log response bodies, recipient addresses, or volunteer data.
      console.error(
        JSON.stringify({ event: "email:send-failed", type: event, status: response.status }),
      );
    }
  } catch {
    // Email is a side effect; a provider/network failure must not undo a saved request.
    console.error(JSON.stringify({ event: "email:send-failed", type: event, reason: "network" }));
  }
}

/**
 * Sends the volunteer confirmation and internal alert after the request is saved.
 * Missing configuration or a Brevo outage never makes the form submission fail.
 */
export async function notifyNewVolunteer(input: StoredVolunteerInput): Promise<void> {
  const config = emailConfig();
  if (!config) {
    console.warn(
      JSON.stringify({ event: "email:skipped", reason: "brevo-not-configured" }),
    );
    return;
  }

  const fullName = `${input.nombre} ${input.apellido}`;
  const safeName = escapeHtml(fullName);
  const safeEmail = escapeHtml(input.correo);
  const safePhone = escapeHtml(input.telefono);
  const siteUrl = process.env.SITE_URL?.trim().replace(/\/$/, "");
  const panelUrl = siteUrl ? `${siteUrl}/solicitudes` : undefined;

  const common = {
    sender: { name: config.senderName, email: config.senderEmail },
  };

  const confirmation: BrevoMessage = {
    ...common,
    to: [{ email: input.correo, name: fullName }],
    subject: "Hemos recibido tu solicitud de voluntariado",
    htmlContent: brandedEmail("Solicitud recibida", `<p style="font-size:18px;font-weight:bold;color:#174b3b;">Gracias por tu interés, ${safeName}.</p><p>Hemos recibido tu solicitud de voluntariado. Nuestro equipo revisará la información y se pondrá en contacto contigo si corresponde avanzar al siguiente paso.</p><div style="margin:22px 0;padding:16px 18px;background:#f4f0e7;border-left:4px solid #c7a45b;border-radius:6px;"><p style="margin:0;font-weight:bold;color:#174b3b;">Importante</p><p style="margin:6px 0 0;">Este correo confirma la recepción; no significa que la solicitud haya sido aceptada.</p></div>`, "Confirmación de recepción de tu solicitud de voluntariado."),
    textContent: `Hola ${fullName},\n\nLa Fundación Venezuela Nueva Esperanza ha recibido tu solicitud de voluntariado. Revisaremos la información y nos pondremos en contacto contigo si necesitamos continuar el proceso.\n\nEste mensaje confirma la recepción; no significa que la solicitud haya sido aceptada.\n\nFundación Venezuela Nueva Esperanza`,
  };

  const adminHtml = brandedEmail(
    "Nueva solicitud de voluntariado",
    `<p>Se ha registrado una nueva solicitud. Estos son los datos de contacto:</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f4f0e7;border-radius:10px;"><tr><td style="padding:12px;border-bottom:1px solid #e5dccb;color:#66756f;">Nombre</td><td style="padding:12px;border-bottom:1px solid #e5dccb;font-weight:bold;">${safeName}</td></tr><tr><td style="padding:12px;border-bottom:1px solid #e5dccb;color:#66756f;">Correo</td><td style="padding:12px;border-bottom:1px solid #e5dccb;">${safeEmail}</td></tr><tr><td style="padding:12px;color:#66756f;">Teléfono</td><td style="padding:12px;">${safePhone}</td></tr></table>${panelUrl ? `<p style="margin:24px 0;"><a href="${escapeHtml(panelUrl)}" style="display:inline-block;background:#174b3b;color:#fff;text-decoration:none;padding:12px 20px;border-radius:24px;font-weight:bold;">Abrir panel de solicitudes</a></p>` : ""}<p style="color:#66756f;font-size:13px;">Por privacidad, el mensaje personal no se incluye en este correo. Accede al panel para consultar la solicitud completa.</p>`,
    "Nueva solicitud registrada en el formulario de voluntariado.",
  );

  const adminNotification: BrevoMessage = {
    ...common,
    to: [{ email: config.notificationEmail }],
    subject: "Nueva solicitud de voluntariado recibida",
    htmlContent: adminHtml,
    textContent: [
      "Nueva solicitud de voluntariado",
      `Nombre: ${fullName}`,
      `Correo: ${input.correo}`,
      `Teléfono: ${input.telefono}`,
      panelUrl ? `Panel: ${panelUrl}` : "",
      "Por privacidad, el mensaje personal no se incluye en esta notificación.",
    ]
      .filter(Boolean)
      .join("\n"),
  };

  await Promise.allSettled([
    sendBrevoMessage(config.apiKey, confirmation, "volunteer-confirmation"),
    sendBrevoMessage(config.apiKey, adminNotification, "volunteer-admin-notification"),
  ]);
}


export type VolunteerStatusNotification = "aceptada" | "descartada";

/**
 * Notifies an applicant only when their request is accepted or rejected.
 * This email is independent of the internal new-request mailbox setting.
 */
export async function notifyVolunteerStatus(input: {
  correo: string;
  nombre: string;
  apellido: string;
  status: VolunteerStatusNotification;
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const senderName =
    process.env.BREVO_SENDER_NAME?.trim() || "Fundación V.N.E.";

  if (!apiKey || !senderEmail) {
    console.warn(JSON.stringify({ event: "email:status-skipped", reason: "brevo-not-configured" }));
    return;
  }

  const messages: Record<VolunteerStatusNotification, { subject: string; paragraph: string }> = {
    aceptada: {
      subject: "Tu solicitud de voluntariado ha sido aceptada",
      paragraph: "¡Nos alegra informarte que tu solicitud de voluntariado ha sido aceptada! La Fundación se pondrá en contacto contigo para informarte sobre los próximos pasos.",
    },
    descartada: {
      subject: "Actualización sobre tu solicitud de voluntariado",
      paragraph: "Gracias por tu interés y por ofrecer tu tiempo a la Fundación. En esta ocasión, tu solicitud no ha sido seleccionada. Agradecemos sinceramente tu disposición para colaborar.",
    },
  };
  const message = messages[input.status];
  const fullName = `${input.nombre} ${input.apellido}`;
  const safeName = escapeHtml(fullName);
  const safeParagraph = escapeHtml(message.paragraph);
  const body: BrevoMessage = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: input.correo, name: fullName }],
    subject: message.subject,
    htmlContent: brandedEmail(input.status === "aceptada" ? "¡Tu solicitud fue aceptada!" : "Actualización de tu solicitud", `<p style="font-size:18px;font-weight:bold;color:#174b3b;">Hola, ${safeName}.</p><p>${safeParagraph}</p><div style="margin:22px 0;padding:16px 18px;background:#f4f0e7;border-left:4px solid #c7a45b;border-radius:6px;"><p style="margin:0;color:#174b3b;font-weight:bold;">Fundación V.N.E.</p><p style="margin:6px 0 0;">Gracias por considerar aportar tu tiempo y talento a nuestra labor.</p></div>`, message.subject),
    textContent: `Hola, ${fullName}\\n\\n${message.paragraph}\\n\\nFundación V.N.E.`,
  };
  await sendBrevoMessage(apiKey, body, "volunteer-status-update");
}
