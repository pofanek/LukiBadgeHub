import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiImage,
  FiPlus,
  FiSave,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import type { GameRow } from "../../constants";
import { useAuthUser } from "../../hooks/useAuthUser";
import { GAME_FIELDS } from "../../hooks/useGames";
import { useUserProfile } from "../../hooks/useUserProfile";
import { supabase } from "../../utils/supabase";
import { ImageCropDialog } from "../Settings/components";

type GameForm = {
  name: string;
  developer: string;
  publisher: string;
  releaseDate: string;
  genres: string;
  description: string;
  steamUrl: string;
};

type CropTarget = {
  target: "cover" | "banner";
  file: File;
};

const imageTypes = ["image/jpeg", "image/png", "image/webp"];

const emptyForm: GameForm = {
  name: "",
  developer: "",
  publisher: "",
  releaseDate: "",
  genres: "",
  description: "",
  steamUrl: "",
};

function formFromGame(game: GameRow): GameForm {
  return {
    name: game.name,
    developer: game.developer,
    publisher: game.publisher,
    releaseDate: game.release_date || "",
    genres: game.genres.join(", "),
    description: game.description,
    steamUrl: game.steam_url || "",
  };
}

function gameMediaUrl(path: string | null) {
  if (!path) return null;
  return supabase.storage.from("game-media").getPublicUrl(path).data.publicUrl;
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-font-primary text-sm font-medium">{label}</span>
      {hint && <span className="text-font-muted ml-2 text-xs">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function FeedbackToast({
  message,
  error,
  onDismiss,
}: {
  message: string;
  error: boolean;
  onDismiss: () => void;
}) {
  const Icon = error ? FiAlertCircle : FiCheckCircle;
  return (
    <div
      className="fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
      role={error ? "alert" : "status"}
      aria-live="polite"
    >
      <div
        className={`border-surface-raised flex items-start gap-3 rounded-xl border px-4 py-3 shadow-black ${error ? "bg-destructive-background text-font-primary" : "bg-surface text-font-primary"}`}
      >
        <Icon
          className={`mt-0.5 h-5 w-5 shrink-0 ${error ? "text-destructive" : "text-accent-cold"}`}
        />
        <p className="min-w-0 flex-1 text-sm leading-relaxed">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="text-font-secondary hover:text-font-primary -mr-1 rounded p-1"
          aria-label="Dismiss notification"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AdminGames() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuthUser();
  const { profile, isLoading: isProfileLoading } = useUserProfile(user?.id);
  const [games, setGames] = useState<GameRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState<GameForm>(emptyForm);
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState<"cover" | "banner" | null>(
    null,
  );
  const hydratedGameId = useRef<number | null>(null);

  const isAdmin = profile?.role === "Admin";
  const selectedGame = useMemo(
    () => games.find((game) => game.id === Number(id)) || null,
    [games, id],
  );
  const filteredGames = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase();
    if (!query) return games;
    return games.filter((game) =>
      [game.name, game.developer, game.publisher, ...game.genres]
        .join(" ")
        .toLocaleLowerCase()
        .includes(query),
    );
  }, [games, searchTerm]);

  const dismissFeedback = () => {
    setError("");
    setNotice("");
  };

  useEffect(() => {
    if (!notice && !error) return;
    const timer = window.setTimeout(() => {
      setError("");
      setNotice("");
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [notice, error]);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    queueMicrotask(() => {
      if (active) setIsLoading(true);
    });
    supabase
      .from("games")
      .select(GAME_FIELDS)
      .order("created_at", { ascending: false })
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) setError("Games could not be loaded.");
        else setGames((data || []) as GameRow[]);
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!selectedGame || hydratedGameId.current === selectedGame.id) return;
    hydratedGameId.current = selectedGame.id;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setError("");
      setNotice("");
      setForm(formFromGame(selectedGame));
    });
    return () => {
      active = false;
    };
  }, [selectedGame]);

  const createGame = async () => {
    setError("");
    setNotice("");
    const starterName = `Untitled game ${crypto.randomUUID().slice(0, 8)}`;
    const { data, error: insertError } = await supabase
      .from("games")
      .insert({ name: starterName, description: "", is_published: false })
      .select(GAME_FIELDS)
      .single();
    if (insertError || !data) {
      setError("The draft could not be created. Try again.");
      return;
    }
    setGames((current) => [data as GameRow, ...current]);
    navigate(`/admin/games/${data.id}`);
  };

  const saveGame = async () => {
    if (!selectedGame) return;
    const name = form.name.trim();
    if (!name) {
      setError("Enter a game title before saving.");
      return;
    }

    setError("");
    setNotice("");
    setIsSaving(true);
    const { data, error: updateError } = await supabase
      .from("games")
      .update({
        name,
        description: form.description.trim(),
        game_creator: form.developer.trim() || null,
        developer: form.developer.trim(),
        publisher: form.publisher.trim(),
        release_date: form.releaseDate || null,
        genres: form.genres
          .split(",")
          .map((genre) => genre.trim())
          .filter(Boolean),
        steam_url: form.steamUrl.trim() || null,
        is_published: true,
      })
      .eq("id", selectedGame.id)
      .select(GAME_FIELDS)
      .single();
    setIsSaving(false);

    if (updateError || !data) {
      setError("The game could not be saved. Check the fields and try again.");
      return;
    }
    setGames((current) =>
      current.map((game) =>
        game.id === selectedGame.id ? (data as GameRow) : game,
      ),
    );
    setNotice(selectedGame.is_published ? "Game saved." : "Game published.");
  };

  const chooseImage = (target: CropTarget["target"], file?: File) => {
    setError("");
    setNotice("");
    if (!file) return;
    if (!imageTypes.includes(file.type)) {
      setError("Use a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Images must be 10 MB or smaller.");
      return;
    }
    setCropTarget({ target, file });
  };

  const uploadImage = async (
    target: "cover" | "banner",
    file: File,
  ) => {
    if (!selectedGame) throw new Error("This game is no longer available.");

    setError("");
    setNotice("");
    setIsUploading(target);
    const path = `games/${selectedGame.id}/${target}/${crypto.randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage
      .from("game-media")
      .upload(path, file, { contentType: "image/webp" });
    if (uploadError) {
      setIsUploading(null);
      throw new Error("The image could not be uploaded.");
    }

    const column = target === "cover" ? "cover_path" : "banner_path";
    const { data, error: updateError } = await supabase
      .from("games")
      .update({
        [column]: path,
        ...(target === "cover" ? { cover_position: "center" } : {}),
      })
      .eq("id", selectedGame.id)
      .select(GAME_FIELDS)
      .single();
    setIsUploading(null);
    if (updateError || !data) {
      throw new Error("The image uploaded, but the game artwork could not be saved.");
    }
    setGames((current) =>
      current.map((game) =>
        game.id === selectedGame.id ? (data as GameRow) : game,
      ),
    );
    setNotice(`${target === "cover" ? "Cover" : "Banner"} image updated.`);
  };

  const saveCroppedImage = async (file: File) => {
    if (!cropTarget) return;
    await uploadImage(cropTarget.target, file);
    setCropTarget(null);
  };

  if (isAuthLoading || isProfileLoading) {
    return (
      <div className="bg-primary text-font-secondary min-h-96 py-20 text-center">
        Loading CMS...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) {
    return (
      <div className="bg-primary text-font-secondary min-h-96 py-20 text-center">
        This page is available to Admins only.
      </div>
    );
  }

  const inputClass =
    "border-border bg-surface-soft text-font-primary placeholder:text-font-muted focus:border-accent-cold w-full rounded-lg border px-3 py-2.5 text-sm outline-none";

  if (!id) {
    return (
      <section className="min-h-[calc(100vh-4rem)] w-full flex-1 py-8 sm:py-10">
        <div className="w-full px-3 sm:px-7 lg:px-10">
          <header className="border-border flex flex-wrap items-end justify-between gap-4 border-b pb-6">
            <div>
              <p className="text-accent-cold text-sm font-medium">Admin</p>
              <h1 className="text-font-primary mt-1 font-serif text-4xl">
                Games CMS
              </h1>
              <p className="text-font-secondary mt-2 max-w-2xl">
                Create and maintain the games players can add to their library.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <label className="relative min-w-0 sm:w-72">
                <span className="sr-only">Search games</span>
                <FiSearch className="text-font-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search games"
                  className={`${inputClass} pl-9`}
                />
              </label>
              <button
                type="button"
                onClick={createGame}
                className="bg-brand-secondary text-font-primary hover:bg-brand-primary inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
              >
                <FiPlus /> Add game
              </button>
            </div>
          </header>
          {isLoading ? (
            <p className="text-font-secondary py-16 text-center">
              Loading games...
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
              {filteredGames.map((game) => (
                <Link
                  key={game.id}
                  to={`/admin/games/${game.id}`}
                  className="border-border bg-surface group relative isolate min-h-52 overflow-hidden rounded-xl border p-4 transition-colors hover:border-accent-cold"
                >
                  {gameMediaUrl(game.cover_path) && (
                    <img
                      src={gameMediaUrl(game.cover_path) || undefined}
                      alt=""
                      className="absolute inset-0 -z-20 h-full w-full object-cover opacity-45 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-60"
                    />
                  )}
                  <div className="from-surface-overlay via-surface-overlay/45 absolute inset-0 -z-10 bg-gradient-to-t to-surface-overlay/20" />
                  <div className="flex h-full min-h-44 flex-col justify-between gap-6">
                    <span
                      className={`self-end rounded-full border px-2.5 py-1 text-xs font-medium ${game.is_published ? "border-accent-cold/40 bg-brand-tertiary text-font-primary" : "border-border bg-surface/80 text-font-secondary"}`}
                    >
                      {game.is_published ? "Published" : "Draft"}
                    </span>
                    <div>
                      <h2 className="text-font-primary truncate font-serif text-2xl">
                        {game.name}
                      </h2>
                      <p className="text-font-secondary mt-1 truncate text-sm">
                        {game.developer || game.publisher || "Game details not added"}
                      </p>
                      {game.genres.length > 0 && (
                        <p className="text-font-muted mt-3 truncate text-xs">
                          {game.genres.join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {!isLoading && filteredGames.length === 0 && (
            <p className="text-font-secondary border-border mt-6 rounded-xl border border-dashed px-4 py-10 text-center text-sm">
              No games match “{searchTerm}”.
            </p>
          )}
          <p className="text-font-muted mt-8 text-sm">
            Game deletion is intentionally available only in Supabase Dashboard.
          </p>
        </div>
        {(notice || error) && (
          <FeedbackToast
            message={error || notice}
            error={Boolean(error)}
            onDismiss={dismissFeedback}
          />
        )}
      </section>
    );
  }

  if (!selectedGame && !isLoading) {
    return (
      <div className="bg-primary text-font-secondary min-h-96 py-20 text-center">
        This game could not be found.
      </div>
    );
  }

  return (
    <section className="min-h-[calc(100vh-4rem)] w-full flex-1 py-8 sm:py-10">
      <div className="w-full px-3 sm:px-7 lg:px-10">
        <Link
          to="/admin"
          className="text-accent-cold hover:text-hover inline-flex items-center gap-2 text-sm font-medium"
        >
          <FiArrowLeft /> All games
        </Link>
        <header className="border-border mt-4 flex flex-wrap items-end justify-between gap-4 border-b pb-6">
          <div>
            <p className="text-accent-cold text-sm font-medium">Game editor</p>
            <h1 className="text-font-primary mt-1 font-serif text-4xl">
              {selectedGame?.name || "Loading..."}
            </h1>
          </div>
          <button
            type="button"
            onClick={saveGame}
            disabled={!selectedGame || isSaving}
            className="bg-brand-secondary text-font-primary hover:bg-brand-primary inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium disabled:cursor-wait disabled:opacity-60"
          >
            <FiSave /> {isSaving ? "Saving..." : "Save changes"}
          </button>
        </header>
        {selectedGame && (
          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="border-border bg-surface/75 space-y-5 rounded-xl border p-5 sm:p-6">
              <Field label="Game title">
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Developer">
                  <input
                    value={form.developer}
                    onChange={(event) =>
                      setForm({ ...form, developer: event.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Publisher">
                  <input
                    value={form.publisher}
                    onChange={(event) =>
                      setForm({ ...form, publisher: event.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Release date">
                  <input
                    type="date"
                    value={form.releaseDate}
                    onChange={(event) =>
                      setForm({ ...form, releaseDate: event.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Genres" hint="Separate with commas">
                  <input
                    value={form.genres}
                    onChange={(event) =>
                      setForm({ ...form, genres: event.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label="Steam URL">
                <input
                  type="url"
                  value={form.steamUrl}
                  onChange={(event) =>
                    setForm({ ...form, steamUrl: event.target.value })
                  }
                  placeholder="https://store.steampowered.com/..."
                  className={inputClass}
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  rows={6}
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </div>
            <aside className="space-y-4">
              {(["cover", "banner"] as const).map((target) => {
                const path =
                  target === "cover"
                    ? selectedGame.cover_path
                    : selectedGame.banner_path;
                return (
                  <section
                    key={target}
                    className="border-border bg-surface/75 rounded-xl border p-4"
                  >
                    <h2 className="text-font-primary font-serif text-lg">
                      {target === "cover" ? "Cover image" : "Banner image"}
                    </h2>
                    {gameMediaUrl(path) ? (
                      <img
                        src={gameMediaUrl(path) || undefined}
                        alt=""
                        className={`bg-surface-soft mt-3 w-full rounded-lg object-cover ${target === "cover" ? "aspect-[3/4]" : "aspect-video"}`}
                      />
                    ) : (
                      <div
                        className={`bg-surface-soft text-font-muted mt-3 flex w-full items-center justify-center rounded-lg ${target === "cover" ? "aspect-[3/4]" : "aspect-video"}`}
                      >
                        <FiImage className="h-6 w-6" />
                      </div>
                    )}
                    <label className="bg-brand-tertiary text-font-primary hover:bg-brand-primary mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium">
                      <FiImage />{" "}
                      {isUploading === target
                        ? "Uploading..."
                        : `Upload ${target}`}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={isUploading !== null}
                        onChange={(event) => {
                          chooseImage(target, event.target.files?.[0]);
                          event.target.value = "";
                        }}
                        className="sr-only"
                      />
                    </label>
                  </section>
                );
              })}
              <p className="text-font-muted px-1 text-xs leading-relaxed">
                Deleting a game remains a Dashboard-only action. Remove its
                game-media files there after deleting the row.
              </p>
            </aside>
          </div>
        )}
      </div>
      {cropTarget && (
        <ImageCropDialog
          file={cropTarget.file}
          kind={cropTarget.target === "cover" ? "gameCover" : "gameBanner"}
          onCancel={() => setCropTarget(null)}
          onConfirm={saveCroppedImage}
        />
      )}
      {(notice || error) && (
        <FeedbackToast
          message={error || notice}
          error={Boolean(error)}
          onDismiss={dismissFeedback}
        />
      )}
    </section>
  );
}

export default AdminGames;
