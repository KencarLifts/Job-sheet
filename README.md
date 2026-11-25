# Kencar Job Sheets – PWA + вграждане в CRM

Статично уеб приложение (без сървър, без build) с база данни и акаунти в Supabase. Работи като PWA (инсталира се на телефон/таблет/компютър) и може да се вгради в CRM чрез iframe.

## Файлове
| Файл | Предназначение |
|---|---|
| `index.html`, `styles.css`, `app.js` | приложението |
| `config.js` | **единственият файл за настройка** (Supabase + разрешени CRM адреси) |
| `manifest.json`, `sw.js`, `icons/` | PWA (инсталиране, кеш, офлайн отваряне) |
| `pwa-check.html` | диагностика: показва какво липсва, ако приложението не се инсталира |
| `vendor/` | библиотеките (Supabase, jsPDF) – локално, без CDN |
| `assets/logo.png` | логото по подразбиране |
| `embed.js`, `embed-example.html` | помощник и пример за вграждане в CRM |
| `schema.sql` | цялата база данни за нов проект |
| `add_ext.sql`, `restrict_access.sql` | миграции само за вече съществуващ проект (`update_policies.sql` е остарял) |

## 1. Supabase
1. Създайте проект на https://supabase.com → **SQL Editor** → изпълнете `schema.sql`.
   (Ако вече имате база: изпълнете `add_ext.sql` и `restrict_access.sql`.)
2. **Project Settings → API**: копирайте *Project URL* и *anon public key* (никога `service_role`).
3. Попълнете ги в `config.js`.
4. **Authentication → URL Configuration**: задайте *Site URL* и добавете адреса на приложението в *Redirect URLs* (нужно за „Forgot password“). За реална работа добавете собствен SMTP (Authentication → Emails).

## 2. Хостинг (GitHub Pages или друг статичен хостинг)
Качете **цялото съдържание на папката** (с `vendor/`, `icons/`, `assets/`) в хранилище → *Settings → Pages → main / root*. Всички пътища са относителни, затова работи и в подпапка (`https://user.github.io/repo/`). Нужен е HTTPS (за PWA).

**Обновяване:** след всяка промяна променете `VERSION` в `sw.js` (напр. `jobsheets-v2`), иначе устройствата ще пазят стария кеш.

## 3. PWA
**Условия, за да се предложи инсталиране:** страницата се отваря през **HTTPS** (или `http://localhost`), **не** като файл от папка (`file://`); качени са всички папки (`icons/`, `vendor/`, `assets/`); отворена е поне веднъж и презаредена (service worker-ът поема контрола при следващо зареждане).
- Chrome/Edge/Android: иконата за инсталиране в адресната лента или бутон „Install app“ в горния десен ъгъл на приложението (виждат се след вход). Ако браузърът не е дал готовност, бутонът показва инструкции.
- iPhone/iPad (Safari): Share → *Add to Home Screen*.
- Приложението се отваря и без интернет, но документите се четат и записват само онлайн (показва се предупреждение).
- Иконите са в `icons/`; сменете ги с файлове със същите имена и размери (192, 512, maskable 512, 180).
- **Проверка:** отворете `…/pwa-check.html` на същия адрес. Показва кои от изискванията (HTTPS, манифест, икони, service worker) са изпълнени. Локално: `python3 -m http.server 8000` в папката и отворете `http://localhost:8000`.

## 4. Вграждане в CRM
Сложете адреса на CRM-а (само origin, напр. `https://crm.example.com`) в `allowedOrigins` в `config.js`.

