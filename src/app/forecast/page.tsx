import { auth } from "@clerk/nextjs/server";
import ForecastClient from "./ForecastClient";

export default async function ForecastPage() {
  const { userId } = await auth();
  return <ForecastClient userId={userId ?? null} />;
}