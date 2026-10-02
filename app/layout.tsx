import type { Metadata } from "next";
// import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar";
import { AppContextProvider } from "@/context/appContext";
import { Providers } from "@/app/providers";

// import {Roboto} from "next/font/google"

// const roboto = Roboto({
//   subsets : ["latin"], style : "normal"
// });

// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

const metadata: Metadata = {
  title: "Health Click",
  description: "Your one stop shop for health needs",
};

export const SEO_CONFIG = {
  description:'Your one stop shop for health needs',
  fullName: "Health Click",
  name: "Health Click",
  slogan: "your health on click always",
};

export const SYSTEM_CONFIG = {
  redirectAfterSignIn: "/dashboard/uploads",
  redirectAfterSignUp: "/dashboard/uploads",
  // repoName: "relivator",
  // repoOwner: "blefnk",
  // repoStars: true,
};

// Local Session interface removed to use next-auth's global extension

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-roboto_mono antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Providers>
            <AppContextProvider>
              <Navbar />
              {children}
            </AppContextProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
