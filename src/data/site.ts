export const org = {
  name: "Fundación Venezuela Nueva Esperanza LLC",
  short: "Fundación VNE",
  email: "info@foundationvne.com",
  adminPhone: "+1 (917) 597 9179",
  adminTel: "+19175979179",
  executivePhone: "+1 (347) 819 9521",
  executiveTel: "+13478199521",
  zelle: "+1 (347) 819 5521",
  bank: "Bank of America",
  infoWa: "https://wa.me/13479577821",
  webWa: "https://wa.me/50762305711",
  instagram: "https://www.instagram.com/fundacionv.n.e",
  addressNy: "433 Sackett St, Brooklyn, NY 11231",
  addressCcs:
    "Av. Andrés Bello, tercera transversal de Guaicaipuro, Quinta Raquel, Caracas 1050",
  ein: "93-4222627",
  founded: "2022",
  hours: "Lunes a viernes, 8:00 a.m. – 5:00 p.m. Fines de semana con cita previa.",
  mapNy: "https://www.google.com/maps?q=433+Sackett+St,+Brooklyn,+NY+11231&output=embed",
  mapCcs:
    "https://www.google.com/maps?q=Avenida+Andres+Bello+y+transversal+Guaicaipuro,+Caracas&output=embed",
} as const;

export const nav = [
  { to: "/", label: "Inicio" },
  { to: "/casas", label: "Casas VNE" },
  { to: "/genesis", label: "Génesis" },
  { to: "/liderazgo", label: "Liderazgo" },
  { to: "/soporte", label: "Soporte" },
] as const;

export type LegalSlug = "privacidad" | "terminos" | "conflicto" | "no-discriminacion";

export const legalPages: Record<
  LegalSlug,
  { title: string; description: string; blocks: { heading?: string; paragraphs: string[]; list?: string[] }[] }
