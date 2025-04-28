const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const recast = require("recast");
const parser = require("@babel/parser");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: "<YOUR_OPENAI_API_KEY>",
});

const parseOptions = {
  parser: {
    parse(src) {
      return parser.parse(src, {
        sourceType: "module",
        plugins: ["classProperties", "objectRestSpread"],
      });
    },
  },
};

function print(node) {
  return recast.print(node).code;
}

function evalSafely(code) {
  try {
    return Function(`'use strict'; return (${code});`)();
  } catch {
    return null;
  }
}

function transformInputSchema(node) {
  const raw  = print(node);
  const orig = evalSafely(raw) || {};

  const required = Array.isArray(orig.required)
    ? orig.required.filter((k) => k !== "stack_api_key")
    : [];

  const props = {};
  Object.entries(orig.properties || {}).forEach(([key, val]) => {
    if (key === "stack_api_key") return;

    const out = {};
    if (val.type        !== undefined) out.type        = val.type;
    if (val.description !== undefined) out.description = val.description;
    if (val.default     !== undefined) {
      if (typeof val.default === "string") {
        const m = val.default.match(/^\{\(([^|]+)\|\|[^)]+\)\}$/);
        out.default = m ? m[1] : val.default;
      } else {
        out.default = val.default;
      }
    }

    if (key === "entry_data") {
      out.type        = "object";
      out.description =
        "The fields should be wrapped by an entry object {'entry':{...data}}";
      delete out.default;                  
    }

    props[key] = out;
  });

  return { type: "object", required, properties: props };
}


