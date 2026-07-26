import { ProfileFrame } from "@/components/ProfileFrame";
import type { ClientProfile } from "@/lib/types";

export function SuspendedProfile({ client }: { client: ClientProfile }) {
  return (
    <ProfileFrame client={client}>
      <main className="suspended-page">
        <div className="suspended-card">
          <div className="status-icon" aria-hidden="true">
            !
          </div>
          <p className="eyebrow">Acesso suspenso</p>
          <h1>Este perfil está temporariamente indisponível.</h1>
          <p>Entre em contato com o responsável pelo serviço.</p>
        </div>
      </main>
    </ProfileFrame>
  );
}
