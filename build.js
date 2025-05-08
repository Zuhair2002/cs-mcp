import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["./src/server.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node18",
  outfile: "./dist/bundle.cjs",
});
