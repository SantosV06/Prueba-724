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
  event: "volunteer-confirmation" | "volunteer-admin-notification",
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
    htmlContent: `<!doctype html><html lang="es"><body><main><h1>Gracias por tu interés, ${safeName}</h1><p>La Fundación Venezuela Nueva Esperanza ha recibido tu solicitud de voluntariado.</p><p>Revisaremos la información y nos pondremos en contacto contigo si necesitamos continuar el proceso.</p><p>Este mensaje confirma la recepción; no significa que la solicitud haya sido aceptada.</p><p>Fundación Venezuela Nueva Esperanza</p></main></body></html>`,
    textContent: `Hola ${fullName},\n\nLa Fundación Venezuela Nueva Esperanza ha recibido tu solicitud de voluntariado. Revisaremos la información y nos pondremos en contacto contigo si necesitamos continuar el proceso.\n\nEste mensaje confirma la recepción; no significa que la solicitud haya sido aceptada.\n\nFundación Venezuela Nueva Esperanza`,
  };

  const adminHtml = [
    "<!doctype html><html lang=\"es\"><body><main>",
    "<h1>Nueva solicitud de voluntariado</h1>",
    `<p><strong>Nombre:</strong> ${safeName}</p>`,
    `<p><strong>Correo:</strong> ${safeEmail}</p>`,
    `<p><strong>Teléfono:</strong> ${safePhone}</p>`,
    panelUrl ? `<p><a href="${escapeHtml(panelUrl)}">Abrir el panel de solicitudes</a></p>` : "",
    "<p>Por privacidad, el mensaje personal no se incluye en esta notificación. Accede al panel para revisar la solicitud.</p>",
    "</main></body></html>",
  ].join("");

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
