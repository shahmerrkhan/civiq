import { auth } from "@clerk/nextjs/server";
import AboutClient from "./AboutClient";

export default async function AboutPage() {
  const { userId } = await auth();
  return <AboutClient isSignedIn={!!userId} />;
}
