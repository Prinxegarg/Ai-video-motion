#!/usr/bin/env node
/**
 * Scaffolds a new composition and registers it in src/Root.tsx.
 *
 *   npm run new -- PromoVideo                 # 6 s, uses VIDEO width/height/fps
 *   npm run new -- PromoVideo --seconds=10    # custom duration
 *   npm run new -- StoryAd --format=vertical  # any key of FORMATS in src/config/video.ts
 *
 * Then preview at http://localhost:3000/<Name> (npm run dev) and render with
 *   npx remotion render <Name> out/<Name>.mp4
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootFile = path.join(root, "src", "Root.tsx");
const IMPORT_MARKER = "// @new-composition-imports";
const COMPOSITION_MARKER = "{/* @new-compositions";
const FORMATS = ["landscape", "landscape4k", "vertical", "square", "portrait"];

const fail = (message) => {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
};

const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith("--"));
const flag = (key) =>
  args.find((a) => a.startsWith(`--${key}=`))?.split("=")[1] ?? null;

if (!name) {
  fail(
    "Usage: npm run new -- <PascalCaseName> [--seconds=6] [--format=vertical]",
  );
}
if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
  fail(
    `"${name}" must be PascalCase (letters and digits, starting uppercase), e.g. ProductLaunch.`,
  );
}

const seconds = Number(flag("seconds") ?? 6);
if (!Number.isFinite(seconds) || seconds <= 0) {
  fail("--seconds must be a positive number.");
}

const format = flag("format");
if (format && !FORMATS.includes(format)) {
  fail(`--format must be one of: ${FORMATS.join(", ")}`);
}

const dir = path.join(root, "src", "compositions", name);
if (existsSync(dir)) {
  fail(`src/compositions/${name} already exists.`);
}

let rootSource = readFileSync(rootFile, "utf8");
if (
  !rootSource.includes(IMPORT_MARKER) ||
  !rootSource.includes(COMPOSITION_MARKER)
) {
  fail(
    "Could not find the @new-composition markers in src/Root.tsx. Register the composition manually.",
  );
}
if (rootSource.includes(`id="${name}"`)) {
  fail(
    `A composition with id "${name}" is already registered in src/Root.tsx.`,
  );
}

const title = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2");

const component = `import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AnimatedText } from "../../components/AnimatedText";
import { GradientBackground } from "../../components/GradientBackground";
import { COLORS, FONTS } from "../../config/theme";
import { CLAMP, EASE } from "../../lib/animation";
import { useUnit } from "../../lib/layout";
import { toFrames } from "../../lib/timing";

export type ${name}Props = {
  readonly title: string;
};

export const ${name}: React.FC<${name}Props> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const u = useUnit();

  return (
    <AbsoluteFill>
      <GradientBackground />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: u(80),
          // Fade everything out over the last 0.5 s
          opacity: interpolate(
            frame,
            [durationInFrames - toFrames(0.5, fps), durationInFrames],
            [1, 0],
            { ...CLAMP, easing: EASE.in },
          ),
        }}
      >
        <AnimatedText
          text={title}
          by="char"
          delay={toFrames(0.3, fps)}
          stagger={Math.max(1, toFrames(0.04, fps))}
          duration={toFrames(0.6, fps)}
          style={{
            fontFamily: FONTS.display,
            fontWeight: 700,
            fontSize: u(140),
            letterSpacing: "-0.03em",
            color: COLORS.text,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
`;

const size = format
  ? `        {...FORMATS.${format}}`
  : `        width={VIDEO.width}
        height={VIDEO.height}`;

const registration = `      <Composition
        id="${name}"
        component={${name}}
${size}
        fps={VIDEO.fps}
        durationInFrames={toFrames(${seconds}, VIDEO.fps)}
        defaultProps={{ title: "${title}" }}
      />
`;

const imports = [`import { ${name} } from "./compositions/${name}/${name}";`];
if (
  !/import \{[^}]*\btoFrames\b[^}]*\} from "\.\/lib\/timing";/.test(rootSource)
) {
  imports.push(`import { toFrames } from "./lib/timing";`);
}
if (format && !/\bFORMATS\b/.test(rootSource)) {
  rootSource = rootSource.replace(
    'import { VIDEO } from "./config/video";',
    'import { FORMATS, VIDEO } from "./config/video";',
  );
}

rootSource = rootSource.replace(
  IMPORT_MARKER,
  `${imports.join("\n")}\n${IMPORT_MARKER}`,
);
const markerIndex = rootSource.indexOf(COMPOSITION_MARKER);
const lineStart = rootSource.lastIndexOf("\n", markerIndex) + 1;
rootSource =
  rootSource.slice(0, lineStart) + registration + rootSource.slice(lineStart);

mkdirSync(dir, { recursive: true });
writeFileSync(path.join(dir, `${name}.tsx`), component);
writeFileSync(rootFile, rootSource);

console.log(`
✔ Created src/compositions/${name}/${name}.tsx
✔ Registered <Composition id="${name}"> in src/Root.tsx (${seconds}s${format ? `, ${format}` : ""})

  Preview:  npm run dev   →  http://localhost:3000/${name}
  Render:   npx remotion render ${name} out/${name}.mp4
`);
