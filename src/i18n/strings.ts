export type Locale = 'en' | 'de';

export const strings = {
  en: {
    nav: { product: 'PXL CLOCK', community: 'COMMUNITY', about: 'ABOUT', cart: 'Cart' },
    hero: {
      title: ['Time.', 'Design.', 'Expression.'],
      cta: 'Order now',
    },
    whatIs: {
      eyebrow: 'What is the PXL Clock?',
      paragraphs: [
        'Still in beta — but already full of expression: the PXL Clock shows the time in vivid, color-intensive pixels — sometimes minimalist, sometimes playful, always stylish.',
        'Handcrafted in real glass with 576 RGB LEDs and a deep love for detail, every clock becomes a one-of-a-kind piece — with character, expression, and craftsmanship.',
      ],
      what: 'What makes it special:',
      closing: 'The PXL Clock is a design object and a creative playground at the same time. Freely programmable, it invites you to design your own colors, shapes, and animations.',
      cta: 'Order now',
    },
    variants: {
      title: 'Two variants. One character.',
      body:
        'Black or white — both editions of the PXL Clock are deliberately simple, so what matters can shine: light, motion, design. A clear statement for those who shape spaces with intent — never overloaded, always considered.',
      black: 'Black Edition',
      white: 'White Edition',
    },
    shapeSpaces: { line1: 'For those who shape spaces', line2: 'and don’t just decorate them.' },
    handmade: {
      title: ['Handmade and limited', 'to 100 pieces.'],
      paragraphs: [
        'Every clock is built by hand with precision — and the first run is limited to just 100 pieces. This series is intentionally open-ended:',
        'A deliberate experiment. A beta version that grows with feedback, ideas, and impulses from the community.',
      ],
      cta: 'Order now',
    },
    started: { line1: 'Started with the desire to create', line2: 'something real.' },
    create: {
      title: ['Make it yours: Your pixels.', 'Your expression.'],
      paragraphs: [
        'The PXL Clock invites you to co-create: colors flow, shapes move, pixels come to life — and it all starts with an idea of yours.',
        'A desktop simulator for Mac and PC makes getting started easy — design your animations on your computer and see the result instantly. Small changes have immediate impact.',
        'Currently programmable in F#, with TypeScript on the way. Turning the clock into a digital medium of expression.',
      ],
      github: 'GITHUB',
      discord: 'DISCORD',
    },
    setup: {
      title: 'pxlclock.com/setup',
      body:
        'WiFi setup in under a minute, OTA updates, mobile app for iOS and Android. Scan the QR code with your phone to get started.',
    },
    story: {
      title: 'Our story',
      paragraphs: [
        'We are Sefa and Ronald — two creative minds with a passion for design, technology, and new perspectives. What started as a spontaneous idea grew into a labor of love: a clock that doesn’t just show time, but turns it into an experience — in color, form, and motion.',
        'The PXL Clock is intentionally a beta. Finished enough to delight — open enough to keep growing. We believe great ideas grow through exchange. So we invite everyone to think along, design along, and experiment with us.',
        'For us, the PXL Clock is more than a product. It stands for creative freedom, digital culture, and objects with character. Every model is meant to leave room — for individuality, curiosity, and your own rhythm. Pixel by pixel.',
      ],
    },
    footer: {
      getInTouch: 'GET IN TOUCH',
      info: 'INFORMATION',
      followUs: 'FOLLOW US',
      community: 'COMMUNITY',
      copyright: '© 2026 by Cumin & Potato GmbH',
      legal: { agb: 'Terms', impressum: 'Imprint', widerruf: 'Right of withdrawal', dse: 'Privacy', eula: 'EULA' },
    },
    price: { from: 'from', salePrefix: 'was' },
    stock: {
      inStock: 'In stock — ships from Germany',
      lowStock: (n: number) => `Only ${n} left — ships from Germany`,
      outOfStock: 'Currently out of stock',
    },
    shipping: 'Ships in 2–4 business days · DHL · 2 kg',
    cart: {
      title: 'Your cart',
      empty: 'Your cart is empty.',
      backToShop: 'Continue shopping',
      qty: 'Qty',
      remove: 'Remove',
      subtotal: 'Subtotal',
      discount: 'Discount',
      total: 'Total',
      couponPlaceholder: 'Promo code',
      couponApply: 'Apply',
      couponRemove: 'Remove code',
      checkout: 'Checkout',
    },
  },
  de: {
    nav: { product: 'PXL CLOCK', community: 'COMMUNITY', about: 'ÜBER UNS', cart: 'Warenkorb' },
    hero: {
      title: ['Zeit.', 'Design.', 'Ausdruck.'],
      cta: 'Jetzt bestellen',
    },
    whatIs: {
      eyebrow: 'Was ist die PXL Clock?',
      paragraphs: [
        'Noch in der Beta-Phase – aber schon voller Ausdruck: Die PXL Clock zeigt die Zeit in lebendigen, farbintensiven Pixeln – mal minimalistisch, mal verspielt, aber immer stilvoll.',
        'Handgefertigt aus echtem Glas, bestückt mit 576 RGB-LEDs und viel Liebe zum Detail, wird jede Uhr zu einem Unikat – mit Charakter, Ausdruck und handwerklicher Präzision.',
      ],
      what: 'Was sie besonders macht:',
      closing:
        'Die PXL Clock ist Designobjekt und kreative Spielwiese zugleich. Frei programmierbar lädt sie dazu ein, Farben, Formen und Animationen selbst zu gestalten.',
      cta: 'Jetzt bestellen',
    },
    variants: {
      title: 'Zwei Varianten. Ein Charakter.',
      body:
        'Schwarz oder Weiß – beide Varianten der PXL Clock sind bewusst schlicht gehalten, damit das Wesentliche wirkt: Licht, Bewegung, Design. Ein klares Statement für alle, die Gestaltung bewusst einsetzen – nicht überladen, sondern gezielt inszenieren.',
      black: 'Black Edition',
      white: 'White Edition',
    },
    shapeSpaces: { line1: 'Für alle, die Räume gestalten wollen', line2: 'und nicht nur dekorieren.' },
    handmade: {
      title: ['Von Hand gemacht und', 'auf 100 Stück limitiert.'],
      paragraphs: [
        'Jede Uhr entsteht in präziser Einzelanfertigung und ist auf nur 100 Exemplare limitiert. Diese erste Serie ist bewusst offen gedacht:',
        'Ein bewusstes Experiment. Eine Beta-Version, die sich weiterentwickelt mit Feedback, Ideen und Impulsen aus der Community.',
      ],
      cta: 'Jetzt bestellen',
    },
    started: { line1: 'Begonnen mit dem Wunsch, etwas', line2: 'Echtes zu schaffen.' },
    create: {
      title: ['Gestalte selbst: Deine Pixel.', 'Dein Ausdruck.'],
      paragraphs: [
        'Die PXL Clock lädt zum Mitgestalten ein: Farben fließen, Formen bewegen sich, Pixel erwachen zum Leben – und alles beginnt mit einer Idee von dir.',
        'Ein Desktop-Simulator für Mac und PC macht den Einstieg leicht: Du gestaltest deine Animationen am Computer und siehst sofort, was passiert. Kleine Änderungen zeigen direkt Wirkung.',
        'Programmiert wird derzeit in F#, TypeScript ist in Vorbereitung. So wird aus der Uhr ein digitales Ausdrucksmittel.',
      ],
      github: 'GITHUB',
      discord: 'DISCORD',
    },
    setup: {
      title: 'pxlclock.com/setup',
      body:
        'WLAN-Setup in unter einer Minute, OTA-Updates, Mobile-App für iOS und Android. Scanne den QR-Code mit deinem Handy, um loszulegen.',
    },
    story: {
      title: 'Unsere Geschichte',
      paragraphs: [
        'Wir sind Sefa und Ronald – zwei kreative Köpfe mit einer Leidenschaft für Design, Technologie und neue Perspektiven. Was als spontane Idee begann, wurde zu einem Herzensprojekt: eine Uhr, die nicht nur die Zeit zeigt, sondern sie zum Erlebnis macht – in Farbe, Form und Bewegung.',
        'Die PXL Clock ist bewusst als Beta-Version gedacht. Sie ist fertig genug, um zu begeistern – und offen genug, um weiterzuwachsen. Denn wir glauben: Gute Ideen entstehen im Austausch. Deshalb laden wir alle ein, mitzudenken, mitzugestalten, mit uns zu experimentieren.',
        'Für uns ist die PXL Clock mehr als ein Produkt. Sie steht für kreative Freiheit, für digitale Kultur und für Objekte mit Charakter. Jedes Modell soll Raum geben – für Individualität, Neugier und den eigenen Rhythmus. Pixel für Pixel.',
      ],
    },
    footer: {
      getInTouch: 'GET IN TOUCH',
      info: 'INFORMATION',
      followUs: 'FOLLOW US',
      community: 'COMMUNITY',
      copyright: '© 2026 by Cumin & Potato GmbH',
      legal: { agb: 'AGB', impressum: 'Impressum', widerruf: 'Widerrufsformular', dse: 'Datenschutz', eula: 'EULA' },
    },
    price: { from: 'ab', salePrefix: 'statt' },
    stock: {
      inStock: 'Auf Lager — Versand aus Deutschland',
      lowStock: (n: number) => `Nur noch ${n} verfügbar — Versand aus Deutschland`,
      outOfStock: 'Aktuell nicht verfügbar',
    },
    shipping: 'Versand in 2–4 Werktagen · DHL · 2 kg',
    cart: {
      title: 'Dein Warenkorb',
      empty: 'Dein Warenkorb ist leer.',
      backToShop: 'Weiter einkaufen',
      qty: 'Menge',
      remove: 'Entfernen',
      subtotal: 'Zwischensumme',
      discount: 'Rabatt',
      total: 'Gesamt',
      couponPlaceholder: 'Gutscheincode',
      couponApply: 'Anwenden',
      couponRemove: 'Code entfernen',
      checkout: 'Zur Kasse',
    },
  },
} as const;

export function t(locale: Locale) { return strings[locale]; }
export function altLocale(locale: Locale): Locale { return locale === 'en' ? 'de' : 'en'; }
export function homeHref(locale: Locale): string { return locale === 'en' ? '/' : '/de/'; }
