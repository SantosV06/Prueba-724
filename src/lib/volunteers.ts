export type Volunteer = {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  mensaje: string;
  fecha: string;
};

const KEY = "vne-voluntarios-v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function listVolunteers(): Volunteer[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Volunteer[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveVolunteer(entry: Omit<Volunteer, "id" | "fecha">): Volunteer {
  const next: Volunteer = {
    ...entry,
    id: crypto.randomUUID(),
    fecha: new Date().toISOString(),
  };
  const all = [next, ...listVolunteers()];
  localStorage.setItem(KEY, JSON.stringify(all));
  return next;
}

export function removeVolunteer(id: string) {
  const all = listVolunteers().filter((item) => item.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
  return all;
}

export function clearVolunteers() {
  localStorage.removeItem(KEY);
}

export function volunteersToCsv(rows: Volunteer[]) {
  const header = ["fecha", "nombre", "apellido", "correo", "telefono", "mensaje"];
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const lines = rows.map((row) =>
    [row.fecha, row.nombre, row.apellido, row.correo, row.telefono, row.mensaje].map(escape).join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

export function mailtoFor(entry: Pick<Volunteer, "nombre" | "apellido" | "correo" | "telefono" | "mensaje">) {
  const subject = encodeURIComponent(`Voluntariado VNE — ${entry.nombre} ${entry.apellido}`);
  const body = encodeURIComponent(
    `Nombre: ${entry.nombre} ${entry.apellido}\nCorreo: ${entry.correo}\nTeléfono: ${entry.telefono}\n\n${entry.mensaje}`,
  );
  return `mailto:info@foundationvne.com?subject=${subject}&body=${body}`;
}
