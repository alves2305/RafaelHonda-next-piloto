"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { MotorcyclePublicPreviewLink } from "@/components/admin/MotorcyclePublicPreviewLink";
import { getAdminSupabaseClient } from "@/lib/admin-supabase";

import styles from "./gallery-admin.module.css";

type MotorcycleRow = {
  id: string;
  nome: string;
  slug: string;
  imagem_url: string;
};

type GalleryImageRow = {
  id: string;
  moto_id: string;
  imagem_url: string;
  texto_alternativo: string | null;
  ordem: number;
  principal: boolean;
  ativo: boolean;
  criado_em: string;
};

export default function MotorcycleGalleryAdminPage() {
  const params = useParams<{ id: string }>();

  const [motorcycle, setMotorcycle] =
    useState<MotorcycleRow | null>(null);
  const [images, setImages] =
    useState<GalleryImageRow[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageAlt, setNewImageAlt] = useState("");
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] =
    useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeImages = useMemo(
    () => images.filter((image) => image.ativo),
    [images],
  );

  const loadGallery = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = getAdminSupabaseClient();

      const [
        {
          data: motorcycleData,
          error: motorcycleError,
        },
        {
          data: galleryData,
          error: galleryError,
        },
      ] = await Promise.all([
        supabase
          .from("motos")
          .select("id,nome,slug,imagem_url")
          .eq("id", params.id)
          .maybeSingle<MotorcycleRow>(),
        supabase
          .from("moto_imagens")
          .select(
            "id,moto_id,imagem_url,texto_alternativo,ordem,principal,ativo,criado_em",
          )
          .eq("moto_id", params.id)
          .order("principal", { ascending: false })
          .order("ordem")
          .order("criado_em"),
      ]);

      if (motorcycleError) {
        throw motorcycleError;
      }

      if (galleryError) {
        throw galleryError;
      }

      if (!motorcycleData) {
        setMotorcycle(null);
        setError("Moto não encontrada.");
        return;
      }

      setMotorcycle(motorcycleData);
      setImages(
        (galleryData ?? []) as GalleryImageRow[],
      );
    } catch (loadError) {
      console.error(loadError);
      setError(
        "Não foi possível carregar a galeria. Confirme se o SQL da Entrega 19.4.3 foi executado.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadGallery();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadGallery]);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = window.setTimeout(
      () => setSuccess(""),
      3500,
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [success]);

  async function addImage() {
    if (!motorcycle || !newImageUrl.trim()) {
      setError("Selecione uma imagem para adicionar.");
      return;
    }

    setAdding(true);
    setError("");
    setSuccess("");

    try {
      const supabase = getAdminSupabaseClient();
      const nextOrder =
        images.reduce(
          (highest, image) =>
            Math.max(highest, image.ordem),
          0,
        ) + 1;

      const { error: insertError } = await supabase
        .from("moto_imagens")
        .insert({
          moto_id: motorcycle.id,
          imagem_url: newImageUrl.trim(),
          texto_alternativo:
            newImageAlt.trim() || motorcycle.nome,
          ordem: nextOrder,
          principal: images.length === 0,
          ativo: true,
        });

      if (insertError) {
        throw insertError;
      }

      setNewImageUrl("");
      setNewImageAlt("");
      setSuccess("Imagem adicionada à galeria.");
      await loadGallery();
    } catch (insertError) {
      console.error(insertError);
      setError(
        "Não foi possível adicionar a imagem. Confirme sua sessão administrativa e tente novamente.",
      );
    } finally {
      setAdding(false);
    }
  }

  async function setPrincipal(image: GalleryImageRow) {
    if (image.principal && image.ativo) {
      return;
    }

    setWorkingId(image.id);
    setError("");
    setSuccess("");

    try {
      const supabase = getAdminSupabaseClient();

      const { error: updateError } = await supabase
        .from("moto_imagens")
        .update({
          principal: true,
          ativo: true,
        })
        .eq("id", image.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess(
        "Foto principal atualizada em todos os catálogos.",
      );
      await loadGallery();
    } catch (updateError) {
      console.error(updateError);
      setError(
        "Não foi possível definir a foto principal.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function toggleActive(image: GalleryImageRow) {
    const nextActive = !image.ativo;

    if (
      !nextActive &&
      image.ativo &&
      activeImages.length <= 1
    ) {
      setError(
        "A galeria precisa manter ao menos uma imagem ativa.",
      );
      return;
    }

    setWorkingId(image.id);
    setError("");
    setSuccess("");

    try {
      const supabase = getAdminSupabaseClient();

      const { error: updateError } = await supabase
        .from("moto_imagens")
        .update({ ativo: nextActive })
        .eq("id", image.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess(
        nextActive
          ? "Imagem reativada."
          : "Imagem ocultada do carrossel.",
      );
      await loadGallery();
    } catch (updateError) {
      console.error(updateError);
      setError(
        "Não foi possível alterar o status da imagem.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function moveImage(
    image: GalleryImageRow,
    direction: -1 | 1,
  ) {
    const orderedImages = [...images].sort(
      (first, second) =>
        first.ordem - second.ordem ||
        first.criado_em.localeCompare(
          second.criado_em,
        ),
    );
    const currentIndex = orderedImages.findIndex(
      (current) => current.id === image.id,
    );
    const targetIndex = currentIndex + direction;

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= orderedImages.length
    ) {
      return;
    }

    const target = orderedImages[targetIndex];

    setWorkingId(image.id);
    setError("");
    setSuccess("");

    try {
      const supabase = getAdminSupabaseClient();

      const firstUpdate = await supabase
        .from("moto_imagens")
        .update({ ordem: target.ordem })
        .eq("id", image.id);

      if (firstUpdate.error) {
        throw firstUpdate.error;
      }

      const secondUpdate = await supabase
        .from("moto_imagens")
        .update({ ordem: image.ordem })
        .eq("id", target.id);

      if (secondUpdate.error) {
        throw secondUpdate.error;
      }

      setSuccess("Ordem da galeria atualizada.");
      await loadGallery();
    } catch (moveError) {
      console.error(moveError);
      setError(
        "Não foi possível alterar a ordem da imagem.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function removeImage(image: GalleryImageRow) {
    if (image.ativo && activeImages.length <= 1) {
      setError(
        "Não é possível excluir a única imagem ativa da moto.",
      );
      return;
    }

    if (
      !window.confirm(
        "Excluir esta imagem da galeria? O arquivo enviado continuará no Storage para evitar exclusões acidentais.",
      )
    ) {
      return;
    }

    setWorkingId(image.id);
    setError("");
    setSuccess("");

    try {
      const supabase = getAdminSupabaseClient();

      const { error: deleteError } = await supabase
        .from("moto_imagens")
        .delete()
        .eq("id", image.id);

      if (deleteError) {
        throw deleteError;
      }

      setSuccess("Imagem removida da galeria.");
      await loadGallery();
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        "Não foi possível remover a imagem.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <AdminShell
      title="Galeria da moto"
      description="Adicione e organize as imagens exibidas na página de detalhes."
    >
      <div className={styles.topbar}>
        <Link href={`/admin/motos/${params.id}`}>
          ← Voltar para edição
        </Link>

        {motorcycle ? (
          <MotorcyclePublicPreviewLink
            motorcycleId={motorcycle.id}
            motorcycleSlug={motorcycle.slug}
            mode="moto"
            includeGalleryLink={false}
          >
            Visualizar página pública ↗
          </MotorcyclePublicPreviewLink>
        ) : null}
      </div>

      {loading ? (
        <section className={styles.stateCard}>
          <span className={styles.spinner} />
          <p>Carregando galeria...</p>
        </section>
      ) : error === "Moto não encontrada." ? (
        <section className={styles.stateCard}>
          <h2>Moto não encontrada</h2>
          <Link href="/admin/motos">
            Voltar para motos
          </Link>
        </section>
      ) : motorcycle ? (
        <div className={styles.layout}>
          <section className={styles.panel}>
            <div className={styles.heading}>
              <span>Galeria central</span>
              <h2>{motorcycle.nome}</h2>
              <p>
                A foto principal também será utilizada nos cards,
                consórcio e financiamento. As fotos extras aparecem
                no carrossel da página de detalhes.
              </p>
            </div>

            <div className={styles.uploadArea}>
              <ImageUploadField
                label="Nova foto da galeria"
                value={newImageUrl}
                onChange={setNewImageUrl}
                folder={`motos/${motorcycle.id}/galeria`}
                placeholder="URL da nova imagem"
                help="JPG, PNG ou WebP. A imagem será otimizada automaticamente."
                previewFit="contain"
              />

              <label>
                Texto alternativo
                <input
                  value={newImageAlt}
                  onChange={(event) =>
                    setNewImageAlt(event.target.value)
                  }
                  placeholder={`Ex.: ${motorcycle.nome} vista lateral`}
                />
                <small>
                  Ajuda na acessibilidade e na descrição da foto.
                </small>
              </label>

              <button
                className={styles.addButton}
                type="button"
                onClick={() => void addImage()}
                disabled={adding || !newImageUrl.trim()}
              >
                {adding
                  ? "Adicionando..."
                  : "Adicionar à galeria"}
              </button>
            </div>

            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className={styles.success} role="status">
                {success}
              </p>
            ) : null}

            <div className={styles.galleryHeading}>
              <div>
                <span>Imagens cadastradas</span>
                <h2>
                  {images.length}{" "}
                  {images.length === 1
                    ? "imagem"
                    : "imagens"}
                </h2>
              </div>

              <small>
                {activeImages.length} ativas
              </small>
            </div>

            <div className={styles.imageList}>
              {images.map((image, index) => (
                <article
                  className={`${styles.imageCard} ${
                    image.ativo
                      ? ""
                      : styles.imageInactive
                  }`}
                  key={image.id}
                >
                  <div className={styles.imagePreview}>
                    <img
                      src={image.imagem_url}
                      alt={
                        image.texto_alternativo ||
                        motorcycle.nome
                      }
                    />

                    {image.principal ? (
                      <strong>Principal</strong>
                    ) : null}

                    {!image.ativo ? (
                      <span>Oculta</span>
                    ) : null}
                  </div>

                  <div className={styles.imageInfo}>
                    <small>Foto {index + 1}</small>
                    <h3>
                      {image.texto_alternativo ||
                        motorcycle.nome}
                    </h3>
                    <p>
                      Ordem {image.ordem} •{" "}
                      {image.ativo
                        ? "visível no carrossel"
                        : "oculta do público"}
                    </p>
                  </div>

                  <div className={styles.orderButtons}>
                    <button
                      type="button"
                      onClick={() =>
                        void moveImage(image, -1)
                      }
                      disabled={
                        index === 0 ||
                        workingId === image.id
                      }
                      aria-label="Mover foto para cima"
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void moveImage(image, 1)
                      }
                      disabled={
                        index === images.length - 1 ||
                        workingId === image.id
                      }
                      aria-label="Mover foto para baixo"
                    >
                      ↓
                    </button>
                  </div>

                  <div className={styles.imageActions}>
                    <button
                      type="button"
                      onClick={() =>
                        void setPrincipal(image)
                      }
                      disabled={
                        (image.principal && image.ativo) ||
                        workingId === image.id
                      }
                    >
                      {image.principal && image.ativo
                        ? "Foto principal"
                        : "Tornar principal"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void toggleActive(image)
                      }
                      disabled={workingId === image.id}
                    >
                      {image.ativo
                        ? "Ocultar"
                        : "Reativar"}
                    </button>

                    <button
                      className={styles.deleteButton}
                      type="button"
                      onClick={() =>
                        void removeImage(image)
                      }
                      disabled={workingId === image.id}
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              ))}

              {images.length === 0 ? (
                <div className={styles.emptyState}>
                  <strong>Nenhuma imagem cadastrada.</strong>
                  <p>
                    Execute o SQL desta entrega ou adicione a
                    primeira foto acima.
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          <aside className={styles.summary}>
            <div>
              <span>Como funciona</span>
              <h2>Galeria compartilhada</h2>
            </div>

            <ul>
              <li>
                A foto principal aparece em todos os cards.
              </li>
              <li>
                As fotos extras aparecem nos detalhes da moto.
              </li>
              <li>
                A mesma galeria atende todos os vendedores.
              </li>
              <li>
                Imagens ocultas não aparecem ao público.
              </li>
            </ul>

            <div className={styles.mainPreview}>
              <small>Foto principal atual</small>
              <img
                src={
                  images.find(
                    (image) =>
                      image.principal && image.ativo,
                  )?.imagem_url ||
                  motorcycle.imagem_url
                }
                alt={motorcycle.nome}
              />
            </div>
          </aside>
        </div>
      ) : null}
    </AdminShell>
  );
}
