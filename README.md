# 🥑 Calora — AI-Powered Mobile Calorie & Macro Tracker

> **Calora** is a smart cross-platform mobile application (Android APK & iOS) designed to make health and nutrition tracking effortless. Powered by vision AI, users can instantly calculate calories, macros, and nutrients simply by taking a photo of their meal, scanning a barcode, or using voice/text descriptions.

---

## 📱 Mobile App Showcase & Architecture

Calora is built as a native mobile app for **Android (APK)** and **iOS**, optimized for real-time mobile performance with camera integration, smooth gesture interactions, offline storage, and secure cloud sync.

### Key Mobile Features
- 📸 **AI Photo Meal Scanner**: Point the camera at any meal to automatically detect food items, portion sizes, calories, protein, carbs, and fats.
- 🏷️ **Barcode & Voice Logging**: Scan product barcodes or describe your meal in plain English via text or voice.
- 📊 **Macro & Hydration Analytics**: Track daily caloric intake, macro splits (protein/carbs/fats), water intake, and body weight progress over time.
- 🔥 **Streak & Goal Engine**: Gamified daily goal tracking with streak maintenance and motivational progress indicators.
- 🔐 **Secure Authentication & Sync**: Seamless user authentication powered by Clerk with cloud profile synchronization.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Mobile Framework** | [React Native](https://reactnative.dev/) with [Expo SDK 57](https://expo.dev/) (Bare Workflow / Custom Native Native Modules) |
| **Routing** | [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation) |
| **Styling** | [NativeWind v4](https://www.nativewind.dev/) (Tailwind CSS for React Native) |
| **State & Data Fetching** | [TanStack React Query v5](https://tanstack.com/query) |
| **Authentication** | [@clerk/expo](https://clerk.com/) |
| **Database & ORM** | [Neon PostgreSQL](https://neon.tech/) & [Drizzle ORM](https://orm.drizzle.team/) |
| **AI Integration** | OpenAI Vision & Multimodal API |
| **Monitoring & Crash Reporting** | [@sentry/react-native](https://sentry.io/) |
| **Background Jobs** | [Trigger.dev](https://trigger.dev/) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js `>= 18`
- Expo Go app on mobile OR Android Studio / Xcode for emulator/device testing.
- EAS CLI installed: `npm install -g eas-cli`

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/CalorieAI.git
   cd CalorieAI
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the project root:
   ```env
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   DATABASE_URL=your_neon_db_url
   OPEN_AI_KEY=your_openai_key
   EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
   ```

4. **Run the Mobile Development Server**
   ```bash
   # Start Expo development server
   npm start

   # Run on Android Device / Emulator
   npm run android

   # Run on iOS Simulator
   npm run ios
   ```

---

## 📦 Building the Android APK & iOS App

To compile a standalone **Android APK** or **iOS Build** using Expo Application Services (EAS):

```bash
# Build standalone Android APK
npx eas-cli build --platform android --profile preview

# Build iOS standalone app
npx eas-cli build --platform ios --profile preview
```

---

## 🌐 Web Landing Page Deployment

The official web presentation landing page for Calora is located in the [`legal/`](./legal) folder. It is deployed to **Vercel** via [`vercel.json`](./vercel.json).

```bash
# Deploy landing page to Vercel via CLI
npx vercel
```

---

## 📄 License

This project is licensed under the MIT License.