> = {
  privacidad: {
    title: "Política de privacidad",
    description:
      "Política de privacidad de Fundación Venezuela Nueva Esperanza LLC (Fundación V.N.E.). Información sobre datos personales, cookies y tecnologías del sitio.",
    blocks: [
      {
        paragraphs: [
          "Fundación Venezuela Nueva Esperanza LLC, que opera públicamente como Fundación V.N.E. (en adelante, “la Organización”), explica en esta política qué información puede tratar cuando usted visita el sitio, envía una solicitud o se comunica con nosotros. Esta política describe las prácticas del sitio web y no sustituye los avisos de los proveedores externos.",
        ],
      },
      {
        heading: "1. Información que podemos recopilar",
        paragraphs: ["Según las funciones que utilice, podemos tratar las siguientes categorías de información:"],
        list: [
          "Datos de contacto que usted facilita, como nombre, correo electrónico y teléfono.",
          "Contenido que usted envía en formularios, solicitudes de voluntariado, consultas u otras comunicaciones.",
          "Datos operativos y de seguridad generados al usar el sitio, como dirección IP, fecha y hora de la solicitud, información del navegador y registros técnicos necesarios para detectar abusos, mantener la disponibilidad y proteger las cuentas.",
          "Datos de cuenta y autenticación del personal autorizado que accede al área administrativa, incluidos identificadores de sesión y registros de seguridad.",
          "Preferencias de idioma y tema que el navegador guarda localmente para recordar sus elecciones.",
        ],
      },
      {
        heading: "2. Finalidades y base operativa",
        paragraphs: ["Utilizamos la información para:"],
        list: [
          "Responder mensajes, tramitar solicitudes y administrar programas o servicios solicitados.",
          "Operar, mantener y proteger el sitio, su base de datos y el acceso administrativo.",
          "Prevenir fraude, spam, abuso y accesos no autorizados, incluso mediante controles de seguridad de terceros cuando estén habilitados.",
          "Recordar preferencias básicas, como idioma y tema visual.",
          "Medir el rendimiento y uso general del sitio mediante Vercel Analytics y Vercel Speed Insights, integrados en la aplicación; estos servicios pueden procesar datos técnicos de navegación conforme a sus propias condiciones.",
          "Cumplir obligaciones legales, atender solicitudes válidas y proteger los derechos de la Organización y de otras personas.",
        ],
      },
      {
        heading: "3. Formularios, base de datos y conservación",
        paragraphs: [
          "La información enviada mediante formularios puede almacenarse en la base de datos de la aplicación para gestionar y dar seguimiento a la solicitud. El acceso administrativo está restringido a usuarios autorizados. No envíe por los formularios contraseñas, números completos de tarjetas, información bancaria sensible ni datos que no sean necesarios para su solicitud.",
          "Conservamos los datos durante el tiempo razonablemente necesario para atender la finalidad de la solicitud, mantener la seguridad, cumplir obligaciones legales y resolver disputas. El plazo concreto puede variar según el tipo de registro. Los registros técnicos y de seguridad pueden conservarse durante periodos más breves o conforme a necesidades operativas. Cuando los datos ya no sean necesarios, se eliminan o se anonimizan cuando resulte viable, sujeto a obligaciones legales y copias de seguridad.",
        ],
      },
      {
        heading: "4. Cookies y almacenamiento local",
        paragraphs: [
          "El sitio no declara utilizar cookies publicitarias ni de seguimiento de marketing. La aplicación puede utilizar cookies estrictamente necesarias para mantener sesiones autenticadas del área administrativa y proteger funciones de seguridad. Estas cookies no se utilizan para personalizar anuncios.",
          "La preferencia de tema se guarda en localStorage con la clave “vne-theme”, y la preferencia de idioma puede guardarse mediante el mecanismo local de preferencias del navegador. localStorage no es una cookie, pero almacena información en su dispositivo. Puede borrar estos datos desde la configuración del navegador; al hacerlo, quizá deba volver a elegir sus preferencias.",
          "El sitio integra Vercel Analytics y Vercel Speed Insights para medición de tráfico y rendimiento, y puede utilizar Cloudflare Turnstile para mitigar tráfico automatizado en formularios protegidos. Estos proveedores pueden procesar datos técnicos y utilizar tecnologías propias según su configuración y sus políticas. No afirmamos que el sitio esté libre de toda tecnología de medición o seguridad. Si en el futuro se incorporan herramientas opcionales de publicidad o seguimiento que requieran consentimiento, la Organización deberá revisar esta política y los controles correspondientes antes de activarlas.",
        ],
      },
      {
        heading: "5. Proveedores y enlaces externos",
        paragraphs: [
          "El sitio depende de proveedores técnicos para alojamiento, entrega de la aplicación, base de datos, analítica y seguridad. Cuando se habilitan, estos pueden incluir Vercel, Neon y Cloudflare. Los enlaces a WhatsApp, Instagram, servicios de mapas o Zelle llevan a plataformas externas que operan bajo sus propios avisos y condiciones; al abrirlos, la información que usted proporcione queda sujeta a las prácticas de ese proveedor.",
          "La Organización no vende datos personales. Puede compartir información con proveedores que la necesiten para prestar servicios técnicos a la aplicación, bajo las condiciones aplicables, o cuando sea necesario para cumplir la ley, proteger la seguridad o responder a un requerimiento válido.",
        ],
      },
      {
        heading: "6. Seguridad",
        paragraphs: [
          "Aplicamos medidas técnicas y organizativas razonables, como controles de acceso, sesiones protegidas y mecanismos de prevención de abuso. Ningún sistema de transmisión o almacenamiento puede garantizar seguridad absoluta. Si sospecha que una comunicación o cuenta está comprometida, contacte a la Organización por los medios oficiales.",
        ],
      },
      {
        heading: "7. Sus solicitudes y derechos",
        paragraphs: [
          "Puede solicitar acceso, corrección o eliminación de información personal que nos haya proporcionado, así como plantear preguntas sobre su tratamiento, escribiendo a info@foundationvne.com. Para proteger a las personas, podremos pedir información razonable para verificar la identidad y aclarar la solicitud. La atención estará sujeta a la ley aplicable y a los registros que debamos conservar por razones legales o de seguridad.",
        ],
      },
      {
        heading: "8. Menores de edad",
        paragraphs: [
          "El sitio no está diseñado para recopilar deliberadamente información personal de menores sin la participación o autorización que pueda exigir la legislación aplicable. Si considera que un menor nos ha enviado información personal de forma inadecuada, comuníquese con nosotros para que podamos revisar el caso.",
        ],
      },
      {
        heading: "9. Transferencias y servicios internacionales",
        paragraphs: [
          "La Organización está registrada en Nueva York y puede trabajar con proveedores que procesan información en Estados Unidos u otros países. Las leyes de protección de datos pueden variar según la ubicación. Los datos se tratarán conforme a esta política y a los requisitos legales aplicables.",
        ],
      },
      {
        heading: "10. Cambios y contacto",
        paragraphs: [
          "Podemos actualizar esta política para reflejar cambios operativos, técnicos o legales. Publicaremos la versión vigente en esta página e indicaremos la fecha de actualización. Esta política no pretende renunciar a derechos que no puedan excluirse por ley.",
          "Última actualización: 25 de octubre de 2026.",
          "Contacto de privacidad: info@foundationvne.com.",
        ],
      },
    ],
  },
  terminos: {
    title: "Términos y condiciones",
    description: "Términos de uso del sitio de Fundación Venezuela Nueva Esperanza LLC.",
    blocks: [
      {
        paragraphs: [
          "Al acceder o utilizar el sitio o los canales públicos de Fundación Venezuela Nueva Esperanza LLC (“la Organización”), usted acepta estos términos.",
        ],
      },
      {
        heading: "1. Naturaleza de la organización",
        paragraphs: [
          "Fundación Venezuela Nueva Esperanza LLC es una sociedad de responsabilidad limitada con propósito social, registrada en el Estado de Nueva York. La información de este sitio es general y no constituye asesoría legal, financiera ni un compromiso contractual, salvo que conste en un acuerdo escrito.",
        ],
      },
      {
        heading: "2. Uso del sitio",
        paragraphs: [
          "El uso debe ser legal y ético. Queda prohibida la reproducción, modificación o distribución del contenido sin autorización expresa de la Organización.",
        ],
      },
      {
        heading: "3. Ausencia de obligación automática",
        paragraphs: [
          "Visitar el sitio, enviar una consulta o una solicitud de voluntariado no crea una relación contractual, laboral, financiera ni de representación, salvo que se formalice por escrito.",
        ],
      },
      {
        heading: "4. Donaciones",
        paragraphs: [
          "Las donaciones son voluntarias y se realizan solo desde la plataforma oficial de Zelle, bajo responsabilidad del donante. La Organización no solicita contraseñas, códigos de verificación ni datos bancarios.",
        ],
      },
      {
        heading: "5. Limitación de responsabilidad",
        paragraphs: [
          "La Organización no responde por daños directos, indirectos, incidentales o consecuentes derivados del uso o de la interpretación de la información publicada en este sitio.",
        ],
      },
      {
        heading: "6. Propiedad intelectual",
        paragraphs: [
          "Textos, marcas, logotipos y materiales de este sitio pertenecen a Fundación Venezuela Nueva Esperanza LLC, salvo indicación distinta, y están protegidos por las leyes aplicables.",
        ],
      },
      {
        heading: "7. Ley aplicable",
        paragraphs: [
          "Estos términos se rigen por las leyes del Estado de Nueva York, Estados Unidos.",
          "Última actualización: 2026.",
        ],
      },
    ],
  },
  conflicto: {
    title: "Política de conflicto de intereses",
    description: "Política de conflicto de intereses de Fundación Venezuela Nueva Esperanza LLC.",
    blocks: [
      {
        paragraphs: [
          "Fundación Venezuela Nueva Esperanza LLC exige que directores, funcionarios, gerentes y personal clave actúen en el mejor interés de la Organización y eviten situaciones que puedan generar un conflicto de intereses.",
        ],
      },
      {
        heading: "1. Definición",
        paragraphs: [
          "Existe un conflicto de intereses cuando los intereses personales, financieros o comerciales de una persona pueden influir de manera indebida en sus decisiones en nombre de la Organización.",
        ],
      },
      {
        heading: "2. Divulgación",
        paragraphs: ["Quienes toman decisiones deben revelar cualquier conflicto real o potencial, incluyendo:"],
        list: ["Intereses financieros", "Relaciones familiares o personales", "Actividades comerciales externas"],
      },
      {
        heading: "3. Gestión",
        paragraphs: ["Cuando se identifica un conflicto:"],
        list: [
          "La persona involucrada se abstiene de la discusión y de la decisión relacionada",
          "El conflicto se revisa y se documenta",
          "La decisión se toma en el mejor interés de la Organización",
        ],
      },
      {
        heading: "4. Cumplimiento",
        paragraphs: [
          "El incumplimiento puede dar lugar a medidas correctivas, incluida la remoción de la autoridad de decisión.",
          "Esta política sostiene la transparencia, la rendición de cuentas y la gobernanza ética del propósito social de la Organización.",
          "Última actualización: 2026.",
        ],
      },
    ],
  },
  "no-discriminacion": {
    title: "Política de no discriminación",
    description: "Política de no discriminación de Fundación Venezuela Nueva Esperanza LLC.",
    blocks: [
      {
        paragraphs: [
          "Fundación Venezuela Nueva Esperanza LLC se compromete a un entorno inclusivo, respetuoso y equitativo en sus actividades, programas, servicios y operaciones.",
          "La Organización no discrimina por raza, color, origen nacional, etnia, género, identidad de género, orientación sexual, religión, edad, discapacidad, estado civil, condición de veterano u otra característica protegida por la ley aplicable.",
        ],
      },
      {
        heading: "Ámbito",
        paragraphs: ["Esta política se aplica, entre otros, a:"],
        list: [
          "Empleo y contratación",
          "Prestación de servicios",
          "Alianzas y colaboraciones",
          "Participación en programas",
          "Gobernanza organizacional",
        ],
      },
      {
        paragraphs: [
          "Las decisiones se toman según el mérito, las calificaciones y la alineación con la misión y el propósito social de la Organización.",
          "Última actualización: 2026.",
        ],
      },
    ],
  },
};

export const legalLinks: { to: string; label: string; slug: LegalSlug }[] = [
  { to: "/legal/privacidad", label: "Política de privacidad", slug: "privacidad" },
  { to: "/legal/terminos", label: "Términos y condiciones", slug: "terminos" },
  { to: "/legal/conflicto", label: "Conflicto de intereses", slug: "conflicto" },
  { to: "/legal/no-discriminacion", label: "No discriminación", slug: "no-discriminacion" },
];
