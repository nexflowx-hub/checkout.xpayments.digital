(function () {
  if (window.XPayments) return;

  var CHECKOUT_ORIGIN = "https://checkout.xpayments.digital";
  var active = null;

  function close(reason) {
    if (!active) return;
    var current = active;
    active = null;
    window.removeEventListener("message", current.onMessage);
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
      "background:rgba(3,7,18,.58)",
      "backdrop-filter:blur(8px)",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:16px"
    ].join(";");

    var shell = document.createElement("div");
    shell.style.cssText = [
      "position:relative",
      "width:min(100%,560px)",
      "height:min(92vh,820px)",
      "background:#fff",
      "border-radius:24px",
      "overflow:hidden",
      "box-shadow:0 28px 90px rgba(0,0,0,.35)",
      "border:1px solid rgba(255,255,255,.18)"
    ].join(";");

    var iframe = document.createElement("iframe");
    var params = new URLSearchParams();
    params.set("parent_origin", window.location.origin);
    if (options.theme === "dark" || options.theme === "light") params.set("theme", options.theme);
    iframe.src = CHECKOUT_ORIGIN + "/embed/" + encodeURIComponent(options.sessionId) + "?" + params.toString();
    iframe.title = options.title || "XPayments Checkout";
    iframe.allow = "payment *";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.style.cssText = "width:100%;height:100%;border:0;background:transparent;display:block";

    var closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Close checkout");
    closeButton.innerHTML = "&#215;";
    closeButton.style.cssText = [
      "position:absolute",
      "top:10px",
      "right:10px",
      "z-index:3",
      "width:34px",
      "height:34px",
      "border-radius:999px",
      "border:1px solid rgba(15,23,42,.12)",
      "background:rgba(255,255,255,.92)",
      "color:#111827",
      "font:500 24px/30px system-ui,sans-serif",
      "cursor:pointer",
      "box-shadow:0 4px 18px rgba(0,0,0,.10)"
    ].join(";");

    closeButton.onclick = function () { close("CLOSED"); };
    overlay.onclick = function (event) {
      if (event.target === overlay && options.closeOnBackdrop !== false) close("CLOSED");
    };

    shell.appendChild(iframe);
    shell.appendChild(closeButton);
    overlay.appendChild(shell);
    document.body.appendChild(overlay);

    function onMessage(event) {
      if (event.origin !== CHECKOUT_ORIGIN) return;
      var data = event.data || {};
      if (data.type !== "XPAYMENTS_STATUS") return;
      if (["SUCCESS", "CLOSED", "CANCELLED"].indexOf(data.status) === -1) return;
      close(data.status);
    }

    active = {
      overlay: overlay,
      iframe: iframe,
      onMessage: onMessage,
      previousOverflow: previousOverflow,
      onSuccess: options.onSuccess,
      onClose: options.onClose
    };

    window.addEventListener("message", onMessage);
    return {
      close: function () { close("CLOSED"); }
    };
  }

  window.XPayments = {
    open: open,
    close: function () { close("CLOSED"); },
    version: "1.0.0"
  };
})();
