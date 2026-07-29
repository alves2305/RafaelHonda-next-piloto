import type {
  CSSProperties,
  ReactNode,
} from "react";

import { PublicCatalogAnalytics } from "@/components/PublicCatalogAnalytics";
import type { ClientProfile } from "@/lib/types";

type BrandStyle = CSSProperties & {
  "--brand-primary": string;
  "--brand-secondary": string;
};

export function ProfileFrame({
  client,
  children,
}: {
  client: ClientProfile;
  children: ReactNode;
}) {
  const style: BrandStyle = {
    "--brand-primary": client.corPrimaria,
    "--brand-secondary": client.corSecundaria,
  };

  return (
    <div className="site-frame" style={style}>
      {client.ativo ? (
        <PublicCatalogAnalytics
          clientId={client.id}
          clientSlug={client.slug}
          active={client.ativo}
        />
      ) : null}

      {children}
    </div>
  );
}
