# Kencar Job Sheets – настройка (GitHub Pages + Supabase)

## 1. Supabase
1. Създайте проект на https://supabase.com.
2. **SQL Editor → New query** → поставете съдържанието на `schema.sql` → **Run**.
3. **Project Settings → API**: копирайте *Project URL* и *anon public key*.
   (Никога не слагайте `service_role` ключа в сайта.)
4. По желание, за по-лесен старт: **Authentication → Providers → Email** → изключете „Confirm email“.

## 2. Конфигурация
В `index.html`, в началото на скрипта, заменете:
```js
const CFG={url:'YOUR_SUPABASE_URL',key:'YOUR_SUPABASE_ANON_KEY'};
```

## 3. GitHub Pages
1. Създайте хранилище в GitHub и качете `index.html`.
2. **Settings → Pages → Deploy from a branch → main / (root)** → Save.
3. Адресът е `https://<потребител>.github.io/<хранилище>/`.
4. В Supabase: **Authentication → URL Configuration** → задайте *Site URL* да е този адрес.

## 4. Потребители
- Първият регистриран потребител става **администратор** и е одобрен автоматично.
- Всички следващи се регистрират сами, но виждат само екран „Waiting for approval“, докато администраторът не ги одобри в **Settings → Users**.
- Администраторът променя фирмените настройки, номерацията, ролите и може да трие документи. Техниците създават, търсят и редактират документи.
- Номерата се дават атомарно от базата, затова двама техници не могат да получат един и същ номер.

## Архивиране
**Export all** в списъка с документи изтегля всичко в JSON. Supabase също прави автоматични резервни копии (според плана).
