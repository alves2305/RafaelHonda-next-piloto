import { redirect } from "next/navigation";

export default function LegacyClientLoginPage() {
  redirect("/painel/login");
}