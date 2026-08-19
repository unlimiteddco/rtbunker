/**
 * CMS estático "de andar por casa" — útil para páginas legales y about
 * mientras no haya un CMS real (Sanity, Strapi, Notion, etc.).
 *
 * Cuando se conecte un CMS real, esto se reemplaza por una llamada a su API
 * manteniendo la misma firma `getCmsPage(slug, locale)` y `listCmsSlugs()`.
 */
interface CmsPage {
  title: string
  body: string
  excerpt?: string
}

const PAGES: Record<string, Record<string, CmsPage>> = {
  // 'about' vive ahora como página real y visual en /[locale]/nosotros.
  // 'contacto' vive ahora como página real con formulario en /[locale]/contacto.
  'aviso-legal': {
    es: {
      title: 'Aviso legal',
      excerpt: 'Datos identificativos y condiciones de uso de rtbunker.com.',
      body: `
<p><em>Última actualización: 31 de mayo de 2026.</em></p>

<h2>1. Datos identificativos</h2>
<p>En cumplimiento de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de que el titular de este sitio web es:</p>
<ul>
  <li><strong>Titular:</strong> RT Bunker <!-- [COMPLETAR: razón social completa] --></li>
  <li><strong>NIF/CIF:</strong> [COMPLETAR: NIF/CIF]</li>
  <li><strong>Domicilio:</strong> Calle Aneto 15, Nave A6, 50410 Cuarte de Huerva (Zaragoza), España</li>
  <li><strong>Correo electrónico:</strong> <a href="mailto:info@rtbunker.com">info@rtbunker.com</a></li>
  <li><strong>Sitio web:</strong> rtbunker.com</li>
</ul>

<h2>2. Objeto</h2>
<p>El presente aviso legal regula el acceso, navegación y uso de este sitio web, así como la compra de productos a través de la tienda online. La utilización del sitio atribuye la condición de usuario e implica la aceptación de las presentes condiciones.</p>

<h2>3. Condiciones de uso</h2>
<p>El usuario se compromete a hacer un uso adecuado y lícito del sitio web y de sus contenidos, absteniéndose de utilizarlos con fines ilícitos, lesivos de derechos de terceros o que de cualquier forma puedan dañar, inutilizar o deteriorar el sitio o impedir su normal uso.</p>

<h2>4. Propiedad intelectual e industrial</h2>
<p>Todos los contenidos del sitio (textos, fotografías, gráficos, imágenes, diseños, marcas, logotipos y código fuente) son titularidad de RT Bunker o de terceros que han autorizado su uso, y están protegidos por la normativa de propiedad intelectual e industrial. Queda prohibida su reproducción, distribución o transformación sin autorización expresa.</p>

<h2>5. Responsabilidad</h2>
<p>RT Bunker no se hace responsable de los daños y perjuicios derivados de la falta de disponibilidad o continuidad del sitio, ni de errores u omisiones en los contenidos, si bien adopta las medidas razonables para evitarlos. La información sobre productos, precios y disponibilidad puede actualizarse en cualquier momento.</p>

<h2>6. Enlaces</h2>
<p>Este sitio puede contener enlaces a páginas de terceros. RT Bunker no asume responsabilidad alguna sobre el contenido o las políticas de dichos sitios.</p>

<h2>7. Legislación aplicable y jurisdicción</h2>
<p>Las presentes condiciones se rigen por la legislación española. Para la resolución de cualquier controversia, las partes se someten a los Juzgados y Tribunales que correspondan conforme a la normativa de consumo aplicable.</p>

<p>Para cualquier consulta puedes escribirnos a <a href="mailto:info@rtbunker.com">info@rtbunker.com</a>.</p>
`,
    },
    en: {
      title: 'Legal notice',
      excerpt: 'Company details and terms of use for rtbunker.com.',
      body: `
<p><em>Last updated: 31 May 2026.</em></p>
<h2>1. Owner details</h2>
<p>The owner of this website is RT Bunker, with registered address at Calle Aneto 15, Nave A6, 50410 Cuarte de Huerva (Zaragoza), Spain, and email <a href="mailto:info@rtbunker.com">info@rtbunker.com</a>.</p>
<h2>2. Purpose</h2>
<p>This legal notice governs access to and use of this website and its online shop. Using the site implies acceptance of these terms.</p>
<h2>3. Intellectual property</h2>
<p>All site content is owned by RT Bunker or its licensors and is protected by intellectual and industrial property law. Reproduction without authorisation is prohibited.</p>
<h2>4. Governing law</h2>
<p>These terms are governed by Spanish law. For any query, contact <a href="mailto:info@rtbunker.com">info@rtbunker.com</a>.</p>
`,
    },
    fr: {
      title: 'Mentions légales',
      excerpt: 'Informations légales et conditions d’utilisation de rtbunker.com.',
      body: `
<p><em>Dernière mise à jour : 31 mai 2026.</em></p>
<h2>1. Éditeur</h2>
<p>Ce site est édité par RT Bunker, dont le siège est Calle Aneto 15, Nave A6, 50410 Cuarte de Huerva (Saragosse), Espagne, e-mail <a href="mailto:info@rtbunker.com">info@rtbunker.com</a>.</p>
<h2>2. Objet</h2>
<p>Les présentes mentions régissent l’accès et l’utilisation de ce site et de sa boutique en ligne. L’utilisation du site implique l’acceptation de ces conditions.</p>
<h2>3. Propriété intellectuelle</h2>
<p>L’ensemble des contenus appartient à RT Bunker ou à ses concédants et est protégé par le droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite.</p>
<h2>4. Droit applicable</h2>
<p>Les présentes conditions sont régies par le droit espagnol. Pour toute question : <a href="mailto:info@rtbunker.com">info@rtbunker.com</a>.</p>
`,
    },
  },
  privacidad: {
    es: {
      title: 'Política de privacidad',
      excerpt: 'Cómo tratamos tus datos personales conforme al RGPD.',
      body: `
<p><em>Última actualización: 31 de mayo de 2026.</em></p>
<p>En RT Bunker nos tomamos en serio tu privacidad. Esta política explica qué datos personales recogemos, con qué finalidad y qué derechos tienes, conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).</p>

<h2>1. Responsable del tratamiento</h2>
<ul>
  <li><strong>Responsable:</strong> RT Bunker <!-- [COMPLETAR: razón social] --> (NIF [COMPLETAR])</li>
  <li><strong>Domicilio:</strong> Calle Aneto 15, Nave A6, 50410 Cuarte de Huerva (Zaragoza), España</li>
  <li><strong>Contacto:</strong> <a href="mailto:info@rtbunker.com">info@rtbunker.com</a></li>
</ul>

<h2>2. Qué datos tratamos</h2>
<ul>
  <li><strong>Datos de cuenta:</strong> nombre, apellidos, email y contraseña (cifrada).</li>
  <li><strong>Datos de pedido y envío:</strong> dirección, teléfono y, en su caso, documento identificativo necesario para la facturación.</li>
  <li><strong>Datos de pago:</strong> gestionados directamente por nuestra pasarela de pago; RT Bunker no almacena los números de tarjeta.</li>
  <li><strong>Datos de navegación:</strong> información técnica y de uso recogida mediante cookies (ver la <a href="/pagina/cookies">política de cookies</a>).</li>
</ul>

<h2>3. Finalidades y base jurídica</h2>
<ul>
  <li><strong>Gestionar tus compras</strong> (tramitación, envío, facturación y atención al cliente) — base: ejecución del contrato.</li>
  <li><strong>Gestionar tu cuenta</strong> de cliente — base: ejecución del contrato.</li>
  <li><strong>Enviarte comunicaciones comerciales</strong> y la newsletter — base: tu consentimiento, revocable en cualquier momento.</li>
  <li><strong>Mejorar la tienda</strong> mediante analítica — base: tu consentimiento (cookies).</li>
  <li><strong>Cumplir obligaciones legales</strong> (fiscales y contables) — base: obligación legal.</li>
</ul>

<h2>4. Conservación</h2>
<p>Conservamos tus datos mientras mantengas tu cuenta o existan obligaciones legales que lo exijan (por ejemplo, los datos de facturación durante los plazos fiscales). Los datos para fines de marketing se conservan hasta que retires tu consentimiento.</p>

<h2>5. Destinatarios</h2>
<p>Solo compartimos tus datos con proveedores que nos prestan servicios como encargados del tratamiento, bajo contrato y con garantías adecuadas:</p>
<ul>
  <li>Pasarela de pago (procesamiento de pagos).</li>
  <li>Proveedor de envío de correos transaccionales y newsletter.</li>
  <li>Empresas de transporte y logística, para la entrega de pedidos.</li>
  <li>Proveedor de alojamiento e infraestructura.</li>
</ul>
<p>No vendemos tus datos a terceros.</p>

<h2>6. Transferencias internacionales</h2>
<p>Algunos proveedores pueden tratar datos fuera del Espacio Económico Europeo. En tales casos se aplican las garantías previstas en el RGPD (decisiones de adecuación o cláusulas contractuales tipo).</p>

<h2>7. Tus derechos</h2>
<p>Puedes ejercer en cualquier momento tus derechos de <strong>acceso, rectificación, supresión, oposición, limitación y portabilidad</strong>, así como retirar tu consentimiento, escribiendo a <a href="mailto:info@rtbunker.com">info@rtbunker.com</a>. Si consideras que no hemos atendido tu solicitud, puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noreferrer">aepd.es</a>).</p>

<h2>8. Seguridad</h2>
<p>Aplicamos medidas técnicas y organizativas razonables para proteger tus datos frente a accesos no autorizados, pérdida o alteración.</p>

<h2>9. Cambios</h2>
<p>Podemos actualizar esta política para adaptarla a cambios normativos o de servicio. Publicaremos siempre la versión vigente en esta página.</p>
`,
    },
    en: {
      title: 'Privacy policy',
      excerpt: 'How we process your personal data under the GDPR.',
      body: `
<p><em>Last updated: 31 May 2026.</em></p>
<p>This policy explains what personal data RT Bunker collects, why, and what rights you have under Regulation (EU) 2016/679 (GDPR).</p>
<h2>1. Controller</h2>
<p>RT Bunker, Calle Aneto 15, Nave A6, 50410 Cuarte de Huerva (Zaragoza), Spain — <a href="mailto:info@rtbunker.com">info@rtbunker.com</a>.</p>
<h2>2. Data we process</h2>
<p>Account data (name, email), order and shipping data, payment data (handled by our payment provider) and browsing data via cookies.</p>
<h2>3. Purposes &amp; legal basis</h2>
<p>Managing your orders and account (contract), sending marketing and newsletter (consent), analytics (consent) and legal/tax obligations (legal duty).</p>
<h2>4. Recipients</h2>
<p>We share data only with processors (payments, email, shipping, hosting) under contract. We never sell your data.</p>
<h2>5. Your rights</h2>
<p>You may exercise access, rectification, erasure, objection, restriction and portability, and withdraw consent, by emailing <a href="mailto:info@rtbunker.com">info@rtbunker.com</a>. You may also complain to the Spanish Data Protection Agency (aepd.es).</p>
`,
    },
    fr: {
      title: 'Politique de confidentialité',
      excerpt: 'Comment nous traitons vos données personnelles selon le RGPD.',
      body: `
<p><em>Dernière mise à jour : 31 mai 2026.</em></p>
<p>Cette politique explique quelles données personnelles RT Bunker collecte, pourquoi, et quels sont vos droits selon le Règlement (UE) 2016/679 (RGPD).</p>
<h2>1. Responsable</h2>
<p>RT Bunker, Calle Aneto 15, Nave A6, 50410 Cuarte de Huerva (Saragosse), Espagne — <a href="mailto:info@rtbunker.com">info@rtbunker.com</a>.</p>
<h2>2. Données traitées</h2>
<p>Données de compte (nom, e-mail), données de commande et de livraison, données de paiement (gérées par notre prestataire) et données de navigation via cookies.</p>
<h2>3. Finalités et base légale</h2>
<p>Gestion des commandes et du compte (contrat), envoi d’offres et newsletter (consentement), analytique (consentement) et obligations légales (obligation légale).</p>
<h2>4. Destinataires</h2>
<p>Nous partageons les données uniquement avec des sous-traitants (paiement, e-mail, transport, hébergement) sous contrat. Nous ne vendons jamais vos données.</p>
<h2>5. Vos droits</h2>
<p>Vous pouvez exercer vos droits d’accès, de rectification, d’effacement, d’opposition, de limitation et de portabilité, et retirer votre consentement à <a href="mailto:info@rtbunker.com">info@rtbunker.com</a>.</p>
`,
    },
  },
  cookies: {
    es: {
      title: 'Política de cookies',
      excerpt: 'Qué cookies usamos y cómo configurarlas.',
      body: `
<p><em>Última actualización: 31 de mayo de 2026.</em></p>

<h2>1. ¿Qué son las cookies?</h2>
<p>Las cookies son pequeños archivos que se descargan en tu dispositivo al navegar. Permiten que la tienda funcione, recordar tus preferencias y, si lo autorizas, analizar el uso del sitio o mostrarte contenido más relevante.</p>

<h2>2. Tipos de cookies que utilizamos</h2>
<ul>
  <li><strong>Técnicas (necesarias):</strong> imprescindibles para el funcionamiento de la tienda. No requieren consentimiento y no se pueden desactivar.</li>
  <li><strong>Analítica:</strong> nos ayudan a entender cómo se usa la web para mejorarla. Se activan solo con tu consentimiento.</li>
  <li><strong>Marketing:</strong> permiten mostrarte contenido y ofertas más relevantes. Se activan solo con tu consentimiento.</li>
</ul>

<h2>3. Cookies propias</h2>
<ul>
  <li><code>_rtb_cart_id</code> — mantiene tu carrito de la compra (técnica, 30 días).</li>
  <li><code>_rtb_consent</code> — guarda tus preferencias de cookies (técnica, 180 días).</li>
  <li><code>_rtb_popup</code> — recuerda que ya viste el aviso promocional (técnica, 30 días).</li>
  <li>Cookies de <strong>sesión e idioma</strong> — para mantener tu sesión iniciada y el idioma elegido (técnicas).</li>
</ul>
<p>Cuando activemos servicios de analítica o marketing, esta tabla se actualizará con el detalle de las cookies de terceros correspondientes.</p>

<h2>4. Cómo gestionar tus cookies</h2>
<p>Puedes aceptar, rechazar o configurar las cookies en el aviso que aparece al entrar por primera vez. Además, puedes <strong>cambiar tu elección en cualquier momento</strong> desde el enlace <strong>«Cookies»</strong> situado en el pie de página.</p>
<p>También puedes gestionar o eliminar las cookies desde la configuración de tu navegador (Chrome, Firefox, Safari, Edge…). Ten en cuenta que desactivar las cookies técnicas puede afectar al funcionamiento de la tienda.</p>

<h2>5. Actualizaciones</h2>
<p>Podemos modificar esta política para reflejar cambios en las cookies que utilizamos. Si los cambios son relevantes, te pediremos de nuevo tu consentimiento.</p>
`,
    },
    en: {
      title: 'Cookie policy',
      excerpt: 'Which cookies we use and how to manage them.',
      body: `
<p><em>Last updated: 31 May 2026.</em></p>
<h2>1. What are cookies?</h2>
<p>Cookies are small files stored on your device while browsing. They make the shop work, remember your preferences and, with your consent, help us analyse usage or show more relevant content.</p>
<h2>2. Types we use</h2>
<ul>
  <li><strong>Strictly necessary:</strong> required for the shop to work. No consent needed.</li>
  <li><strong>Analytics:</strong> help us improve the site. Enabled only with your consent.</li>
  <li><strong>Marketing:</strong> show more relevant content. Enabled only with your consent.</li>
</ul>
<h2>3. Managing cookies</h2>
<p>You can accept, reject or configure cookies in the banner shown on your first visit, and change your choice anytime via the <strong>“Cookies”</strong> link in the footer or your browser settings.</p>
`,
    },
    fr: {
      title: 'Politique de cookies',
      excerpt: 'Quels cookies nous utilisons et comment les gérer.',
      body: `
<p><em>Dernière mise à jour : 31 mai 2026.</em></p>
<h2>1. Que sont les cookies ?</h2>
<p>Les cookies sont de petits fichiers stockés sur votre appareil. Ils font fonctionner la boutique, mémorisent vos préférences et, avec votre consentement, nous aident à analyser l’usage ou à afficher du contenu pertinent.</p>
<h2>2. Types utilisés</h2>
<ul>
  <li><strong>Strictement nécessaires :</strong> indispensables au fonctionnement. Sans consentement.</li>
  <li><strong>Analytiques :</strong> pour améliorer le site. Avec votre consentement.</li>
  <li><strong>Marketing :</strong> contenu plus pertinent. Avec votre consentement.</li>
</ul>
<h2>3. Gérer les cookies</h2>
<p>Vous pouvez accepter, refuser ou configurer les cookies dans le bandeau affiché lors de votre première visite, et modifier votre choix à tout moment via le lien <strong>« Cookies »</strong> du pied de page ou les réglages de votre navigateur.</p>
`,
    },
  },
  devoluciones: {
    es: { title: 'Devoluciones', body: '<p>Tienes 14 días naturales desde la recepción para devolver el pedido.</p>' },
    en: { title: 'Returns', body: '<p>You have 14 calendar days from receipt to return your order.</p>' },
    fr: { title: 'Retours', body: '<p>Vous disposez de 14 jours calendaires à compter de la réception pour retourner votre commande.</p>' },
  },
}

export function getCmsPage(slug: string, locale: string): CmsPage | null {
  return PAGES[slug]?.[locale] ?? PAGES[slug]?.es ?? null
}

export function listCmsSlugs(): string[] {
  return Object.keys(PAGES)
}
