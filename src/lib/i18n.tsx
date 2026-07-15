"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

// ── Supported Locales ──

export type Locale = "pt" | "en" | "es" | "fr";

export const LOCALE_NAMES: Record<Locale, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
  fr: "Français",
};

// ── Translation Keys ──

const translations: Record<Locale, Record<string, string>> = {
  pt: {
    // Header
    "header.secure": "Checkout Seguro",
    "header.close": "Fechar",

    // Order Block (Block A)
    "block.order.title": "Resumo do Pedido",
    "block.order.reference": "Referência",
    "block.order.amount": "Total a Pagar",
    "block.order.secureBadge": "Pagamento seguro e encriptado",

    // Customer Block (Block B)
    "block.customer.title": "Dados do Pagador",
    "block.customer.subtitle": "Nome e email para confirmação.",
    "block.customer.name": "Nome Completo",
    "block.customer.namePlaceholder": "João Silva",
    "block.customer.nameRequired": "Nome é obrigatório",
    "block.customer.nameMin": "Mínimo 2 caracteres",
    "block.customer.email": "Email",
    "block.customer.emailPlaceholder": "joao@email.com",
    "block.customer.emailRequired": "Email é obrigatório",
    "block.customer.emailInvalid": "Email inválido",
    "block.customer.phone": "Telemóvel",
    "block.customer.phonePlaceholder": "+351 912 345 678",
    "block.customer.address": "Morada",
    "block.customer.addressPlaceholder": "Rua, número",
    "block.customer.city": "Cidade",
    "block.customer.cityPlaceholder": "Lisboa",
    "block.customer.postalCode": "Código Postal",
    "block.customer.postalCodePlaceholder": "1000-001",
    "block.customer.country": "País",
    "block.customer.company": "Empresa",
    "block.customer.companyPlaceholder": "Nome da empresa",
    "block.customer.vatId": "NIF / VAT",
    "block.customer.vatIdPlaceholder": "123456789",
    "block.customer.addDetails": "Adicionar mais detalhes",

    // Payment Wall (Block C)
    "block.payment.title": "Método de Pagamento",
    "block.payment.disabledHint": "Preencha os dados acima para ativar os métodos",
    "block.payment.cardBrands": "Aceita Visa, Mastercard e American Express",

    // Payment Methods
    "method.card": "Cartão",
    "method.mbway": "MB WAY",
    "method.bizum": "Bizum",
    "method.multibanco": "Multibanco",
    "method.pix": "PIX",
    "method.usdt": "USDT",
    "method.applePay": "Apple Pay",
    "method.googlePay": "Google Pay",
    "method.comingSoon": "Em breve",

    // Card Payment
    "card.payNow": "Pagar",
    "card.payNowAmount": "Pagar {amount}",
    "card.processing": "A processar pagamento...",
    "card.encrypted": "Pagamento seguro com encriptação de ponta a ponta",
    "card.keyMissing": "Método de Pagamento",
    "card.keyMissingDesc": "A configuração do método de pagamento não está disponível.",
    "card.crashTitle": "Aguardando configuração",
    "card.crashDesc": "Não foi possível inicializar o pagamento.\nTente novamente mais tarde.",

    // Phone Payment (MBWAY / Bizum)
    "phone.title": "Número de Telemóvel",
    "phone.placeholder": "+351 912 345 678",
    "phone.placeholder.es": "+34 612 345 678",
    "phone.required": "Número de telemóvel é obrigatório",
    "phone.invalid": "Número de telemóvel inválido",
    "phone.countryMismatch": "Número de telemóvel inválido para este método",
    "phone.submit": "Confirmar Pagamento",
    "phone.submitting": "A submeter...",
    "phone.waitingTitle": "A aguardar aprovação",
    "phone.waitingDesc": "Abra a app e confirme o pagamento.",
    "phone.waitingHint": "Não feche esta janela. Será redirecionado automaticamente.",

    // PIX
    "pix.scanTitle": "Escaneie o QR Code",
    "pix.scanSubtitle": "Abra o app do seu banco e escaneie",
    "pix.expired": "Expirado",
    "pix.copyTitle": "Código PIX Copia e Cola",
    "pix.copy": "Copiar",
    "pix.copied": "Copiado!",
    "pix.generateNew": "Gerar novo QR Code",
    "pix.autoRefresh": "Após o pagamento, a página será atualizada automaticamente.",
    "pix.qrExpired": "QR Expirado",

    // Multibanco
    "multibanco.title": "Dados para Pagamento Multibanco",
    "multibanco.entity": "Entidade",
    "multibanco.reference": "Referência",
    "multibanco.amount": "Montante",
    "multibanco.copyEntity": "Copiar Entidade",
    "multibanco.copyRef": "Copiar Referência",
    "multibanco.copyAmount": "Copiar Montante",
    "multibanco.copied": "Copiado!",
    "multibanco.hint": "Pague na sua banca próxima ou via homebanking.",
    "multibanco.close": "Fechar Checkout",

    // Status Screens
    "status.loading": "A carregar checkout...",
    "status.processing": "A processar pagamento",
    "status.processingDesc": "Por favor aguarde enquanto confirmamos o seu pagamento.",
    "status.awaiting": "Aguardando confirmação",
    "status.expiredTitle": "Sessão Expirada",
    "status.expiredDesc": "O tempo limite desta sessão de pagamento foi atingido.",
    "status.newSession": "Criar Nova Sessão",
    "status.cancelledTitle": "Pagamento Cancelado",
    "status.cancelledDesc": "O pagamento foi cancelado.",

    // Success
    "success.title": "Pagamento Confirmado!",
    "success.thanks": "Obrigado pela sua compra em",
    "success.email": "Enviámos um email de confirmação com os detalhes do pedido.",
    "success.closeWindow": "Pode fechar esta janela",
    "success.closeDesc": "A transação foi concluída com segurança.",
    "success.redirecting": "Redirecionando em {s} segundos...",
    "success.returnToMerchant": "Voltar à Loja",

    // Initiate
    "initiate.processing": "A preparar método de pagamento...",

    // Error
    "error.title": "Ops!",
    "error.notFound": "Link não encontrado",
    "error.loadFailed": "Não foi possível carregar o link de pagamento.",
    "error.serverError": "Erro de ligação ao servidor. Tente novamente.",
    "error.initiateFailed": "Não foi possível iniciar o pagamento. Tente novamente.",
    "error.tryAgain": "Tentar novamente",
    "error.paymentFailed": "Pagamento Falhou",
    "error.paymentFailedDesc": "O pagamento não pôde ser processado. Tente novamente com outro método.",

    // Footer
    "footer.poweredBy": "",
    "footer.xpayments": "",
    "footer.secure": "Pagamento Seguro",

    // Session
    "session.expiresIn": "Expira em {time}",
    "session.expired": "Expirado",
  },
  en: {
    // Header
    "header.secure": "Secure Checkout",
    "header.close": "Close",

    // Order Block (Block A)
    "block.order.title": "Order Summary",
    "block.order.reference": "Reference",
    "block.order.amount": "Total to Pay",
    "block.order.secureBadge": "Secure encrypted payment",

    // Customer Block (Block B)
    "block.customer.title": "Customer Details",
    "block.customer.subtitle": "Name and email for confirmation.",
    "block.customer.name": "Full Name",
    "block.customer.namePlaceholder": "John Smith",
    "block.customer.nameRequired": "Name is required",
    "block.customer.nameMin": "Minimum 2 characters",
    "block.customer.email": "Email",
    "block.customer.emailPlaceholder": "john@email.com",
    "block.customer.emailRequired": "Email is required",
    "block.customer.emailInvalid": "Invalid email",
    "block.customer.phone": "Phone",
    "block.customer.phonePlaceholder": "+351 912 345 678",
    "block.customer.address": "Address",
    "block.customer.addressPlaceholder": "Street, number",
    "block.customer.city": "City",
    "block.customer.cityPlaceholder": "London",
    "block.customer.postalCode": "Postal Code",
    "block.customer.postalCodePlaceholder": "W1A 1AA",
    "block.customer.country": "Country",
    "block.customer.company": "Company",
    "block.customer.companyPlaceholder": "Company name",
    "block.customer.vatId": "VAT / Tax ID",
    "block.customer.vatIdPlaceholder": "123456789",
    "block.customer.addDetails": "Add more details",

    // Payment Wall (Block C)
    "block.payment.title": "Payment Method",
    "block.payment.disabledHint": "Fill in the details above to activate payment methods",
    "block.payment.cardBrands": "Accepts Visa, Mastercard and American Express",

    // Payment Methods
    "method.card": "Card",
    "method.mbway": "MB WAY",
    "method.bizum": "Bizum",
    "method.multibanco": "Multibanco",
    "method.pix": "PIX",
    "method.usdt": "USDT",
    "method.applePay": "Apple Pay",
    "method.googlePay": "Google Pay",
    "method.comingSoon": "Coming soon",

    // Card Payment
    "card.payNow": "Pay",
    "card.payNowAmount": "Pay {amount}",
    "card.processing": "Processing payment...",
    "card.encrypted": "Secure payment with end-to-end encryption",
    "card.keyMissing": "Payment Method",
    "card.keyMissingDesc": "Payment method configuration is not available.",
    "card.crashTitle": "Waiting for configuration",
    "card.crashDesc": "Could not initialize the payment.\nPlease try again later.",

    // Phone Payment (MBWAY / Bizum)
    "phone.title": "Phone Number",
    "phone.placeholder": "+351 912 345 678",
    "phone.placeholder.es": "+34 612 345 678",
    "phone.required": "Phone number is required",
    "phone.invalid": "Invalid phone number",
    "phone.countryMismatch": "Invalid phone number for this payment method",
    "phone.submit": "Confirm Payment",
    "phone.submitting": "Submitting...",
    "phone.waitingTitle": "Waiting for approval",
    "phone.waitingDesc": "Open the app and confirm the payment.",
    "phone.waitingHint": "Do not close this window. You will be redirected automatically.",

    // PIX
    "pix.scanTitle": "Scan the QR Code",
    "pix.scanSubtitle": "Open your bank app and scan",
    "pix.expired": "Expired",
    "pix.copyTitle": "PIX Copy and Paste Code",
    "pix.copy": "Copy",
    "pix.copied": "Copied!",
    "pix.generateNew": "Generate new QR Code",
    "pix.autoRefresh": "After payment, the page will refresh automatically.",
    "pix.qrExpired": "QR Expired",

    // Multibanco
    "multibanco.title": "Multibanco Payment Details",
    "multibanco.entity": "Entity",
    "multibanco.reference": "Reference",
    "multibanco.amount": "Amount",
    "multibanco.copyEntity": "Copy Entity",
    "multibanco.copyRef": "Copy Reference",
    "multibanco.copyAmount": "Copy Amount",
    "multibanco.copied": "Copied!",
    "multibanco.hint": "Pay at your nearest ATM or via homebanking.",
    "multibanco.close": "Close Checkout",

    // Status Screens
    "status.loading": "Loading checkout...",
    "status.processing": "Processing payment",
    "status.processingDesc": "Please wait while we confirm your payment.",
    "status.awaiting": "Awaiting confirmation",
    "status.expiredTitle": "Session Expired",
    "status.expiredDesc": "The time limit for this payment session has been reached.",
    "status.newSession": "Create New Session",
    "status.cancelledTitle": "Payment Cancelled",
    "status.cancelledDesc": "The payment has been cancelled.",

    // Success
    "success.title": "Payment Confirmed!",
    "success.thanks": "Thank you for your purchase at",
    "success.email": "We sent a confirmation email with the order details.",
    "success.closeWindow": "You can close this window",
    "success.closeDesc": "The transaction has been completed safely.",
    "success.redirecting": "Redirecting in {s} seconds...",
    "success.returnToMerchant": "Return to Store",

    // Initiate
    "initiate.processing": "Preparing payment method...",

    // Error
    "error.title": "Oops!",
    "error.notFound": "Link not found",
    "error.loadFailed": "Could not load the payment link.",
    "error.serverError": "Server connection error. Please try again.",
    "error.initiateFailed": "Could not initiate the payment. Please try again.",
    "error.tryAgain": "Try again",
    "error.paymentFailed": "Payment Failed",
    "error.paymentFailedDesc": "The payment could not be processed. Please try another method.",

    // Footer
    "footer.poweredBy": "",
    "footer.xpayments": "",
    "footer.secure": "Secure Payment",

    // Session
    "session.expiresIn": "Expires in {time}",
    "session.expired": "Expired",
  },
  es: {
    // Header
    "header.secure": "Checkout Seguro",
    "header.close": "Cerrar",

    // Order Block (Block A)
    "block.order.title": "Resumen del Pedido",
    "block.order.reference": "Referencia",
    "block.order.amount": "Total a Pagar",
    "block.order.secureBadge": "Pago seguro con encriptación",

    // Customer Block (Block B)
    "block.customer.title": "Datos del Pagador",
    "block.customer.subtitle": "Nombre y email para confirmación.",
    "block.customer.name": "Nombre Completo",
    "block.customer.namePlaceholder": "Juan García",
    "block.customer.nameRequired": "El nombre es obligatorio",
    "block.customer.nameMin": "Mínimo 2 caracteres",
    "block.customer.email": "Email",
    "block.customer.emailPlaceholder": "juan@email.com",
    "block.customer.emailRequired": "El email es obligatorio",
    "block.customer.emailInvalid": "Email inválido",
    "block.customer.phone": "Teléfono",
    "block.customer.phonePlaceholder": "+34 612 345 678",
    "block.customer.address": "Dirección",
    "block.customer.addressPlaceholder": "Calle, número",
    "block.customer.city": "Ciudad",
    "block.customer.cityPlaceholder": "Madrid",
    "block.customer.postalCode": "Código Postal",
    "block.customer.postalCodePlaceholder": "28001",
    "block.customer.country": "País",
    "block.customer.company": "Empresa",
    "block.customer.companyPlaceholder": "Nombre de la empresa",
    "block.customer.vatId": "NIF / CIF",
    "block.customer.vatIdPlaceholder": "123456789",
    "block.customer.addDetails": "Añadir más detalles",

    // Payment Wall (Block C)
    "block.payment.title": "Método de Pago",
    "block.payment.disabledHint": "Rellena los datos arriba para activar los métodos",
    "block.payment.cardBrands": "Acepta Visa, Mastercard y American Express",

    // Payment Methods
    "method.card": "Tarjeta",
    "method.mbway": "MB WAY",
    "method.bizum": "Bizum",
    "method.multibanco": "Multibanco",
    "method.pix": "PIX",
    "method.usdt": "USDT",
    "method.applePay": "Apple Pay",
    "method.googlePay": "Google Pay",
    "method.comingSoon": "Próximamente",

    // Card Payment
    "card.payNow": "Pagar",
    "card.payNowAmount": "Pagar {amount}",
    "card.processing": "Procesando pago...",
    "card.encrypted": "Pago seguro con encriptación de extremo a extremo",
    "card.keyMissing": "Método de Pago",
    "card.keyMissingDesc": "La configuración del método de pago no está disponible.",
    "card.crashTitle": "Esperando configuración",
    "card.crashDesc": "No se pudo inicializar el pago.\nInténtalo de nuevo más tarde.",

    // Phone Payment (MBWAY / Bizum)
    "phone.title": "Número de Teléfono",
    "phone.placeholder": "+34 612 345 678",
    "phone.placeholder.es": "+34 612 345 678",
    "phone.required": "El número de teléfono es obligatorio",
    "phone.invalid": "Número de teléfono inválido",
    "phone.countryMismatch": "Número de teléfono inválido para este método de pago",
    "phone.submit": "Confirmar Pago",
    "phone.submitting": "Enviando...",
    "phone.waitingTitle": "Esperando aprobación",
    "phone.waitingDesc": "Abre la app y confirma el pago.",
    "phone.waitingHint": "No cierres esta ventana. Serás redirigido automáticamente.",

    // PIX
    "pix.scanTitle": "Escanea el Código QR",
    "pix.scanSubtitle": "Abre la app de tu banco y escanea",
    "pix.expired": "Expirado",
    "pix.copyTitle": "Código PIX Copiar y Pegar",
    "pix.copy": "Copiar",
    "pix.copied": "¡Copiado!",
    "pix.generateNew": "Generar nuevo código QR",
    "pix.autoRefresh": "Después del pago, la página se actualizará automáticamente.",
    "pix.qrExpired": "QR Expirado",

    // Multibanco
    "multibanco.title": "Datos para Pago Multibanco",
    "multibanco.entity": "Entidad",
    "multibanco.reference": "Referencia",
    "multibanco.amount": "Importe",
    "multibanco.copyEntity": "Copiar Entidad",
    "multibanco.copyRef": "Copiar Referencia",
    "multibanco.copyAmount": "Copiar Importe",
    "multibanco.copied": "¡Copiado!",
    "multibanco.hint": "Paga en tu banco más cercano o vía homebanking.",
    "multibanco.close": "Cerrar Checkout",

    // Status Screens
    "status.loading": "Cargando checkout...",
    "status.processing": "Procesando pago",
    "status.processingDesc": "Por favor espera mientras confirmamos tu pago.",
    "status.awaiting": "Esperando confirmación",
    "status.expiredTitle": "Sesión Expirada",
    "status.expiredDesc": "Se ha alcanzado el límite de tiempo de esta sesión de pago.",
    "status.newSession": "Crear Nueva Sesión",
    "status.cancelledTitle": "Pago Cancelado",
    "status.cancelledDesc": "El pago ha sido cancelado.",

    // Success
    "success.title": "¡Pago Confirmado!",
    "success.thanks": "Gracias por tu compra en",
    "success.email": "Hemos enviado un email de confirmación con los detalles del pedido.",
    "success.closeWindow": "Puede cerrar esta ventana",
    "success.closeDesc": "La transacción se ha completado con seguridad.",
    "success.redirecting": "Redirigiendo en {s} segundos...",
    "success.returnToMerchant": "Volver a la Tienda",

    // Initiate
    "initiate.processing": "Preparando método de pago...",

    // Error
    "error.title": "¡Ups!",
    "error.notFound": "Enlace no encontrado",
    "error.loadFailed": "No se pudo cargar el enlace de pago.",
    "error.serverError": "Error de conexión al servidor. Inténtalo de nuevo.",
    "error.initiateFailed": "No se pudo iniciar el pago. Inténtalo de nuevo.",
    "error.tryAgain": "Intentar de nuevo",
    "error.paymentFailed": "Pago Fallido",
    "error.paymentFailedDesc": "No se pudo procesar el pago. Prueba con otro método.",

    // Footer
    "footer.poweredBy": "",
    "footer.xpayments": "",
    "footer.secure": "Pago Seguro",

    // Session
    "session.expiresIn": "Expira en {time}",
    "session.expired": "Expirado",
  },
  fr: {
    // Header
    "header.secure": "Paiement Sécurisé",
    "header.close": "Fermer",

    // Order Block (Block A)
    "block.order.title": "Résumé de la Commande",
    "block.order.reference": "Référence",
    "block.order.amount": "Total à Payer",
    "block.order.secureBadge": "Paiement sécurisé et chiffré",

    // Customer Block (Block B)
    "block.customer.title": "Coordonnées",
    "block.customer.subtitle": "Nom et email pour confirmation.",
    "block.customer.name": "Nom Complet",
    "block.customer.namePlaceholder": "Jean Dupont",
    "block.customer.nameRequired": "Le nom est obligatoire",
    "block.customer.nameMin": "Minimum 2 caractères",
    "block.customer.email": "Email",
    "block.customer.emailPlaceholder": "jean@email.com",
    "block.customer.emailRequired": "L'email est obligatoire",
    "block.customer.emailInvalid": "Email invalide",
    "block.customer.phone": "Téléphone",
    "block.customer.phonePlaceholder": "+33 6 12 34 56 78",
    "block.customer.address": "Adresse",
    "block.customer.addressPlaceholder": "Rue, numéro",
    "block.customer.city": "Ville",
    "block.customer.cityPlaceholder": "Paris",
    "block.customer.postalCode": "Code Postal",
    "block.customer.postalCodePlaceholder": "75001",
    "block.customer.country": "Pays",
    "block.customer.company": "Entreprise",
    "block.customer.companyPlaceholder": "Nom de l'entreprise",
    "block.customer.vatId": "NIF / TVA",
    "block.customer.vatIdPlaceholder": "123456789",
    "block.customer.addDetails": "Ajouter plus de détails",

    // Payment Wall (Block C)
    "block.payment.title": "Méthode de Paiement",
    "block.payment.disabledHint": "Remplissez les informations ci-dessus pour activer les méthodes",
    "block.payment.cardBrands": "Accepte Visa, Mastercard et American Express",

    // Payment Methods
    "method.card": "Carte",
    "method.mbway": "MB WAY",
    "method.bizum": "Bizum",
    "method.multibanco": "Multibanco",
    "method.pix": "PIX",
    "method.usdt": "USDT",
    "method.applePay": "Apple Pay",
    "method.googlePay": "Google Pay",
    "method.comingSoon": "Bientôt",

    // Card Payment
    "card.payNow": "Payer",
    "card.payNowAmount": "Payer {amount}",
    "card.processing": "Traitement du paiement...",
    "card.encrypted": "Paiement sécurisé avec chiffrement de bout en bout",
    "card.keyMissing": "Méthode de Paiement",
    "card.keyMissingDesc": "La configuration du moyen de paiement n'est pas disponible.",
    "card.crashTitle": "En attente de configuration",
    "card.crashDesc": "Impossible d'initialiser le paiement.\nVeuillez réessayer plus tard.",

    // Phone Payment
    "phone.title": "Numéro de Téléphone",
    "phone.placeholder": "+33 6 12 34 56 78",
    "phone.placeholder.es": "+34 612 345 678",
    "phone.required": "Le numéro de téléphone est obligatoire",
    "phone.invalid": "Numéro de téléphone invalide",
    "phone.countryMismatch": "Numéro invalide pour ce moyen de paiement",
    "phone.submit": "Confirmer le Paiement",
    "phone.submitting": "Envoi en cours...",
    "phone.waitingTitle": "En attente d'approbation",
    "phone.waitingDesc": "Ouvrez l'application et confirmez le paiement.",
    "phone.waitingHint": "Ne fermez pas cette fenêtre. Vous serez redirigé automatiquement.",

    // PIX
    "pix.scanTitle": "Scannez le Code QR",
    "pix.scanSubtitle": "Ouvrez l'app de votre banque et scannez",
    "pix.expired": "Expiré",
    "pix.copyTitle": "Code PIX Copier-Coller",
    "pix.copy": "Copier",
    "pix.copied": "Copié !",
    "pix.generateNew": "Générer un nouveau code QR",
    "pix.autoRefresh": "Après le paiement, la page sera actualisée automatiquement.",
    "pix.qrExpired": "QR Expiré",

    // Multibanco
    "multibanco.title": "Détails de Paiement Multibanco",
    "multibanco.entity": "Entité",
    "multibanco.reference": "Référence",
    "multibanco.amount": "Montant",
    "multibanco.copyEntity": "Copier l'Entité",
    "multibanco.copyRef": "Copier la Référence",
    "multibanco.copyAmount": "Copier le Montant",
    "multibanco.copied": "Copié !",
    "multibanco.hint": "Payez au distributeur le plus proche ou via homebanking.",
    "multibanco.close": "Fermer le Checkout",

    // Status Screens
    "status.loading": "Chargement du checkout...",
    "status.processing": "Traitement du paiement",
    "status.processingDesc": "Veuillez patienter pendant la confirmation de votre paiement.",
    "status.awaiting": "En attente de confirmation",
    "status.expiredTitle": "Session Expirée",
    "status.expiredDesc": "Le délai de cette session de paiement a été atteint.",
    "status.newSession": "Créer une Nouvelle Session",
    "status.cancelledTitle": "Paiement Annulé",
    "status.cancelledDesc": "Le paiement a été annulé.",

    // Success
    "success.title": "Paiement Confirmé !",
    "success.thanks": "Merci pour votre achat chez",
    "success.email": "Nous avons envoyé un email de confirmation avec les détails de la commande.",
    "success.closeWindow": "Vous pouvez fermer cette fenêtre",
    "success.closeDesc": "La transaction a été effectuée en toute sécurité.",
    "success.redirecting": "Redirection dans {s} secondes...",
    "success.returnToMerchant": "Retourner à la Boutique",

    // Initiate
    "initiate.processing": "Préparation du moyen de paiement...",

    // Error
    "error.title": "Oups !",
    "error.notFound": "Lien introuvable",
    "error.loadFailed": "Impossible de charger le lien de paiement.",
    "error.serverError": "Erreur de connexion au serveur. Veuillez réessayer.",
    "error.initiateFailed": "Impossible de lancer le paiement. Veuillez réessayer.",
    "error.tryAgain": "Réessayer",
    "error.paymentFailed": "Paiement Échoué",
    "error.paymentFailedDesc": "Le paiement n'a pas pu être traité. Essayez une autre méthode.",

    // Footer
    "footer.poweredBy": "",
    "footer.xpayments": "",
    "footer.secure": "Paiement Sécurisé",

    // Session
    "session.expiresIn": "Expire dans {time}",
    "session.expired": "Expiré",
  },
};

