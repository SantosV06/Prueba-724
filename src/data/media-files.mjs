// Original Foundation-VNE filenames; upload them unchanged to public/assets/img/.
export const mediaFiles = {
  "logo": "LogoFundaciónVNE1.png",
  "genesisLogo": "LogoProyGén1.png",
  "homeVideo": "Videos para la pagina. principal VNE Foundation.mp4",
  "aboutVideo": "segunda pagina.mp4",
  "houses": "imagencasas.png",
  "housesVideo": "Modelos casa VNE video.mp4",
  "primaryVideo": "sector primario.mp4",
  "secondaryVideo": "sector secundario.mp4",
  "tertiaryVideo": "sector terciario.mp4",
  "ceo": "FotoCEO.png",
  "director": "FotoCEO_1.png",
  "coordinator": "FotoSolorzano.png",
  "scalability": "Escalabilidad.png",
  "impact": "ProgramImpact.png",
  "genesisPdf": "ProyectoGénesis.pdf"
};

/** @param {string} key @param {string} filename */
export const publicMediaPath = (key, filename) =>
  `/media/${key}${filename.slice(filename.lastIndexOf("."))}`;
