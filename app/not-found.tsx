import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/logo";
export default function NotFound() { return <main className="not-found"><Logo /><div><span>404</span><h1>This key does not open anything.</h1><p>The page may have moved, or the link may be incomplete.</p><Link href="/"><ArrowLeft size={17} /> Return home</Link></div></main>; }
