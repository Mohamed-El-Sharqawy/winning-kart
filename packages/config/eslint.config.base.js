import tseslint from "typescript-eslint";

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/pages/*/*", "../../pages/*", "../../../pages/*"],
              message: "Locality rule: pages never import each other's internals. Promote to shared/ or a package."
            }
          ]
        }
      ]
    }
  }
);
