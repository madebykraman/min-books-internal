import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"FinBooksOS",description:"Financial workspace for independent professionals and service businesses."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}