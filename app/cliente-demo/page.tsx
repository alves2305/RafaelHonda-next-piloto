import { redirect } from "next/navigation";

export default function LegacyClientRootPage() {
  redirect("/painel/login");
}