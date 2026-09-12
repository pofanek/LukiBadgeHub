const LEVEL_BASE = 0.32075366;
const LEVEL_EXPONENT = 2.15;
const MINIMUM_LEVEL_REQUIREMENT = 8;

export type LevelProgress = {
  level: number;
  experienceIntoLevel: number;
  experienceToNextLevel: number;
  experienceRemaining: number;
  progressPercentage: number;
};

export function getExperienceToNextLevel(level: number) {
  if (!Number.isInteger(level) || level < 1) {
    throw new RangeError("Level must be a positive integer.");
  }

  return Math.max(
    MINIMUM_LEVEL_REQUIREMENT,
    Math.round(LEVEL_BASE * level ** LEVEL_EXPONENT),
  );
}

export function getExperienceRequiredForLevel(level: number) {
  if (!Number.isInteger(level) || level < 1) {
    throw new RangeError("Level must be a positive integer.");
  }

  let requiredExperience = 0;
  for (let currentLevel = 1; currentLevel < level; currentLevel += 1) {
    requiredExperience += getExperienceToNextLevel(currentLevel);
  }

  return requiredExperience;
}

export function getLevelFromExperience(experience: number) {
  return getLevelProgress(experience).level;
}

export function getLevelProgress(experience: number): LevelProgress {
  const totalExperience = Number.isFinite(experience)
    ? Math.max(0, Math.floor(experience))
    : 0;
  let level = 1;
  let requiredExperience = 0;

  while (totalExperience >= requiredExperience + getExperienceToNextLevel(level)) {
    requiredExperience += getExperienceToNextLevel(level);
    level += 1;
  }

  const experienceToNextLevel = getExperienceToNextLevel(level);
  const experienceIntoLevel = totalExperience - requiredExperience;

  return {
    level,
    experienceIntoLevel,
    experienceToNextLevel,
    experienceRemaining: experienceToNextLevel - experienceIntoLevel,
    progressPercentage: (experienceIntoLevel / experienceToNextLevel) * 100,
  };
}
