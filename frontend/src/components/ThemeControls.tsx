import { useTheme } from "../hooks/useThemePreference";
import { hexToRgb, rgbToHex } from "../utils/themeColors";

const presetColors = [
  "#4db9e9",
  "#4f79ec",
  "#8949e8",
  "#d34be7",
  "#ff4a98",
  "#ff754a",
  "#ffa64a",
  "#ffe05a",
  "#8dfc4c",
  "#43eb7a",
  "#42e5d1",
  "#ff4d5b",
];

type RgbChannel = "red" | "green" | "blue";

function hslToHex(hue: number, saturation: number, lightness: number) {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const component = hue / 60;
  const secondary = chroma * (1 - Math.abs((component % 2) - 1));
  const match = lightness - chroma / 2;
  const [red, green, blue] = component < 1
    ? [chroma, secondary, 0]
    : component < 2
      ? [secondary, chroma, 0]
      : component < 3
        ? [0, chroma, secondary]
        : component < 4
          ? [0, secondary, chroma]
          : component < 5
            ? [secondary, 0, chroma]
            : [chroma, 0, secondary];

  return rgbToHex({
    red: (red + match) * 255,
    green: (green + match) * 255,
    blue: (blue + match) * 255,
  });
}

function hueForColor(color: string) {
  const { red, green, blue } = hexToRgb(color) || hexToRgb("#3d8ef0")!;
  const normalizedRed = red / 255;
  const normalizedGreen = green / 255;
  const normalizedBlue = blue / 255;
  const maximum = Math.max(normalizedRed, normalizedGreen, normalizedBlue);
  const minimum = Math.min(normalizedRed, normalizedGreen, normalizedBlue);
  const difference = maximum - minimum;
  if (difference === 0) return 0;
  const hue = maximum === normalizedRed
    ? ((normalizedGreen - normalizedBlue) / difference) % 6
    : maximum === normalizedGreen
      ? (normalizedBlue - normalizedRed) / difference + 2
      : (normalizedRed - normalizedGreen) / difference + 4;
  return ((hue * 60) + 360) % 360;
}

export function ThemeControls({ showRgbInputs = false }: { showRgbInputs?: boolean }) {
  const { preference, resetTheme, setBrightness, setColor } = useTheme();
  const rgb = hexToRgb(preference.color) || hexToRgb("#3d8ef0")!;
  const hue = hueForColor(preference.color);

  const updateChannel = (channel: RgbChannel, value: string) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) return;
    setColor(rgbToHex({ ...rgb, [channel]: Math.min(Math.max(parsed, 0), 255) }));
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-font-primary text-sm font-semibold">Appearance</p>
        <p className="text-font-muted mt-0.5 text-xs">Choose the mood of your badge hub.</p>
      </div>

      <button
        type="button"
        aria-pressed={preference.isDefault}
        onClick={resetTheme}
        className={`border-border relative flex h-14 w-full overflow-hidden rounded-lg border text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-cold ${preference.isDefault ? "border-accent-cold" : "hover:border-font-muted"}`}
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundColor: "#0b1b2b", backgroundImage: "url('/bg.png')" }}
        />
        <span className="bg-black/50 text-font-primary relative m-1 flex min-w-0 flex-1 items-center justify-between rounded-md px-3 text-sm font-medium">
          Default
          <span className="text-font-secondary text-xs">Patterned blue</span>
        </span>
      </button>

      <div>
        <p className="text-font-muted mb-2 text-xs font-medium">Accent presets</p>
        <div className="grid grid-cols-6 gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Use ${color} theme`}
              aria-pressed={!preference.isDefault && preference.color.toLowerCase() === color}
              onClick={() => setColor(color)}
              className={`h-9 rounded-md transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-font-primary ${!preference.isDefault && preference.color.toLowerCase() === color ? "ring-2 ring-font-primary ring-offset-2 ring-offset-surface" : ""}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="border-border bg-surface-soft/60 space-y-3 rounded-lg border p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-font-primary text-xs font-medium">Custom color</p>
          <label className="border-border bg-surface flex h-7 w-7 cursor-pointer overflow-hidden rounded-md border">
            <span className="sr-only">Choose a custom RGB theme color</span>
            <input
              type="color"
              value={preference.color}
              onChange={(event) => setColor(event.target.value)}
              className="h-full w-full cursor-pointer border-0 bg-transparent p-0"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-font-muted mb-1.5 block text-xs">Hue</span>
          <input
            type="range"
            min="0"
            max="360"
            value={Math.round(hue)}
            onChange={(event) => setColor(hslToHex(Number(event.target.value), 0.86, 0.62))}
            className="theme-range"
            style={{
              background: "linear-gradient(90deg, #ff4a4a 0%, #ffe54a 17%, #4aff75 34%, #4ae9e2 51%, #4a76ff 68%, #c34aff 84%, #ff4a98 100%)",
            }}
          />
        </label>
        <label className="block">
          <span className="text-font-muted mb-1.5 flex items-center justify-between text-xs"><span>Background depth</span><span>{preference.brightness}%</span></span>
          <input
            type="range"
            min="0"
            max="100"
            value={preference.brightness}
            onChange={(event) => setBrightness(Number(event.target.value))}
            className="theme-range"
            style={{ background: `linear-gradient(90deg, #000 0%, ${preference.color} 100%)` }}
          />
        </label>

        {showRgbInputs && (
          <div className="grid grid-cols-3 gap-2 pt-1">
            {(["red", "green", "blue"] as const).map((channel) => (
              <label key={channel} className="border-border bg-surface-soft focus-within:border-accent-cold rounded-lg border px-2 py-1.5">
                <span className="text-font-muted block text-[10px] font-medium uppercase">{channel[0]}</span>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb[channel]}
                  onChange={(event) => updateChannel(channel, event.target.value)}
                  className="text-font-primary w-full bg-transparent text-sm outline-none"
                />
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
