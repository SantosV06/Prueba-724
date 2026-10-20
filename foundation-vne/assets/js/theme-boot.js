try {
  if (localStorage.getItem("vne-theme") === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }
} catch (e) {
  /* storage unavailable */
}
