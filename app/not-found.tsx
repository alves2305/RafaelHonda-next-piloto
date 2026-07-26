import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div>
        <p className="eyebrow">Página não encontrada</p>
        <h1>Este endereço não está disponível.</h1>
        <p>Confira o link informado e tente novamente.</p>
        <Link className="button button-primary" href="/rafael">
          Ir para o catálogo
        </Link>
      </div>
    </main>
  );
}