// ── Country names per locale ──

export const COUNTRIES: Record<Locale, { value: string; label: string }[]> = {
  pt: [
    { value: "PT", label: "Portugal" },
    { value: "BR", label: "Brasil" },
    { value: "ES", label: "Espanha" },
    { value: "FR", label: "França" },
    { value: "DE", label: "Alemanha" },
    { value: "IT", label: "Itália" },
    { value: "GB", label: "Reino Unido" },
    { value: "US", label: "Estados Unidos" },
    { value: "AO", label: "Angola" },
    { value: "MZ", label: "Moçambique" },
    { value: "CV", label: "Cabo Verde" },
    { value: "CH", label: "Suíça" },
    { value: "NL", label: "Holanda" },
    { value: "BE", label: "Bélgica" },
    { value: "IE", label: "Irlanda" },
    { value: "LU", label: "Luxemburgo" },
    { value: "OTHER", label: "Outro" },
  ],
  en: [
    { value: "PT", label: "Portugal" },
    { value: "BR", label: "Brazil" },
    { value: "ES", label: "Spain" },
    { value: "FR", label: "France" },
    { value: "DE", label: "Germany" },
    { value: "IT", label: "Italy" },
    { value: "GB", label: "United Kingdom" },
    { value: "US", label: "United States" },
    { value: "AO", label: "Angola" },
    { value: "MZ", label: "Mozambique" },
    { value: "CV", label: "Cape Verde" },
    { value: "CH", label: "Switzerland" },
    { value: "NL", label: "Netherlands" },
    { value: "BE", label: "Belgium" },
    { value: "IE", label: "Ireland" },
    { value: "LU", label: "Luxembourg" },
    { value: "OTHER", label: "Other" },
  ],
  es: [
    { value: "PT", label: "Portugal" },
    { value: "BR", label: "Brasil" },
    { value: "ES", label: "España" },
    { value: "FR", label: "Francia" },
    { value: "DE", label: "Alemania" },
    { value: "IT", label: "Italia" },
    { value: "GB", label: "Reino Unido" },
    { value: "US", label: "Estados Unidos" },
    { value: "AO", label: "Angola" },
    { value: "MZ", label: "Mozambique" },
    { value: "CV", label: "Cabo Verde" },
    { value: "CH", label: "Suiza" },
    { value: "NL", label: "Países Bajos" },
    { value: "BE", label: "Bélgica" },
    { value: "IE", label: "Irlanda" },
    { value: "LU", label: "Luxemburgo" },
    { value: "OTHER", label: "Otro" },
  ],
  fr: [
    { value: "PT", label: "Portugal" },
    { value: "BR", label: "Brésil" },
    { value: "ES", label: "Espagne" },
    { value: "FR", label: "France" },
    { value: "DE", label: "Allemagne" },
    { value: "IT", label: "Italie" },
    { value: "GB", label: "Royaume-Uni" },
    { value: "US", label: "États-Unis" },
    { value: "AO", label: "Angola" },
    { value: "MZ", label: "Mozambique" },
    { value: "CV", label: "Cap-Vert" },
    { value: "CH", label: "Suisse" },
    { value: "NL", label: "Pays-Bas" },
    { value: "BE", label: "Belgique" },
    { value: "IE", label: "Irlande" },
    { value: "LU", label: "Luxembourg" },
    { value: "OTHER", label: "Autre" },
  ],
};