async function enhanceDescription(origDesc, inputSchema) {
  const system = `
Persona
You are a senior content architect and headless-CMS consultant with deep expertise in Contentstack (CS)—covering its CMS, Automation Hub, Launch, EDGE, AI, personalization and Marketplace, plus REST & GraphQL APIs, CLI and SDKs.

Mission
Improve description fields for Contentstack MCP tool which will be used by an AI agent. The description should be technical, precise, and formal, avoiding unnecessary fluff.

Contentstack Context (assume by default)
1. Stack hierarchy → Stacks > Branches > Environments > Content Types > Entries.
2. Content Types often use Reference, Modular Block and Global Field groups to build pages.
3. Editors preview drafts in Live Preview before moving the entry's Workflow stage.
4. Localization matrix: fallback locale "en-us"; localized entries become independent when localised.
5. Delivery is via CS CDN; cache purges automatically on publish.
6. Field size guide: single-line ≤ 255 char; multi-line ≤ 50 kB; RTE ≤ 200 kB.
7. Use Markdown in RTE unless "allow_rich_text" is false.
8. Automation Hub recipes may post-process output—avoid exposing internal tool names to end-users.
9. Launch triggers builds on publish to "preview"; promote to "prod" after QA.
10. GraphQL rate-limit ≈ 200 req/min—craft queries efficiently.

Description Writing Rules
• Make this tehcinical and to be used as a tool calling descrption
• 1–2 semantically related keywords—no stuffing.
• Never truncate mid-word; honour field limits.
• Only provide the enhanced description noting else is required.
• ALSO KEEP IT FORMAL AND TECHINICAL, THIS DESCRIPTION WILL BE USED BY AN AI AGENT.
• Keep it precise and technical, avoid unnecessary fluff.
• AVOID USING "you" or "your"—use "the user", "the developer", or "for developer"


Workflow Commands (emit only on explicit user request)
CREATE_ENTRY • UPDATE_ENTRY:<uid> • SUBMIT_FOR_REVIEW:<uid> • PUBLISH:<uid>:<environment>

Formatting
Return pure text for the description field; no HTML, Markdown or JSON.
- start the sensetence with "This tool ..."
`;

  const user = `Original description:
${origDesc}

Input schema (context):
${JSON.stringify(inputSchema).slice(0, 600)} 
`;

  const chat = await openai.chat.completions.create({
    model: "gpt-4.1",
    temperature: 0.1,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  return chat.choices[0].message.content.trim();
}

const mapperSchema = {
  type: "object",
  properties: {
    apiUrl: { type: "string" },
    method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE"] },
    body: { type: "string" },
    queryParams: {
      type: "object",
      additionalProperties: { type: "string" },
    },
    params: {
      type: "object",
      additionalProperties: { type: "string" },
    },
  },
  required: ["apiUrl", "method"],
  additionalProperties: false,
};

function buildMapperPrompt(runSrc, inputKeys) {
  return `
  ### ROLE
  You are an expert JavaScript reverse-engineer.  
  Your job: read the \`run()\` method of a Contentstack Automation-Hub *Action* and
  emit a compact **ApiEndpointMapping** object.
  
  ### HOW TO THINK (do NOT output these notes)
  1. Locate the HTTP client call (\`fetch\`, \`axios\`, etc.).  
  2. Capture the HTTP **method**.  
  3. Note the variable assigned to **body**, if present (POST/PUT/PATCH only and NOT DELETE).  
  4. Build the **apiUrl** exactly as it appears *before* the request,  
     but strip the \`API_URL\` base var.  
  5. For each “\${variable}” segment still inside the path, add  
     \`params.{variable} = "{same variable}"\`.  
  6. For each query param appended (via \`URLSearchParams\` or string concat),  
     add \`queryParams.{key} = "{same key}"\`.  
  7. Return pure JSON—no markdown, no explanation.
  
  ### EXAMPLE A
  run():
    const apiUrl = \`\${API_URL}/v3/content_types/\${ct}/entries/\${id}\`;
    const res = await fetch(apiUrl, { method:"DELETE" });
  
  Expected mapper:
  {
    "apiUrl": "/v3/content_types/content_type/entries/entry_id",
    "method": "DELETE",
    "params": {
      "content_type": "content_type",
      "entry_id": "entry_id"
    }
  }
  
  ### EXAMPLE B
  run():
    const qs = new URLSearchParams();
    qs.append("locale", locale);
    qs.append("include_branch", include_branch);
    const apiUrl = \`\${API_URL}/v3/content_types/\${ct}/entries?\${qs}\`;
    await fetch(apiUrl, { method:"POST", body: entry_data });
  
  Expected mapper:
  {
    "apiUrl": "/v3/content_types/content_type/entries",
    "method": "POST",
    "body": "entry_data",
    "queryParams": {
      "locale": "locale",
      "include_branch": "include_branch"
    },
    "params": {
      "content_type": "content_type"
    }
  }
  
  ### YOUR TURN
  event.input keys → ${inputKeys.join(", ")}
  
  run():
  ${runSrc}
  `;
}

const mapperTool = {
  type: "function",
  function: {
    name: "emit_mapper",
    description: "Return the ApiEndpointMapping for this action",
    parameters: mapperSchema,
  },
};

function normaliseMapper(map, inputKeys) {
  const [pathPart, qs] = map.apiUrl.split("?");
  map.apiUrl = pathPart;

  if (qs && (!map.queryParams || Object.keys(map.queryParams).length === 0)) {
    map.queryParams = {};
    for (const kv of qs.split("&")) {
      const [k] = kv.split("=");
      map.queryParams[k] = inputKeys.includes(k) ? k : k;
    }
  }

  const placeholderRE = /\{?([a-zA-Z0-9_]+)\}?/g;
  const params = {};
  for (const match of map.apiUrl.matchAll(/\${([^}]+)}/g)) {
    const key = match[1];
    params[key] = key;
  }
  map.apiUrl = map.apiUrl.replace(placeholderRE, (m, p1) => p1);
  if (Object.keys(params).length) map.params = params;

  if (map.body && map.body.startsWith("{")) delete map.body;
  return map;
}

async function getMapperViaAI(runSrc, inputKeys) {
  const chat = await openai.chat.completions.create({
    model: "gpt-4.1",
    temperature: 0,
    tools: [mapperTool],
    tool_choice: { type: "function", function: { name: "emit_mapper" } },
    messages: [
      {
        role: "system",
        content:
          "Produce an ApiEndpointMapping object. Think through the steps but output only the JSON.",
      },
      { role: "user", content: buildMapperPrompt(runSrc, inputKeys) },
    ],
  });

  const call = chat.choices[0].message.tool_calls?.[0];
  if (!call || call.function.name !== "emit_mapper") {
    throw new Error("Model did not return a mapper tool call.");
  }

  const raw = JSON.parse(call.function.arguments);
  return normaliseMapper(raw, inputKeys);
}

function extractMetadata(ast) {
  let meta = null;

  recast.types.visit(ast, {
    visitClassDeclaration(p) {
      if (p.node.id.name !== "Action") return false;
      const res = {};
      for (const m of p.node.body.body) {
        if (m.type === "ClassProperty") {
          const key = m.key.name;
          if (key === "tool_title") res.name = evalSafely(print(m.value));
          if (key === "description")
            res.origDescription = evalSafely(print(m.value));
          if (key === "inputSchema")
            res.inputSchema = transformInputSchema(m.value);
        }
        if (m.type === "ClassMethod" && m.key.name === "run") {
          res.runSource = print(m);
        }
      }
      meta = res;
      return false;
    },
  });
  return meta;
}

async function processActionFile(filePath) {
  const code = await fsp.readFile(filePath, "utf-8");
  const ast = recast.parse(code, parseOptions);

  const meta = extractMetadata(ast);
  if (!meta || !meta.name) {
    console.warn(`⚠️  No Action metadata in ${filePath}`);
    return null;
  }

  const enhancedDesc = await enhanceDescription(
    meta.origDescription || "",
    meta.inputSchema
  );

  const allInputKeys = Object.keys(meta.inputSchema?.properties || {});
  const mapper = await getMapperViaAI(meta.runSource, allInputKeys);

  return {
    [meta.name]: {
      name: meta.name,
      description: enhancedDesc,
      mapper,
      inputSchema: meta.inputSchema,
    },
  };
}

async function walkAndBuild(srcRoot, outRoot) {
  const entries = await fsp.readdir(srcRoot, { withFileTypes: true });
  for (const dirEnt of entries) {
    if (!dirEnt.isDirectory()) continue;
    const group = dirEnt.name;
    const actionsDir = path.join(srcRoot, group, "actions");
    if (!fs.existsSync(actionsDir)) continue;

    const result = {};
    const files = (await fsp.readdir(actionsDir)).filter((f) =>
      f.endsWith(".js")
    );

    for (const f of files) {
      const fp = path.join(actionsDir, f);
      const data = await processActionFile(fp);
      if (data) Object.assign(result, data);
    }

    if (Object.keys(result).length) {
      await fsp.mkdir(outRoot, { recursive: true });
      const outPath = path.join(outRoot, `${group}.json`);
      await fsp.writeFile(outPath, JSON.stringify(result, null, 2));
      console.log(`✅  Wrote ${outPath}`);
    }
  }
}

(async () => {
  const [, , srcDir, outDir] = process.argv;
  if (!srcDir || !outDir) {
    console.error("Usage: node generate_contentstack_tools.js <src> <out>");
    process.exit(1);
  }

  await walkAndBuild(path.resolve(srcDir), path.resolve(outDir));
})();
