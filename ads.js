// Pubs récompensées. Dans l'appli (Capacitor + AdMob) on montre une vraie pub ; dans le navigateur, une pub simulée de 5 s.
// showRewarded() renvoie true si la pub a été regardée jusqu'au bout.
const AD_IDS = {   // identifiants de TEST fournis par Google : à remplacer par ceux du compte AdMob avant la publication
  android: 'ca-app-pub-3940256099942544/5224354917',
  ios: 'ca-app-pub-3940256099942544/1712485313',
};

const admob = () => window.Capacitor?.isNativePlatform?.() ? window.Capacitor.Plugins?.AdMob : null;
let ready = null;

export async function showRewarded(reason = '') {
  const A = admob();
  if (A) {
    try {
      ready ??= A.initialize({ initializeForTesting: true });
      await ready;
      await A.prepareRewardVideoAd({ adId: AD_IDS[window.Capacitor.getPlatform()] ?? AD_IDS.android, isTesting: true });
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
