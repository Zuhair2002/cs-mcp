import eslintConfigPrettier from "eslint-config-prettier";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import "eslint-plugin-only-warn";

export default [
    { files: ["**/*.ts"] },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    eslintConfigPrettier,
    {
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            // allow unused vars with underscore prefix
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    destructuredArrayIgnorePattern: "^_",
                },
            ],
        },
    },
];
