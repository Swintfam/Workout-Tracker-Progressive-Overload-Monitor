import type { Metadata } from "next";
import "./globals.css";

// NOTE: using Tailwind's default system font stack (font-sans) rather
// than next/font/google — avoids a build-time dependency on fetching
// fonts from Google, and a custom font can be dropped in once the
// branding doc arrives (Phase D).

export const metadata: Metadata = {
  title: "Naeem's Dashboard",
  description: "Personal workout, nutrition, and life dashboard",
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
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
