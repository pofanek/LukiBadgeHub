import { hollow, hollowthumb } from "../assets";
import type { BadgeRow } from "./badges";

export type CatalogueGame = {
  id: number;
  title: string;
  genres: string[];
  releaseYear: number;
  achievementCount: number;
  totalExp: number;
  popularity: number;
  difficulties: CatalogueDifficulty[];
  badges: BadgeRow[];
  cover: string;
  coverPosition?: string;
  bannerUrl: string;
  developer?: string;
  publisher?: string;
  releaseDate?: string | null;
  description?: string;
  steamUrl?: string | null;
  isPublished?: boolean;
};

export type GameRow = {
  id: number;
  name: string;
  description: string;
  developer: string;
  publisher: string;
  release_date: string | null;
  genres: string[];
  steam_url: string | null;
  cover_path: string | null;
  cover_position: string;
  banner_path: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type CatalogueDifficulty = {
  label: string;
  achievementCount: number;
};

const defaultGameBanner = hollow;

export const catalogueGames: CatalogueGame[] = [
  {
    id: 1,
    title: "Fall Guys",
    genres: ["Platform", "Party"],
    releaseYear: 2020,
    achievementCount: 40,
    totalExp: 7_540,
    popularity: 982,
    difficulties: [
      { label: "Easy", achievementCount: 14 },
      { label: "Medium", achievementCount: 12 },
      { label: "Hard", achievementCount: 9 },
      { label: "Extreme", achievementCount: 5 },
    ],
    badges: [],
    cover: hollowthumb,
  },
  {
    id: 2,
    title: "Hollow Knight",
    genres: ["Action", "Metroidvania"],
    releaseYear: 2017,
    achievementCount: 63,
    totalExp: 13_680,
    popularity: 911,
    difficulties: [
      { label: "Easy", achievementCount: 16 },
      { label: "Medium", achievementCount: 18 },
      { label: "Hard", achievementCount: 12 },
      { label: "Supreme", achievementCount: 10 },
      { label: "Inhuman", achievementCount: 7 },
    ],
    badges: [],
    cover: hollow,
    coverPosition: "center",
  },
  {
    id: 3,
    title: "Celeste",
    genres: ["Platform", "Indie"],
    releaseYear: 2018,
    achievementCount: 30,
    totalExp: 8_420,
    popularity: 745,
    difficulties: [
      { label: "Easy", achievementCount: 9 },
      { label: "Hard", achievementCount: 14 },
      { label: "Extreme", achievementCount: 7 },
    ],
    badges: [],
    cover: hollowthumb,
    coverPosition: "70% center",
  },
  {
    id: 4,
    title: "Hades",
    genres: ["Action", "Roguelike"],
    releaseYear: 2020,
    achievementCount: 49,
    totalExp: 10_220,
    popularity: 869,
    difficulties: [
      { label: "Easy", achievementCount: 18 },
      { label: "Medium", achievementCount: 17 },
      { label: "Hard", achievementCount: 14 },
    ],
    badges: [],
    cover: hollow,
    coverPosition: "30% center",
  },
  {
    id: 5,
    title: "Tunic",
    genres: ["Action", "Puzzle"],
    releaseYear: 2022,
    achievementCount: 36,
    totalExp: 9_110,
    popularity: 574,
    difficulties: [
      { label: "Medium", achievementCount: 14 },
      { label: "Hard", achievementCount: 15 },
      { label: "Extreme", achievementCount: 7 },
    ],
    badges: [],
    cover: hollowthumb,
    coverPosition: "20% center",
  },
  {
    id: 6,
    title: "Dead Cells",
    genres: ["Action", "Roguelike"],
    releaseYear: 2018,
    achievementCount: 53,
    totalExp: 12_870,
    popularity: 783,
    difficulties: [
      { label: "Easy", achievementCount: 16 },
      { label: "Medium", achievementCount: 17 },
      { label: "Hard", achievementCount: 13 },
      { label: "Extreme", achievementCount: 7 },
    ],
    badges: [],
    cover: hollow,
    coverPosition: "75% center",
  },
  {
    id: 7,
    title: "Sea of Stars",
    genres: ["RPG", "Indie"],
    releaseYear: 2023,
    achievementCount: 42,
    totalExp: 8_950,
    popularity: 631,
    difficulties: [
      { label: "Easy", achievementCount: 17 },
      { label: "Medium", achievementCount: 15 },
      { label: "Hard", achievementCount: 10 },
    ],
    badges: [],
    cover: hollowthumb,
    coverPosition: "45% center",
  },
  {
    id: 8,
    title: "Dave the Diver",
    genres: ["Adventure", "Indie"],
    releaseYear: 2023,
    achievementCount: 45,
    totalExp: 9_680,
    popularity: 702,
    difficulties: [
      { label: "Easy", achievementCount: 16 },
      { label: "Medium", achievementCount: 17 },
      { label: "Hard", achievementCount: 12 },
    ],
    badges: [],
    cover: hollow,
    coverPosition: "65% center",
  },
  {
    id: 9,
    title: "Ori and the Will of the Wisps",
    genres: ["Platform", "Adventure"],
    releaseYear: 2020,
    achievementCount: 37,
    totalExp: 9_430,
    popularity: 656,
    difficulties: [
      { label: "Easy", achievementCount: 12 },
      { label: "Medium", achievementCount: 11 },
      { label: "Hard", achievementCount: 9 },
      { label: "Extreme", achievementCount: 5 },
    ],
    badges: [],
    cover: hollowthumb,
    coverPosition: "80% center",
  },
].map((game) => ({ ...game, bannerUrl: defaultGameBanner }));
