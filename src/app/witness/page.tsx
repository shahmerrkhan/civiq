import { auth } from "@clerk/nextjs/server";
import WitnessClient from "./WitnessClient";

export default async function WitnessPage() {
  const { userId } = await auth();
  return <WitnessClient userId={userId ?? null} />;
}