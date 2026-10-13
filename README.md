# AgeWell — салауатты қартаю трекері (React Native, Expo)

Диплом тақырыбы: «Жасанды интеллект негізінде адамның салауатты қартаю деңгейін болжау жүйесін әзірлеу».
Бұл қосымша — диплом жүйесінің мобильдік клиенті: өмір салты мен денсаулық көрсеткіштерін жинайды,
Healthy Aging Score (0–100) және биологиялық жасты көрсетеді, динамиканы бақылайды.

## Іске қосу

### A) Expo Snack арқылы (GitHub-тан импорт) — ең жылдам
1. Жобаны GitHub-қа **public** репозиторий ретінде салыңыз (төмендегі «GitHub-қа салу» бөлімі). `App.js` пен `package.json` репоның **түбірінде** тұруы керек.
2. https://snack.expo.dev сайтына кіріңіз → жоғарғы мәзірден **Import git repository** таңдаңыз.
3. Репоның URL-ын қойыңыз (мысалы, `https://github.com/<username>/AgeWell`) → Import.
4. Snack `package.json` бойынша кітапханаларды өзі қосады. Оң жақтағы **My Device** батырмасын басып, телефондағы **Expo Go** арқылы QR-ды сканерлеңіз.
5. Snack-та өзгерту жасасаңыз, ол GitHub-қа автоматты жазылмайды: өзгерісті өз компьютеріңізде жасап, `git push` жасаңыз немесе Snack-тың Save → Push to Git мүмкіндігін қолданыңыз.

> Веб-превьюде AsyncStorage/SVG кейде дұрыс көрінбейді, нақты тексеруді телефонда жасаңыз.

### B) Компьютерде (локал)
1. Node.js (LTS) орнатыңыз, телефонға **Expo Go** қойыңыз.
2. Жоба папкасында:
   ```
   npm install
   npx expo start
   ```
3. QR-кодты Expo Go-мен сканерлеңіз (телефон мен компьютер бір Wi-Fi-да).

> Expo Go-ның нұсқасы жоба SDK-на (57) сай болуы керек: дүкеннен ең соңғы нұсқасын орнатыңыз.

## GitHub-қа салу
```
cd AgeWell
git init
git add .
git commit -m "AgeWell: React Native app"
git branch -M main
git remote add origin https://github.com/<username>/AgeWell.git
git push -u origin main
```
Алдымен github.com-да бос **public** репозиторий жасап алыңыз (README, .gitignore қоспаңыз).

## Экрандар (11)
1. Splash — 2. Onboarding (3 слайд) — 3. Кіру/Тіркелу — 4. Профиль құру (3 қадамды wizard) —
5. Басты (Dashboard) — 6. Көрсеткіш қосу/өңдеу — 7. Тарих — 8. Жазба мәліметі — 9. Болжам — 10. Статистика — 11. Баптаулар

## Талаптардың орындалуы
| Талап | Қайда |
|---|---|
| Навигация | `src/navigation/AppNavigator.js` — Stack + Bottom Tabs (ортада «+» батырмасы) |
| React Hooks | `useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`; custom hooks: `src/hooks.js` (`useForm`, `usePrediction`, `useDebounced`) |
| Validation | `src/utils/validators.js`; Auth, Профиль, Көрсеткіш қосу, Ескерту уақыты формаларында |
| Деректер қоры | AsyncStorage — `src/services/storage.js`, `src/context/AppContext.js` |
| CRUD | Денсаулық жазбалары: қосу (`addEntry`), көру (Тарих, Мәлімет), өзгерту (`updateEntry`), жою (`deleteEntry`) |
| Компоненттер | `src/components/` — Button, Input, Card, Chip, Segmented, Stepper, OptionCards, MetricCard, ScoreRing, Charts, Toast, EmptyState, Screen |
| Болжау логикасы | `src/services/scoreService.js` (ереже негізінде), `predictionApi.js` (ML API-ға қосылу нүктесі) |
| Dark mode | Баптаулар → Қараңғы тақырып |

## Құрылым
```
App.js, index.js, app.json, package.json
src/
  components/   қайта қолданылатын UI компоненттері
  context/      AppContext (глобал күй + AsyncStorage)
  navigation/   AppNavigator
  screens/      11 экран
  services/     storage, scoreService, predictionApi
  theme/        түстер, радиустар, көлеңке
  utils/        date, validators
  hooks.js      custom hooks
```

## Диплом моделімен байланыстыру
`src/services/predictionApi.js` ішінде `API_URL` мәнін өз серверіңізге ауыстырыңыз.
Қосымша `POST { profile, entries }` жібереді, `{ score, bioAge, factors, tips }` қабылдайды.
API қолжетімсіз болса, жергілікті ереже негізіндегі модель автоматты түрде жұмыс істейді.

## Қорғауда айту керек
- Қосымша — диплом ML жүйесінің клиенттік бөлігі: деректер жинайды, болжам көрсетеді, динамиканы бақылайды.
- Қазіргі болжам — ереже негізіндегі уақытша модель, нақты модель API арқылы қосылады.
- Деректер құрылғыда (AsyncStorage) сақталады; кіру жүйесі — прототип деңгейінде (құпиясөз шифрланбайды), нақты жобада Firebase/Supabase Auth қолданылады.
- Ескерту (notification) уақыты тек баптауда сақталады, push-хабарламалар келесі кезеңге қалдырылған.

## Белгілі шектеулер
- Жазбаны өшіру/өңдеу батырмалары карточканың ішінде (swipe жасты емес). Ұзақ басу да жоюды ашады.
- Күн өрісі ЖЖЖЖ-АА-КК форматындағы мәтін (date picker қосу үшін `@react-native-community/datetimepicker` қолдануға болады).
