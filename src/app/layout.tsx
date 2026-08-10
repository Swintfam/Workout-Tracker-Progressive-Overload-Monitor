import type { Metadata } from "next";
import "./globals.css";

// NOTE: using Tailwind's default system font stack (font-sans) rather
// than next/font/google — avoids a build-time dependency on fetching
// fonts from Google, and a custom font can be dropped in once the
// branding doc arrives (Phase D).

export const metadata: Metadata = {
  title: "Naeem's Dashboard",
  description: "Personal workout, nutrition, and life dashboard",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FitDash",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png",   sizes: "192x192", type: "image/png" },
    ],
  },
};

// Inline script runs before paint to apply the saved theme
// preference (avoids a flash of the wrong theme on load).
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored || 'dark';
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#F0C44D" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
