import { iconLinks, socialTags, metadata, homeUrl, SITE } from '../server/seo.js';
const copy = {
 en: {
  how:'How it works',worlds:'Explore the worlds',make:'Make a free calendar',language:'Français',other:'fr',
  eyebrow:'Your photos. Your words. Their Christmas.',title:'Create a personalised digital advent calendar',tagline:'24 little doors. One big smile.',intro:'Fill a little 3D world with photos, heartfelt notes and playful surprises. Share one link, and give someone you love a new moment every day in December.',free:'Two free worlds · No download for recipients',preview:'Explore the snowy village',image:'A real Tiny Doors 3D advent village, with 24 numbered snowy cottages around a Christmas tree.',note:'A little village. A whole lot of you.',
  howTitle:'A thoughtful Christmas gift, made in a few little steps.',steps:[['Choose their world','Start with a snowy village or a sunny Christmas by the sea. Explore eight more worlds in the Season Pass collection.'],['Make the doors personal','All 24 surprises are ready to go. Add your photos, write a note, make a voucher or pick a mini game.'],['Share a little Christmas magic','Save with an email sign-in link, then send their private calendar link. They can open it without creating an account.']],
  moments:'More than a countdown.',features:[['📸','Photos that mean something','A favourite holiday, an old family photo, a moment only the two of you remember.'],['💌','Little words, big feelings','Leave a kind note, a silly joke or a Christmas Eve letter written just for them.'],['🎲','Something to play','Surprise them with a word search, memory game, puzzle or a homemade voucher.']],
  worldsTitle:'A world for every kind of Christmas.',worldsIntro:'Choose a free world to start creating, or preview the Season Pass collection in the editor.',freeLabel:'Free world',premiumLabel:'Season Pass · preview',
  worldNames:['Snowy Village','Summer Christmas','Gingerbread Lane','Toy Town','Space Christmas','Santa’s Workshop','Treetop Jungle','Coral Reef Christmas','Kawaii Sakura Town','Neon City'],
  questions:'A few things you might be wondering.',faqs:[['Is Tiny Doors free?','Yes. Snowy Village and Summer Christmas are free, with up to 3 photo doors, personal notes and mini games. The other eight worlds belong to the Season Pass collection and can be previewed in the editor.'],['How do I send a digital advent calendar?','Create and save your calendar, then copy its private link and send it in a message. Your recipient opens the link in their browser; no account or app download is needed.'],['When do the doors open?','A new door opens each day from 1 to 24 December, at midnight in the timezone you choose. Missed days stay available so your recipient can catch up.'],['Can I come back and edit my calendar?','Yes. Sign in with the same email link account to reopen your saved calendar and keep personalising its doors.']],
  close:'Make their December a little more personal.',closeText:'A photo, a kind word, a little surprise. Start with the first door.',footer:'Personal digital advent calendars, made with love.',faqLabel:'Frequently asked questions',
 },
 fr: {
  how:'Comment ça marche',worlds:'Explorer les univers',make:'Créer un calendrier gratuit',language:'English',other:'en',
  eyebrow:'Vos photos. Vos mots. Leur Noël.',title:'Créez un calendrier de l’Avent numérique personnalisé',tagline:'24 petites portes. Un grand sourire.',intro:'Remplissez un petit univers en 3D de photos, de mots doux et de surprises amusantes. Partagez un lien pour offrir chaque jour de décembre un moment à une personne que vous aimez.',free:'Deux univers gratuits · Aucune application à télécharger',preview:'Explorer le village enneigé',image:'Un vrai village de l’Avent Tiny Doors en 3D, avec 24 chalets enneigés numérotés autour d’un sapin.',note:'Un petit village. Beaucoup de vous.',
  howTitle:'Un cadeau de Noël attentionné, en quelques étapes.',steps:[['Choisissez son univers','Commencez par un village enneigé ou un Noël ensoleillé au bord de la mer. Découvrez huit autres univers dans la collection du Pass de Noël.'],['Personnalisez les portes','Les 24 surprises sont déjà prêtes. Ajoutez vos photos, écrivez un mot, créez un bon cadeau ou choisissez un mini-jeu.'],['Partagez la magie de Noël','Enregistrez votre calendrier grâce à un lien de connexion par e-mail, puis envoyez son lien privé. Votre destinataire peut l’ouvrir sans créer de compte.']],
  moments:'Bien plus qu’un compte à rebours.',features:[['📸','Des photos qui comptent','Des vacances mémorables, une ancienne photo de famille ou un souvenir rien qu’à vous.'],['💌','Des petits mots, de grandes émotions','Un mot doux, une blague ou une lettre pour la veille de Noël, écrite spécialement pour cette personne.'],['🎲','Un moment pour jouer','Surprenez avec des mots mêlés, un jeu de mémoire, un puzzle ou un bon cadeau fait maison.']],
  worldsTitle:'Un univers pour chaque façon de fêter Noël.',worldsIntro:'Choisissez un univers gratuit pour commencer, ou découvrez les univers du Pass de Noël dans l’éditeur.',freeLabel:'Univers gratuit',premiumLabel:'Pass de Noël · aperçu',
  worldNames:['Village enneigé','Noël en été','Allée du pain d’épices','Ville des jouets','Noël dans l’espace','Atelier du Père Noël','Jungle dans les arbres','Noël sur le récif de corail','Ville Sakura kawaii','Cité des néons'],
  questions:'Les réponses à vos petites questions.',faqs:[['Tiny Doors est-il gratuit ?','Oui. Le Village enneigé et Noël en été sont gratuits, avec jusqu’à 3 portes photo, des mots personnels et des mini-jeux. Les huit autres univers font partie du Pass de Noël et peuvent être explorés dans l’éditeur.'],['Comment envoyer un calendrier de l’Avent numérique ?','Créez et enregistrez votre calendrier, puis copiez son lien privé et envoyez-le dans un message. Votre destinataire ouvre le lien dans son navigateur, sans compte ni application.'],['Quand les portes s’ouvrent-elles ?','Une nouvelle porte s’ouvre chaque jour du 1er au 24 décembre, à minuit dans le fuseau horaire choisi. Les jours manqués restent disponibles pour pouvoir les découvrir plus tard.'],['Puis-je revenir modifier mon calendrier ?','Oui. Connectez-vous avec le même compte par e-mail pour retrouver vos calendriers enregistrés et continuer à personnaliser leurs portes.']],
  close:'Un mois de décembre qui lui ressemble.',closeText:'Une photo, un mot doux, une petite surprise. Commencez par la première porte.',footer:'Des calendriers de l’Avent numériques, créés avec amour.',faqLabel:'Questions fréquentes',
 },
};
const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function renderHome(locale, editorSource) {
 const c=copy[locale],m=metadata[locale],editor='/editor.html?new&lang='+locale;
 const cards=[...editorSource.matchAll(/<button[^>]+data-theme-pick="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g)];
 const schema={'@context':'https://schema.org','@graph':[
  {'@type':'WebSite','@id':SITE+'/#website',url:SITE+'/',name:'Tiny Doors',alternateName:'Tinydoors',inLanguage:['en','fr'],description:metadata.en.description},
  {'@type':'Organization','@id':SITE+'/#organization',name:'Tiny Doors',url:SITE+'/',logo:SITE+'/assets/brand/icon-512.png'},
 ]};
 return `<!doctype html>
<html lang="${locale}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${m.title}</title>
${socialTags(locale)}
<meta name="theme-color" content="#101a3e"><meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${homeUrl(locale)}">
<link rel="alternate" hreflang="en" href="${homeUrl('en')}"><link rel="alternate" hreflang="fr" href="${homeUrl('fr')}"><link rel="alternate" hreflang="x-default" href="${homeUrl('en')}">
${iconLinks}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/home.css">
<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script>
</head><body>
<a class="skip-link" href="#main">${locale==='fr'?'Aller au contenu':'Skip to content'}</a>
<header class="site-header"><a class="brand" href="${locale==='fr'?'/?lang=fr':'/'}"><img src="/assets/brand/favicon.svg" width="36" height="36" alt="">Tiny Doors</a><nav aria-label="${locale==='fr'?'Navigation principale':'Main navigation'}"><a class="section-link" href="#how-it-works">${c.how}</a><a class="section-link" href="#worlds">${c.worlds}</a><a href="${c.other==='fr'?'/?lang=fr':'/'}" lang="${c.other}" hreflang="${c.other}">${c.language}</a><a class="button small" href="${editor.replaceAll('&','&amp;')}">${c.make}</a></nav></header>
<main id="main"><section class="hero"><div class="hero-copy"><p class="eyebrow">${c.eyebrow}</p><h1>${c.title}</h1><p class="tagline">${c.tagline}</p><p class="intro">${c.intro}</p><a class="button" href="${editor.replaceAll('&','&amp;')}">${c.make} <span aria-hidden="true">→</span></a><p class="small-note">${c.free}</p></div><figure class="hero-world"><img src="/assets/images/snowy-village.jpg" width="1280" height="720" alt="${esc(c.image)}" fetchpriority="high"><figcaption><span>${c.note}</span><a href="/3d.html?theme=snow&amp;skip&amp;lang=${locale}">${c.preview} →</a></figcaption></figure></section>
<section class="section" id="how-it-works"><p class="eyebrow">${c.how}</p><h2>${c.howTitle}</h2><div class="steps">${c.steps.map(([title,text],i)=>`<article><span class="step-number">0${i+1}</span><h3>${title}</h3><p>${text}</p></article>`).join('')}</div></section>
<section class="section moments"><h2>${c.moments}</h2><div class="features">${c.features.map(([icon,title,text])=>`<article><span aria-hidden="true" class="feature-icon">${icon}</span><h3>${title}</h3><p>${text}</p></article>`).join('')}</div></section>
<section class="section" id="worlds"><p class="eyebrow">${c.worlds}</p><h2>${c.worldsTitle}</h2><p class="section-intro">${c.worldsIntro}</p><div class="worlds">${cards.map(([all,id,body],i)=>`<a class="world" href="/editor.html?new&amp;theme=${id}&amp;lang=${locale}">${body.match(/<svg[\s\S]*?<\/svg>|<img\b[^>]*>/)[0]}<div><h3>${c.worldNames[i]}</h3><span class="world-label ${i<2?'free':''}">${i<2?c.freeLabel:c.premiumLabel}</span></div></a>`).join('')}</div></section>
<section class="section faq" aria-label="${c.faqLabel}"><h2>${c.questions}</h2>${c.faqs.map(([question,answer])=>`<details><summary>${question}</summary><p>${answer}</p></details>`).join('')}</section>
<section class="closing"><h2>${c.close}</h2><p>${c.closeText}</p><a class="button" href="${editor.replaceAll('&','&amp;')}">${c.make} →</a></section>
</main><footer><a class="brand" href="${locale==='fr'?'/?lang=fr':'/'}"><img src="/assets/brand/favicon.svg" width="28" height="28" alt="">Tiny Doors</a><p>${c.footer}</p><a href="${editor.replaceAll('&','&amp;')}">${c.make}</a></footer>
</body></html>`;
}
