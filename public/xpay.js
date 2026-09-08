(function () {
  if (window.XPayments) return;

  var CHECKOUT_ORIGIN = "https://checkout.xpayments.digital";
  var active = null;

  function close(reason) {
    if (!active) return;
    var current = active;
    active = null;
    window.removeEventListener("message", current.onMessage);
    window.removeEventListener("keydown", current.onKeyDown);
    if (current.overlay && current.overlay.parentNode) {
      current.overlay.parentNode.removeChild(current.overlay);
    }
    document.documentElement.style.overflow = current.previousOverflow;
    if (reason === "SUCCESS" && typeof current.onSuccess === "function") {
      current.onSuccess();
    }
    if (reason !== "SUCCESS" && typeof current.onClose === "function") {
      current.onClose(reason || "CLOSED");
    }
  }

  function open(options) {
    options = options || {};
    if (!options.sessionId) throw new Error("XPayments.open requires sessionId");
    if (active) close("REPLACED");

    var previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    var overlay = document.createElement("div");
    overlay.setAttribute("data-xpayments-overlay", "1");
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:2147483647",
      "background:rgba(2,6,23,.62)",
      "backdrop-filter:blur(10px)",
      "-webkit-backdrop-filter:blur(10px)",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left))",
      "animation:xpayments-overlay-in .16s ease-out"
    ].join(";");

    var shell = document.createElement("div");
    shell.setAttribute("role", "dialog");
    shell.setAttribute("aria-modal", "true");
    shell.style.cssText = [
      "position:relative",
      "width:min(100%,600px)",
      "height:min(94dvh,860px)",
      "background:#fff",
      "border-radius:26px",
      "overflow:hidden",
      "box-shadow:0 32px 110px rgba(2,6,23,.42)",
      "border:1px solid rgba(255,255,255,.24)",
      "transform:translateZ(0)",
      "animation:xpayments-shell-in .18s cubic-bezier(.2,.8,.2,1)"
    ].join(";");

    var loader = document.createElement("div");
    loader.setAttribute("data-xpayments-loader", "1");
    loader.style.cssText = [
      "position:absolute",
      "inset:0",
      "display:flex",
      "flex-direction:column",
      "align-items:center",
      "justify-content:center",
      "gap:14px",
      "background:linear-gradient(180deg,#fff,#f8fafc)",
      "font:500 13px/1.4 system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",
      "color:#64748b",
      "transition:opacity .16s ease",
      "z-index:1"
    ].join(";");

    var shield = document.createElement("div");
    shield.textContent = "XP";
    shield.style.cssText = [
      "width:44px",
      "height:44px",
      "border-radius:14px",
      "display:grid",
      "place-items:center",
      "background:#0f172a",
      "color:#fff",
      "font:700 12px/1 system-ui,sans-serif",
      "letter-spacing:-.02em",
      "box-shadow:0 12px 30px rgba(15,23,42,.18)"
    ].join(";");

    var loaderText = document.createElement("span");
    loaderText.textContent = options.loadingText || "A abrir pagamento seguro…";

    var loaderSub = document.createElement("span");
    loaderSub.textContent = "Ligação protegida pela XPayments";
    loaderSub.style.cssText = "font-size:11px;color:#94a3b8";

    loader.appendChild(shield);
    loader.appendChild(loaderText);
    loader.appendChild(loaderSub);

    var iframe = document.createElement("iframe");
    var params = new URLSearchParams();
    params.set("embedded", "1");
    params.set("parent_origin", window.location.origin);
    if (options.theme === "dark" || options.theme === "light") params.set("theme", options.theme);
    iframe.src = CHECKOUT_ORIGIN + "/pay/" + encodeURIComponent(options.sessionId) + "?" + params.toString();
    iframe.title = options.title || "XPayments Checkout";
    iframe.allow = "payment *";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.style.cssText = [
      "width:100%",
      "height:100%",
      "border:0",
      "background:transparent",
      "display:block",
      "opacity:0",
      "transition:opacity .16s ease"
    ].join(";");

    function reveal() {
      iframe.style.opacity = "1";
      loader.style.opacity = "0";
      window.setTimeout(function () {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 180);
    }

    iframe.onload = reveal;

    var closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Fechar checkout");
    closeButton.innerHTML = "&#215;";
    closeButton.style.cssText = [
      "position:absolute",
      "top:11px",
      "right:11px",
      "z-index:4",
      "width:36px",
      "height:36px",
      "border-radius:999px",
      "border:1px solid rgba(15,23,42,.10)",
      "background:rgba(255,255,255,.94)",
      "color:#0f172a",
      "font:500 24px/30px system-ui,sans-serif",
      "cursor:pointer",
      "box-shadow:0 4px 18px rgba(15,23,42,.10)"
    ].join(";");

    closeButton.onclick = function () { close("CLOSED"); };
    overlay.onclick = function (event) {
      if (event.target === overlay && options.closeOnBackdrop !== false) close("CLOSED");
    };

    function onKeyDown(event) {
      if (event.key === "Escape" && options.closeOnEscape !== false) close("CLOSED");
    }

    function onMessage(event) {
      if (event.origin !== CHECKOUT_ORIGIN) return;
      if (event.source !== iframe.contentWindow) return;
      var data = event.data || {};

      if (data.type === "XPAYMENTS_READY") {
        reveal();
        if (typeof options.onReady === "function") options.onReady();
        return;
      }

      if (data.type !== "XPAYMENTS_STATUS") return;
      if (["SUCCESS", "CLOSED", "CANCELLED"].indexOf(data.status) === -1) return;
      close(data.status);
    }

    var style = document.getElementById("xpayments-sdk-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "xpayments-sdk-style";
      style.textContent = [
        "@keyframes xpayments-overlay-in{from{opacity:0}to{opacity:1}}",
        "@keyframes xpayments-shell-in{from{opacity:.7;transform:translateY(8px) scale(.992)}to{opacity:1;transform:translateY(0) scale(1)}}",
        "@media(max-width:640px){[data-xpayments-overlay=\"1\"]{padding:0!important;align-items:flex-end!important}[data-xpayments-overlay=\"1\"]>div{width:100%!important;height:100dvh!important;max-height:none!important;border-radius:0!important}}"
      ].join("");
      document.head.appendChild(style);
    }

    shell.appendChild(loader);
    shell.appendChild(iframe);
    shell.appendChild(closeButton);
    overlay.appendChild(shell);
    document.body.appendChild(overlay);

    active = {
      overlay: overlay,
      iframe: iframe,
      onMessage: onMessage,
      onKeyDown: onKeyDown,
      previousOverflow: previousOverflow,
      onSuccess: options.onSuccess,
      onClose: options.onClose
    };

    window.addEventListener("message", onMessage);
    window.addEventListener("keydown", onKeyDown);

    return {
      close: function () { close("CLOSED"); }
    };
  }

  window.XPayments = {
    open: open,
    close: function () { close("CLOSED"); },
    version: "1.1.0"
  };
})();
