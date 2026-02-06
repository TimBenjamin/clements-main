import { packMetadata } from "@/src/util/packMetadata";
import "./globals.css";
import { Metadata } from "next";
import { Navigation } from "@/components/Navigation";

export const metadata: Metadata = packMetadata({
    title: "Clements Theory",
    description: "Comprehensive music theory e-learning platform for students and teachers",
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" data-theme="light">
            <body>
                <Navigation />
                {children}
            </body>
        </html>
    );
}