### Най-просто – iframe
```html
<iframe src="https://HOST/?embed=1&ext=CUST-123" style="width:100%;height:800px;border:0"></iframe>
```
### С JavaScript (препоръчително)
```html
<script src="https://HOST/embed.js"></script>
<div id="box"></div>
<script>
const js = JobSheets.mount({
  container:'#box', url:'https://HOST/', ext:'CUST-123',          // ext = ID на клиента в CRM
  onSaved: m => console.log(m),                                   // {id,no,client,total,ext,type}
  onReady: m => console.log(m.user), onAuthRequired: () => {}, onError: m => {}
});
js.newDocument({client:'ACME Ltd', addr:'…', tel:'…', vat:'…', subj:'…', ext:'CUST-123'});
js.open(documentId, 'view');   // или 'edit'
js.search('12160');            // търсене; js.search('', 'CUST-123') = документи на клиента
</script>
```
Опции на `mount`: `ext`, `accent` (цвят, напр. `#153f89`), `hideNav`, `hideBar`, `minHeight`, `autoHeight` (по подразбиране вкл.), `mode:'new'` + `prefill`, `docId` + `docMode`, `session`.

### URL параметри
`embed=1`, `ext=…` (филтър по клиент + запис на референцията), `new=1&client=&addr=&tel=&vat=&subj=&price=` (нов документ с предварително попълване), `doc=<id>&mode=view|edit`, `q=…`, `nav=0`, `bar=0`, `accent=%23rrggbb`.

### Единен вход (SSO)
Ако CRM-ът е логнат в същия Supabase проект, подайте сесията му: `session: () => ({access_token, refresh_token})`. Иначе потребителят влиза с имейл и парола в рамката.

### Протокол postMessage (за собствена интеграция)
- От приложението към CRM: `jobsheets:ready`, `jobsheets:auth-required`, `jobsheets:saved`, `jobsheets:height`, `jobsheets:error`.
- От CRM към приложението: `jobsheets:auth`, `jobsheets:new` (`prefill`), `jobsheets:open` (`id`,`mode`), `jobsheets:search` (`q`,`ext`).
- Съобщенията се приемат само от адреси в `allowedOrigins` и само от родителския прозорец.

### Забележки за сигурност и браузъри
- Safari и някои браузъри блокират/разделят хранилището на iframe от друг домен, затова сесията може да не се запазва. Най-надеждно: приложението на поддомен на CRM-а (напр. `jobsheets.crm.example.com`) или SSO през `session`.
- Ако искате само вашият CRM да може да вгражда страницата, добавете заглавка `Content-Security-Policy: frame-ancestors https://crm.example.com` от хостинга (GitHub Pages не позволява).
- Достъпът до данните се пази от Row Level Security в базата, а не от страницата.

## 5. Потребители и права
- Първият регистриран потребител е администратор; всички следващи чакат одобрение в **Settings → Users**.
- Администраторът: настройки, логото, номерацията, роли, изтриване, импорт/експорт.
- Техникът вижда и редактира **само** документите, на които е записан като Technician (полето трябва да съвпада с пълното му име или имейл) – авторът няма значение. Администраторът вижда и редактира всичко. Това се налага от базата; за вече работеща база изпълнете `restrict_access.sql`.
- Номерата се дават атомарно от базата.
- Бутонът „PDF“ в списъка с документи е само за администратор; техникът изтегля PDF от последната стъпка след подписване.
- „Subject“ е падащо меню; списъкът с видове дейност (по един на ред) се редактира от администратора в Settings → Subject presets. Опцията „Other…“ позволява ръчно въвеждане.
- В PDF-а адресът се разпределя на до 3 реда с пренасяне след запетая (при повече части се обединяват), а Subject – на 2 реда (първият е с дължината на останалите полета вляво, вторият е на цялата ширина). Заглавието на страницата е „<Company name> - Job Sheets“ от Settings.

## 6. Импорт и експорт
Експортът (само за администратор) позволява да изберете кои документи да се експортират и съдържа попълнените данни заедно с подписите. Името на файла е номерът на документа и клиентът (при един документ) или номерът на първия документ и датата на експорта (при няколко). При импорт документите стават достъпни за техника, чието име/имейл съвпада с полето Technician; при съвпадащ номер данните се обновяват, а подписите в базата се запазват.

## 7. Архивиране
Supabase прави резервни копия според плана (Database → Backups). Допълнително използвайте Export.
