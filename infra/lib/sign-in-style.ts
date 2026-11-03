/* =====================================================================
   The look of Cognito's sign-in pages (managed login branding), in the
   web app's colors (src/theme.css): cream parchment on a teal page, wood
   borders, sage buttons, and the PokéLeet logo on the form.

   Every setting is spelled out, starting from Cognito's defaults, because
   the settings document has no published schema to check it against.
   Colors are RRGGBBAA. The pages are light mode only, like the app.
===================================================================== */
import fs from 'node:fs'
import path from 'node:path'
import type * as cognito from 'aws-cdk-lib/aws-cognito'
import { REPO_ROOT } from './bundling.ts'

const c = {
  page: '9cc6c2ff', // body background
  card: 'f8efd6ff',
  card2: 'fdf7e8ff',
  cream: 'f1e4c4ff',
  cardLine: 'd3bb8cff',
  wood: 'a87c54ff', // --wood-dark
  woodLine: '7c5a3dff',
  sage: 'aecd82ff',
  sageLite: 'c3dc9fff',
  sageDeep: '84a95cff',
  sageInk: '3e5226ff',
  lav: 'a99bd6ff',
  lavDeep: '8273b3ff',
  ink: '5d4733ff',
  inkSoft: '856a4dff',
  inkFaint: 'a98f6aff',
  white: 'ffffffff',
}

// Light mode is the only one shown; dark mode gets the same values so the
// document stays complete.
const modes = <T>(light: T) => ({ lightMode: light, darkMode: light })

const outlinedButton = modes({
  defaults: { backgroundColor: c.card2, borderColor: c.wood, textColor: c.ink },
  hover: { backgroundColor: c.cream, borderColor: c.woodLine, textColor: c.ink },
  active: { backgroundColor: c.cream, borderColor: c.woodLine, textColor: c.ink },
})

export const signInSettings = {
  categories: {
    auth: {
      // "Continue with Google" above the email and password form
      authMethodOrder: [
        [
          { display: 'BUTTON', type: 'FEDERATED' },
          { display: 'INPUT', type: 'USERNAME_PASSWORD' },
        ],
      ],
      federation: { interfaceStyle: 'BUTTON_LIST', order: [] },
    },
    form: {
      displayGraphics: true,
      instructions: { enabled: false },
      languageSelector: { enabled: false },
      location: { horizontal: 'CENTER', vertical: 'CENTER' },
      sessionTimerDisplay: 'NONE',
    },
    global: {
      colorSchemeMode: 'LIGHT',
      pageHeader: { enabled: false },
      pageFooter: { enabled: false },
      spacingDensity: 'REGULAR',
    },
    signUp: { acceptanceElements: [{ enforcement: 'NONE', textKey: 'en' }] },
  },
  componentClasses: {
    buttons: { borderRadius: 11.0 },
    divider: modes({ borderColor: c.cardLine }),
    dropDown: {
      borderRadius: 8.0,
      ...modes({
        defaults: { itemBackgroundColor: c.card2 },
        hover: { itemBackgroundColor: c.cream, itemBorderColor: c.wood, itemTextColor: c.ink },
        match: { itemBackgroundColor: c.cream, itemTextColor: c.lavDeep },
      }),
    },
    focusState: modes({ borderColor: c.lav }),
    idpButtons: { icons: { enabled: true } },
    input: {
      borderRadius: 8.0,
      ...modes({
        defaults: { backgroundColor: c.card2, borderColor: c.cardLine },
        placeholderColor: c.inkFaint,
      }),
    },
    inputDescription: modes({ textColor: c.inkSoft }),
    inputLabel: modes({ textColor: c.ink }),
    link: modes({ defaults: { textColor: c.lavDeep }, hover: { textColor: c.ink } }),
    optionControls: modes({
      defaults: { backgroundColor: c.card2, borderColor: c.wood },
      selected: { backgroundColor: c.sageDeep, foregroundColor: c.white },
    }),
    statusIndicator: modes({
      error: { backgroundColor: 'fff7f7ff', borderColor: 'd91515ff', indicatorColor: 'd91515ff' },
      pending: { indicatorColor: 'AAAAAAAA' },
      success: { backgroundColor: 'f2fcf3ff', borderColor: '037f0cff', indicatorColor: '037f0cff' },
      warning: { backgroundColor: 'fffce9ff', borderColor: '8d6605ff', indicatorColor: '8d6605ff' },
    }),
  },
  components: {
    alert: {
      borderRadius: 12.0,
      ...modes({ error: { backgroundColor: 'fff7f7ff', borderColor: 'd91515ff' } }),
    },
    favicon: { enabledTypes: ['SVG'] },
    form: {
      backgroundImage: { enabled: false },
      borderRadius: 14.0,
      ...modes({ backgroundColor: c.card, borderColor: c.woodLine }),
      logo: { enabled: true, formInclusion: 'IN', location: 'CENTER', position: 'TOP' },
    },
    idpButton: { custom: {}, standard: outlinedButton },
    pageBackground: { image: { enabled: false }, ...modes({ color: c.page }) },
    pageFooter: {
      backgroundImage: { enabled: false },
      ...modes({ background: { color: c.cream }, borderColor: c.woodLine }),
      logo: { enabled: false, location: 'CENTER' },
    },
    pageHeader: {
      backgroundImage: { enabled: false },
      ...modes({ background: { color: c.cream }, borderColor: c.woodLine }),
      logo: { enabled: false, location: 'START' },
    },
    pageText: modes({ bodyColor: c.inkSoft, descriptionColor: c.inkSoft, headingColor: c.ink }),
    phoneNumberSelector: { displayType: 'TEXT' },
    primaryButton: modes({
      defaults: { backgroundColor: c.sage, textColor: c.sageInk },
      hover: { backgroundColor: c.sageLite, textColor: c.sageInk },
      active: { backgroundColor: c.sageDeep, textColor: c.white },
      disabled: { backgroundColor: c.cream, borderColor: c.cardLine },
    }),
    secondaryButton: outlinedButton,
  },
}

const asset = (
  category: string,
  file: string,
): cognito.CfnManagedLoginBranding.AssetTypeProperty => ({
  category,
  colorMode: 'LIGHT',
  extension: path.extname(file).slice(1).toUpperCase(),
  bytes: fs.readFileSync(file).toString('base64'),
})

export const signInAssets = [
  asset('FORM_LOGO', path.join(REPO_ROOT, 'infra', 'assets', 'sign-in-logo.png')),
  asset('FAVICON_SVG', path.join(REPO_ROOT, 'public', 'favicon.svg')),
]
