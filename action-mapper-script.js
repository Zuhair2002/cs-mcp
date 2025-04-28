import fs from "fs/promises";
import path from "path";
import * as acorn from "acorn";
import * as walk from "acorn-walk";
import OpenAI from "openai";

const SRC_DIR = path.resolve("../automations-connectors/contentstack/actions");
const OUTPUT = path.resolve("actions.json");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function extractMetadata(filePath) {
  const code = await fs.readFile(filePath, "utf-8");
  const ast = acorn.parse(code, {
    ecmaVersion: "latest",
    sourceType: "module",
  });
  let meta = { title: "", description: "", inputSchema: null };

  walk.simple(ast, {
    ClassBody(body) {
      for (const elt of body.body) {
        if (elt.type === "PropertyDefinition" && elt.static === false) {
          const key = elt.key.name || elt.key.value;
          if (key === "title" || key === "description") {
            meta[key] = elt.value.value;
          }
          if (key === "inputSchema") {
            const src = code.slice(elt.value.start, elt.value.end);
            /* eslint-disable no-new-func */
            meta.inputSchema = Function(`"use strict";return (${src});`)();
          }
        }
      }
    },
  });
  return { ...meta, code };
}

async function getMapperViaAI(source) {
  const system = `You are a senior JavaScript analyst specialising in Contentstack Automation Hub Actions.\n\nTASK: Given the full source code of an Action class, return **only** a valid JSON object named \
\`mapper\` with exactly these top‑level keys:\n\n  • apiUrl  – string (absolute or relative)\n  • method  – HTTP method in UPPERCASE\n  • body    – string | null (omit key if no body)\n  • queryParams – object whose keys/values map each query parameter name to the corresponding field name from \
\`event.input\`  \n  • params  – object whose keys/values map each dynamic path segment in \
\`apiUrl\` to the corresponding field name from \
\`event.input\`\n\nRULES:\n1. Derive **method**, **body**, and **apiUrl** by inspecting the \
\`fetch\` (or axios) call inside \`run()\`. Ignore headers.\n2. Build **apiUrl** exactly as it is constructed before the request is made, but replace any runtime variables with the symbolic token chosen in #3.\n3. For every template or string‑interpolated segment inside the path (e.g. \`content_type_name\`) create an entry inside **params** where the **key** is the placeholder text in the URL and the **value** is the matching \`event.input\` property.\n4. For every query parameter that is conditionally or unconditionally appended (via URLSearchParams, string concatenation, etc.) create an entry inside **queryParams** where both the **key** and **value** are the query parameter name.\n5. If the request sends a body (e.g. \`body: entry_data\`) set **body** to that field name; otherwise omit the key entirely.\n6. Return the JSON **without** any extra keys, comments, code fences, or Markdown – *only* the pure JSON object.`;

  const user = `### Action Source\n\n${source}\n\n### Desired Response Format\n{\n  \"apiUrl\": \"/v3/content_types/content_type_name/entries/entry_id\",\n  \"method\": \"DELETE\",\n  \"queryParams\": {\n    \"delete_all_localized\": \"delete_all_localized\"\n  },\n  \"params\": {\n    \"content_type_name\": \"content_type_name\",\n    \"entry_id\": \"entry_id\"\n  }\n}`;

  const chat = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const raw = chat.choices?.[0]?.message?.content?.trim();
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON returned for mapper: ${raw}`);
  }
}

function slug(name) {
  return name
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/\W+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

(async () => {
  const files = (await fs.readdir(SRC_DIR)).filter(
    (f) => f.endsWith(".js") || f.endsWith(".ts")
  );
  const manifest = {};

  for (const file of files) {
    const full = path.join(SRC_DIR, file);
    console.log(`Processing ${file} …`);
    try {
      const { title, description, inputSchema, code } = await extractMetadata(
        full
      );
      const mapper = await getMapperViaAI(code);

      const key = slug(title || path.parse(file).name);
      manifest[key] = {
        name: key,
        description,
        mapper,
        inputSchema,
      };
    } catch (err) {
      console.error(`❌ ${file}:`, err.message);
    }
  }

  await fs.writeFile(OUTPUT, JSON.stringify(manifest, null, 2));
  console.log(
    `✅ actions.json written with ${Object.keys(manifest).length} actions.`
  );
})();
