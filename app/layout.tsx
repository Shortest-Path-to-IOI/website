import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition, faGithub, faLinkedin, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { auths, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Brightness from "@/components/ui/dark-to-light";
import { cookies } from "next/headers";
import Image from "next/image";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SPOI",
  description: "Training program for Indian students preparing for the International Olympiad in Informatics",
};

interface NavBaseProps {
  href: string;
}

interface NavLinkProps extends NavBaseProps {
  text: string;
}

interface NavIconProps extends NavBaseProps {
  icon: IconDefinition;
}

function NavLink({ href, text }: NavLinkProps) {
  return (
    <NavigationMenuItem>
      <Link href={href} legacyBehavior passHref>
        <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "text-xl")}>
          {text}
        </NavigationMenuLink>
      </Link>
    </NavigationMenuItem>
  )
}

function NavIcon({ href, icon }: NavIconProps) {
  return (
    <NavigationMenuItem>
      <Link href={href} legacyBehavior passHref>
        <NavigationMenuLink target="_blank" className={cn(navigationMenuTriggerStyle(), "px-2 block")}>
          <FontAwesomeIcon icon={icon} className="!h-8 !align-middle" />
        </NavigationMenuLink>
      </Link>
    </NavigationMenuItem>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let cookieStore = cookies();
  
  console.log(auths[cookieStore.get("__ssid")?.value as string])
  return (
    <html lang="en" className={cookieStore.get("mode")?.value == "true" ? "dark" : ""}>
      <body className={cn(inter.className, "bg-sky-50 dark:bg-[#101720]")}>
        <div className="flex justify-center p-3 sticky top-0">
          <NavigationMenu className="border p-2 rounded-md bg-white dark:bg-gray-900">
            <NavigationMenuList>
              <NavLink href="/" text="Home" />
              <NavLink href="/team" text="Our Team" />
              <NavLink href="https://forms.gle/oL1gFnqQoqRPcb3q9" text="Sign Up" />
              <div className="!mx-2 text-gray-300 text-xl">|</div>
              <NavIcon href="https://www.youtube.com/channel/UCjfxHo66lLDIZ3jgbsxDtAQ" icon={faYoutube} />
              <NavIcon href="https://github.com/spoi-org/" icon={faGithub} />
              <NavIcon href="https://www.linkedin.com/company/shortest-path-to-ioi" icon={faLinkedin} />
              <Brightness />
              <div className="!mx-2 text-gray-300 text-xl">|</div>
              {(cookieStore.get("__ssid")?.value || "") in auths ? <div className="flex p-2 gap-2 rounded bg-black"><img src={auths[cookieStore.get("__ssid")?.value as string].avatar} className="h-7"  /> {auths[cookieStore.get("__ssid")?.value as string].name}</div> : <NavLink href="https://discord.com/oauth2/authorize?client_id=1274686791542116404&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Foauth2&scope=identify" text="Sign In" />}

            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="mb-10">
          {children}
        </div>
        <footer className="bg-sky-100 w-full text-center p-5 text-2xl dark:bg-gray-700 flex items-center justify-center">
          <span className="pr-5">Ready to join?</span>
          <Button><Link href="https://forms.gle/oL1gFnqQoqRPcb3q9">Sign Up</Link></Button>
        </footer>
      </body>
    </html>
  );
}
