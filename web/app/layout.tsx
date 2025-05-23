import type React from "react"
import "./globals.css"
import { Navbar } from "@/components/navbar"

import type { Metadata } from "next";
import "./globals.css";
import { inter } from "./fonts";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";
import { ProfileProvider } from "@/context/ProfileContext";

export const metadata = {
  title: "DemoDock | Where Projects Dock, and Ideas Rock",
  description: "A decentralized platform for Web3 developers to showcase and share their demo projects",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
       <Providers>
       <ProfileProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Toaster />
            </div>
          </ProfileProvider>
        </Providers>
      </body>
    </html>
  )
}
