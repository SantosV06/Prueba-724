(function () {
  const html = document.documentElement;
  const menu = document.getElementById("menu");
  const backdrop = document.getElementById("backdrop");
  const openBtn = document.getElementById("menu-open");
  const closeBtn = document.getElementById("menu-close");
  const themeBtn = document.getElementById("theme-toggle");

  function setTheme(next) {
    if (next === "dark") html.setAttribute("data-theme", "dark");
    else html.removeAttribute("data-theme");
    try {
      localStorage.setItem("vne-theme", next);
    } catch (e) {
      /* ignore */
    }
    if (themeBtn) {
      const dark = next === "dark";
      themeBtn.setAttribute("aria-label", dark ? "Usar tema claro" : "Usar tema oscuro");
      themeBtn.textContent = "◐";
    }
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      setTheme(html.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
    setTheme(html.getAttribute("data-theme") === "dark" ? "dark" : "light");
  }

  function setMenu(open) {
    if (!menu || !backdrop || !openBtn) return;
    menu.hidden = !open;
    backdrop.hidden = !open;
    menu.classList.toggle("open", open);
    openBtn.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      const first = menu.querySelector("a, button");
      if (first) first.focus();
    }
  }

  if (openBtn) openBtn.addEventListener("click", function () { setMenu(true); });
  if (closeBtn) closeBtn.addEventListener("click", function () { setMenu(false); openBtn.focus(); });
  if (backdrop) backdrop.addEventListener("click", function () { setMenu(false); });
  if (menu) {
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setMenu(false); });
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setMenu(false);
  });

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.querySelectorAll(".fade").forEach(function (el) { el.classList.add("show"); });

  const heroVideo = document.querySelector(".hero video");
  const heroFallback = document.getElementById("hero-fallback");
  if (heroVideo && heroFallback) {
    const showHeroFallback = function () {
      heroFallback.classList.add("show");
      heroVideo.remove();
    };
    heroVideo.addEventListener("error", showHeroFallback);
    heroVideo.querySelectorAll("source").forEach(function (source) {
      source.addEventListener("error", showHeroFallback);
    });
  }

  document.querySelectorAll("[data-media]").forEach(function (frame) {
    const media = frame.querySelector("img, video");
    if (!media) {
      frame.classList.add("is-fallback");
      return;
    }
    const fail = function () { frame.classList.add("is-fallback"); };
    media.addEventListener("error", fail);
    if (media.tagName === "IMG" && media.complete && media.naturalWidth === 0) fail();
    if (media.tagName === "VIDEO") {
      media.addEventListener("error", fail, true);
      if (motion.matches) media.removeAttribute("autoplay");
    }
  });

  const brand = document.querySelector(".brand img");
  if (brand) {
    const fallback = document.querySelector(".brand-fallback");
    const hide = function () {
      brand.hidden = true;
      if (fallback) fallback.classList.add("show");
    };
    brand.addEventListener("error", hide);
    if (brand.complete && brand.naturalWidth === 0) hide();
  }

  document.querySelectorAll(".footer-logo").forEach(function (img) {
    img.addEventListener("error", function () { img.classList.add("is-fallback"); });
  });

  const form = document.getElementById("voluntariado-form");
  if (form) {
    const status = document.getElementById("form-status");
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      const data = {
        nombre: form.nombre.value.trim(),
        apellido: form.apellido.value.trim(),
        correo: form.correo.value.trim(),
        telefono: form.telefono.value.trim(),
        website: form.website ? form.website.value.trim() : "",
      };
      if (!data.nombre || !data.apellido || !data.correo || !data.telefono) {
        setStatus("Completa todos los campos.", true);
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo)) {
        setStatus("El correo no tiene un formato válido.", true);
        return;
      }
      if (!/^\+?[0-9()\-\s]{8,20}$/.test(data.telefono)) {
        setStatus("Incluye un teléfono válido, con código de país. Ejemplo: +1 917 597 9179.", true);
        return;
      }
      setStatus("Enviando…", false);
      try {
        const response = await fetch("/api/voluntariado", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const mailto = buildMailto(data);
          setStatus("No se pudo guardar en el servidor. Puedes enviarla por correo.", true);
          const link = document.getElementById("mailto-fallback");
          if (link) {
            link.href = mailto;
            link.hidden = false;
          }
          return;
        }
        form.reset();
        setStatus("Solicitud enviada. El equipo de Fundación VNE la revisará.", false);
        status.classList.add("ok");
      } catch (error) {
        setStatus("Sin conexión con el servidor. Inténtalo de nuevo o escribe a info@foundationvne.com.", true);
      }
    });

    function setStatus(message, isError) {
      status.textContent = message;
      status.classList.toggle("err", isError);
      status.classList.toggle("ok", !isError && message.indexOf("enviada") !== -1);
    }
  }

  function buildMailto(data) {
    const subject = encodeURIComponent("Voluntariado Fundación VNE — " + data.nombre + " " + data.apellido);
    const body = encodeURIComponent(
      "Nombre: " + data.nombre + " " + data.apellido + "\nCorreo: " + data.correo + "\nTeléfono: " + data.telefono
    );
    return "mailto:info@foundationvne.com?subject=" + subject + "&body=" + body;
  }

  const login = document.getElementById("login-form");
  if (login) {
    const status = document.getElementById("form-status");
    login.addEventListener("submit", async function (event) {
      event.preventDefault();
      status.textContent = "Verificando…";
      status.classList.remove("err");
      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: login.password.value }),
        });
        if (!response.ok) {
          status.textContent = response.status === 503
            ? "El acceso no está configurado en el servidor."
            : "Contraseña incorrecta.";
          status.classList.add("err");
          return;
        }
        window.location.href = "panel.html";
      } catch (error) {
        status.textContent = "No hay conexión con el servidor de administración.";
        status.classList.add("err");
      }
    });
  }

  const table = document.getElementById("tabla");
  if (table) {
    const body = document.getElementById("tabla-body");
    const status = document.getElementById("form-status");
    fetch("/api/get-voluntarios", { headers: { Accept: "application/json" } })
      .then(async function (response) {
        if (response.status === 401) {
          window.location.href = "login.html";
          return;
        }
        if (!response.ok) throw new Error("bad");
        const rows = await response.json();
        body.textContent = "";
        if (!Array.isArray(rows) || rows.length === 0) {
          status.textContent = "No hay solicitudes registradas.";
          return;
        }
        status.textContent = rows.length + (rows.length === 1 ? " solicitud." : " solicitudes.");
        rows.forEach(function (row) {
          const tr = document.createElement("tr");
          [row.id, row.nombre, row.apellido, row.correo, row.telefono, row.fecha || "—"].forEach(function (value) {
            const td = document.createElement("td");
            td.textContent = value == null ? "" : String(value);
            tr.appendChild(td);
          });
          body.appendChild(tr);
        });
      })
      .catch(function () {
        status.textContent = "No se pudieron cargar las solicitudes.";
        status.classList.add("err");
      });

    const logout = document.getElementById("logout");
    if (logout) {
      logout.addEventListener("click", async function () {
        await fetch("/api/logout", { method: "POST" });
        window.location.href = "login.html";
      });
    }
  }
})();
