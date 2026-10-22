export type Volunteer = {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  mensaje: string;
  fecha: string;
};

export function volunteersToCsv(rows: (Volunteer & { status?: string })[]) {
  const header = ["fecha", "nombre", "apellido", "correo", "telefono", "mensaje", "estado"];
  // Quoting alone does not stop spreadsheet formulas. Force dangerous cells to text.
  const escape = (value: string) => {
    // eslint-disable-next-line no-control-regex -- ignore leading spreadsheet control characters
    const safe = /^[\s\u0000-\u001f]*[=+@-]/u.test(value) ? `\t${value}` : value;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const lines = rows.map((row) =>
    [
      row.fecha,
      row.nombre,
      row.apellido,
      row.correo,
      row.telefono,
      row.mensaje,
      row.status ?? "pendiente",
    ]
      .map(escape)
      .join(","),
  );
  return [header.join(","), ...lines].join("\r\n");
}
