// Pubs récompensées. Dans l'appli (Capacitor + AdMob) on montre une vraie pub ; dans le navigateur, une pub simulée de 5 s.
// showRewarded() renvoie true si la pub a été regardée jusqu'au bout.
// Identifiants de TEST fournis par Google. Pour la publication : node tools/admob-ids.cjs (voir store/CHECKLIST.md),
// qui met les vrais blocs d'annonces ici et passe TESTING à false.
const AD_IDS = {
  android: 'ca-app-pub-3940256099942544/5224354917',
  ios: 'ca-app-pub-3940256099942544/1712485313',
};
const TESTING = true;

const admob = () => {
  const C = window.Capacitor;
  if (!C?.isNativePlatform?.()) return null;
  return C.Plugins?.AdMob ?? C.registerPlugin?.('AdMob') ?? null;
};
let ready = null;

// Avant la première pub : consentement RGPD (formulaire Google « UMP », seulement là où la loi l'exige, ex. Europe),
// puis sur iPhone la fenêtre Apple « Autoriser le suivi » (App Tracking Transparency). Sans accord, AdMob montre des pubs non personnalisées.
async function consent(A) {
  try {
    const info = await A.requestConsentInfo();
    if (info?.isConsentFormAvailable && info.status === 'REQUIRED') await A.showConsentForm();
  } catch { /* formulaire indisponible : AdMob reste en pubs non personnalisées */ }
  try {
    if (window.Capacitor.getPlatform() === 'ios') {
      const { status } = await A.trackingAuthorizationStatus();
      if (status === 'notDetermined') await A.requestTrackingAuthorization();
    }
  } catch { /* iOS ancien ou refus : rien à faire */ }
  await A.initialize({ initializeForTesting: TESTING });
}

// Bouton « Choix pour les pubs » : rouvre le formulaire de consentement. Renvoie false hors de l'appli installée.
export async function privacyOptions() {
  const A = admob();
  if (!A) return false;
  try { await (A.showPrivacyOptionsForm ?? A.showConsentForm).call(A); return true; } catch { return false; }
}

export async function showRewarded(reason = '') {
  const A = admob();
  if (A) {
    try {
      ready ??= consent(A);
      await ready;
      await A.prepareRewardVideoAd({ adId: AD_IDS[window.Capacitor.getPlatform()] ?? AD_IDS.android, isTesting: TESTING });
      const r = await A.showRewardVideoAd();
      return !!r;
    } catch { return false; }
  }
  return simulated(reason);
}

function simulated(reason) {
  return new Promise((done) => {
    const el = document.createElement('div');
    el.className = 'adsim';
    el.innerHTML = `<div class="adsim-box"><small>Publicité</small><b>Pub de démonstration</b><p>${reason}</p><div class="adsim-bar"><i></i></div>
      <button class="gh-btn" data-ad="skip">Annuler</button></div>`;
    document.body.appendChild(el);
    const btn = el.querySelector('button');
    let left = 5;
    const tick = setInterval(() => {
      left--;
      if (left > 0) return;
      clearInterval(tick); btn.textContent = 'Récupérer la récompense'; btn.className = 'gh-btn go'; btn.dataset.ad = 'ok';
    }, 1000);
    btn.addEventListener('click', () => { clearInterval(tick); el.remove(); done(btn.dataset.ad === 'ok'); });
  });
}