// ── Auto-detect locale from browser ──

function detectLocale(): Locale {
  try {
    const lang = typeof navigator !== "undefined" ? (navigator.language || "pt-PT") : "pt-PT";
    const code = lang.split("-")[0].toLowerCase();
    if (code === "pt") return "pt";
    if (code === "en") return "en";
    if (code === "es") return "es";
    if (code === "fr") return "fr";
    return "en"; // Fallback to English for unknown languages
  } catch {
    return "en";
  }
}

/** Auto-detect country from browser locale. Returns ISO 3166-1 alpha-2 code. */
export function detectCountryCode(): string {
  try {
    const lang = typeof navigator !== "undefined" ? (navigator.language || "pt-PT") : "pt-PT";
    const parts = lang.split("-");
    if (parts.length > 1) {
      const region = parts[1].toUpperCase();
      if (region.length === 2) return region;
    }
    const code = parts[0].toLowerCase();
    const map: Record<string, string> = {
      pt: "PT", en: "US", es: "ES", fr: "FR", de: "DE",
      it: "IT", nl: "NL", be: "BE", ch: "CH", gb: "GB",
      uk: "GB", ie: "IE", lu: "LU", ao: "AO", mz: "MZ", cv: "CV",
    };
    return map[code] || "PT";
  } catch {
    return "PT";
  }
}

// ── Context ──

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  countryCode: string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// ── Provider ──

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [countryCode, setCountryCode] = useState("PT");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("xpayments-locale") as Locale | null;
    const detected = stored || detectLocale();
    const country = detectCountryCode();

    if (!stored) {
      localStorage.setItem("xpayments-locale", detected);
    }

    const id = requestAnimationFrame(() => {
      setLocaleState(detected);
      setCountryCode(country);
      setMounted(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("xpayments-locale", l);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[locale]?.[key] ?? translations.en?.[key] ?? key;
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, countryCode }),
    [locale, setLocale, t, countryCode]
  );

  if (!mounted) {
    return (
      <I18nContext.Provider value={{ locale: "en", setLocale, t: (k) => translations.en[k] ?? k, countryCode: "PT" }}>
        {children}
      </I18nContext.Provider>
    );
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// ── Hook ──

const FALLBACK_CONTEXT: I18nContextValue = {
  locale: "en",
  setLocale: () => {},
  t: (key: string) => translations.en?.[key] ?? key,
  countryCode: "PT",
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  return ctx ?? FALLBACK_CONTEXT;
}