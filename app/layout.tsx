import "./globals.css";
import { findUserBySessionId } from "@/lib/utils.server";
import LayoutComponent from "./component";
import { cookies } from "next/headers";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await findUserBySessionId();
  const cookieStore = cookies();
  return (
    <LayoutComponent user={user} initialMode={cookieStore.get("mode")?.value === "true"}>{children}</LayoutComponent>
  );
}
