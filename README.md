# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

# Photobooth für Raspberry Pi 5

## Übersicht

Diese Anwendung ist eine Fullstack-Fotobox für den Raspberry Pi 5 mit Touch-Display, gphoto2-kompatibler Kamera und GL-SFT1200 Router.

### Features
- Fotos aufnehmen, speichern und anzeigen
- Galerie- und Einzelbildansicht
- QR-Code-Generierung für Foto-Links
- Admin-Oberfläche für WLAN und Fotoverwaltung
- Touch-optimierte, moderne UI
- REST-API für Frontend und Admin

## Projektstruktur
- **/src**: Frontend (React + TypeScript, Vite)
- **/backend**: Backend (Node.js + Express, wird noch erstellt)
- **/photos**: Gespeicherte Fotos

## Setup & Start
1. **Frontend installieren & starten**
   ```bash
   npm install
   npm run dev
   ```
2. **Backend folgt**

## Hinweise
- Hardware-Integration (Kamera, GPIO) erfolgt im Backend.
- Die Anwendung funktioniert auch offline im lokalen Netzwerk.

---

Weitere Details und Backend-Code folgen.
