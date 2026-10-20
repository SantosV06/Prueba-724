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
  infoWa: "https://wa.me/50767968800",
  webWa: "https://wa.me/50769799261",
  instagram: "https://www.instagram.com/foundation.vne",
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
      "Política de privacidad de Fundación Venezuela Nueva Esperanza LLC (VNE).",
    blocks: [
      {
        paragraphs: [
          "Fundación Venezuela Nueva Esperanza LLC (“la Organización”, “nosotros” o “nos”) protege la privacidad y la información personal de quienes visitan este sitio o se comunican por canales digitales o físicos.",
        ],
      },
      {
        heading: "1. Información que recopilamos",
        paragraphs: ["Podemos recopilar información personal que incluye, entre otros datos:"],
        list: [
          "Nombre",
          "Dirección de correo electrónico",
          "Número de teléfono",
          "Dirección postal",
          "Información de pago o facturación, cuando aplica",
          "Información que usted envía en formularios, consultas o comunicaciones",
        ],
      },
      {
        paragraphs: [
          "También podemos recopilar información no personal, como el tipo de navegador, la dirección IP y datos de uso del sitio, con fines analíticos y operativos.",
        ],
      },
      {
        heading: "2. Uso de la información",
        paragraphs: ["La información recopilada se utiliza exclusivamente para:"],
        list: [
          "Responder consultas",
          "Proporcionar información sobre programas y servicios",
          "Procesar donaciones o facturas cuando corresponda",
          "Mejorar la operación y la comunicación de la organización",
          "Cumplir obligaciones legales y regulatorias",
        ],
      },
      {
        paragraphs: ["No vendemos, alquilamos ni compartimos información personal con terceros con fines comerciales."],
      },
      {
        heading: "3. Protección de datos",
        paragraphs: [
          "Aplicamos medidas administrativas y técnicas razonables para proteger la información personal contra acceso no autorizado, divulgación o uso indebido.",
        ],
      },
      {
        heading: "4. Servicios de terceros",
        paragraphs: [
          "El sitio o las comunicaciones pueden usar plataformas de terceros, como Zelle, WhatsApp o el servicio de alojamiento. No somos responsables de las prácticas de privacidad de esos servicios.",
        ],
      },
      {
        heading: "5. Derechos de la persona",
        paragraphs: [
          "Puede solicitar acceso, corrección o eliminación de su información personal escribiendo a info@foundationvne.com.",
        ],
      },
      {
        heading: "6. Actualizaciones",
        paragraphs: [
          "Esta política puede actualizarse. El uso continuo del sitio implica la aceptación de los cambios publicados aquí.",
          "Última actualización: 2026.",
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
