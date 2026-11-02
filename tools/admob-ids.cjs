// Met les vrais identifiants AdMob partout (Android, iOS, ads.js) et coupe le mode test :
//   node tools/admob-ids.cjs <appli Android ~> <bloc récompensé Android /> <appli iOS ~> <bloc récompensé iOS />
// Exemple : node tools/admob-ids.cjs ca-app-pub-123~111 ca-app-pub-123/222 ca-app-pub-123~333 ca-app-pub-123/444
const fs = require('fs');
const [aApp, aRew, iApp, iRew] = process.argv.slice(2);
const ok = (v, sep) => /^ca-app-pub-\d+[~/]\d+$/.test(v || '') && v.includes(sep);
if (!ok(aApp, '~') || !ok(aRew, '/') || !ok(iApp, '~') || !ok(iRew, '/')) {
  console.error('Usage : node tools/admob-ids.cjs <appli Android ~> <bloc Android /> <appli iOS ~> <bloc iOS />');
  process.exit(1);
}
const edit = (file, fn) => { const s = fs.readFileSync(file, 'utf8'); const t = fn(s); if (t === s) return console.log('= déjà à jour :', file); fs.writeFileSync(file, t); console.log('✓', file); };
edit('android/app/src/main/res/values/strings.xml', (s) => s.replace(/(<string name="admob_app_id">)[^<]*/, `$1${aApp}`));
edit('ios/App/App/Info.plist', (s) => s.replace(/(<key>GADApplicationIdentifier<\/key>\s*<string>)[^<]*/, `$1${iApp}`));
edit('www/ads.js', (s) => s
  .replace(/android: 'ca-app-pub-[^']*'/, `android: '${aRew}'`)
  .replace(/ios: 'ca-app-pub-[^']*'/, `ios: '${iRew}'`)
  .replace('const TESTING = true;', 'const TESTING = false;'));
console.log('Pense à lancer « npx cap sync » puis à tester sur ton téléphone ajouté comme appareil de test dans AdMob.');
