import { APP_STORE_PATH } from "./constants";
import { getAppName } from "./utils/getAppName";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import prettierConfig from "@quillsocial/config/prettier-preset";
import { AppMeta } from "@quillsocial/types/App";
import chokidar from "chokidar";
import fs from "fs";
import { debounce } from "lodash";
import path from "path";
import prettier from "prettier";

let isInWatchMode = false;
if (process.argv[2] === "--watch") {
  isInWatchMode = true;
}

const formatOutput = (source: string) =>
  prettier.format(source, {
    parser: "typescript",
    ...prettierConfig,
  });

const getVariableName = function (appName: string) {
  return appName.replace(/[-.]/g, "_");
};

const getAppId = function (app: { name: string }) {
  // Handle stripe separately as it's an old app with different dirName than slug/appId
  return app.name === "stripepayment" ? "stripe" : app.name;
};

type App = Partial<AppMeta> & {
  name: string;
  path: string;
};

/**
 * Check if a file exports a specific function
 */
function checkFunctionExport(appPath: string, fileName: string, functionName: string): boolean {
  const filePath = path.join(APP_STORE_PATH, appPath, "lib", fileName);
  if (!fs.existsSync(filePath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    // Check for: export const post = or export async function post or export { post }
    const patterns = [
      new RegExp(`export\\s+(const|async\\s+function)\\s+${functionName}\\s*[=(]`),
      new RegExp(`export\\s*{[^}]*\\b${functionName}\\b[^}]*}`),
    ];
    return patterns.some(pattern => pattern.test(content));
  } catch (error) {
    return false;
  }
}

/**
 * Get the app slug from metadata
 */
function getAppSlug(app: App): string | null {
  const metadataPath = path.join(APP_STORE_PATH, app.path, "_metadata.ts");
  if (!fs.existsSync(metadataPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(metadataPath, "utf-8");
    const slugMatch = content.match(/slug:\s*["']([^"']+)["']/);
    return slugMatch ? slugMatch[1] : null;
  } catch (error) {
    return null;
  }
}

/**
 * Generate Post Registry file
 */
function generatePostRegistry(): string[] {
  const output: string[] = [];

  output.push(`/**
 * Post Function Registry
 *
 * Centralized registry for social media platform post functions.
 * This file is auto-generated. To add a new platform:
 * 1. Create a Manager file with \`export const post = async (postId: number) => {...}\`
 * 2. Run \`yarn app-store:build\` to regenerate this file
 */
`);

  const imports: string[] = [];
  const handlers: string[] = [];
  const appDirs: App[] = [];

  // Collect all app directories
  fs.readdirSync(APP_STORE_PATH).forEach(function (dir) {
    if (dir === "ee" || dir === "templates") {
      fs.readdirSync(path.join(APP_STORE_PATH, dir)).forEach(function (subDir) {
        if (fs.statSync(path.join(APP_STORE_PATH, dir, subDir)).isDirectory()) {
          if (getAppName(subDir)) {
            appDirs.push({
              name: subDir,
              path: path.join(dir, subDir),
            });
          }
        }
      });
    } else {
      if (fs.statSync(path.join(APP_STORE_PATH, dir)).isDirectory()) {
        if (!getAppName(dir)) {
          return;
        }
        appDirs.push({
          name: dir,
          path: dir,
        });
      }
    }
  });

  // Check each app for post function
  appDirs.forEach((app) => {
    const managerFiles = [
      `${app.name}Manager.ts`,
      "manager.ts",
      "index.ts",
    ];

    for (const managerFile of managerFiles) {
      if (checkFunctionExport(app.path, managerFile, "post")) {
        const slug = getAppSlug(app);
        if (slug) {
          const varName = `${getVariableName(app.name)}_Manager`;
          const importPath = `./${app.path.replace(/\\/g, "/")}/lib`;

          // Check if it's a default export or named export
          const indexPath = path.join(APP_STORE_PATH, app.path, "lib", "index.ts");
          if (fs.existsSync(indexPath)) {
            const indexContent = fs.readFileSync(indexPath, "utf-8");
            if (indexContent.includes(`export * as ${app.name.charAt(0).toUpperCase() + app.name.slice(1)}Manager`)) {
              imports.push(`import { ${app.name.charAt(0).toUpperCase() + app.name.slice(1)}Manager as ${varName} } from "${importPath}"`);
              handlers.push(`  "${slug}": ${varName}.post,`);
            } else if (indexContent.includes("export { post }")) {
              imports.push(`import { post as ${varName}_post } from "${importPath}"`);
              handlers.push(`  "${slug}": ${varName}_post,`);
            }
          }
        }
        break;
      }
    }
  });

  output.push(...imports);
  output.push("");
  output.push("/**");
  output.push(" * Type definition for a post handler function");
  output.push(" */");
  output.push("export type PostHandler = (postId: number) => Promise<any>;");
  output.push("");
  output.push("/**");
  output.push(" * Registry mapping app IDs to their post handler functions");
  output.push(" */");
  output.push("export const POST_HANDLERS: Record<string, PostHandler> = {");
  output.push(...handlers);
  output.push("};");
  output.push("");
  output.push("export function getPostHandler(appId: string): PostHandler | undefined {");
  output.push("  return POST_HANDLERS[appId];");
  output.push("}");
  output.push("");
  output.push("export function hasPostHandler(appId: string): boolean {");
  output.push("  return appId in POST_HANDLERS;");
  output.push("}");
  output.push("");
  output.push("export function getSupportedPostApps(): string[] {");
  output.push("  return Object.keys(POST_HANDLERS);");
  output.push("}");
  output.push("");
  output.push("export async function executePost(appId: string, postId: number): Promise<any> {");
  output.push("  const handler = getPostHandler(appId);");
  output.push("  if (!handler) {");
  output.push("    throw new Error(`Unsupported app: ${appId}. Supported apps: ${getSupportedPostApps().join(\", \")}`);");
  output.push("  }");
  output.push("  return handler(postId);");
  output.push("}");

  return output;
}

/**
 * Generate Comment Registry file
 */
function generateCommentRegistry(): string[] {
  const output: string[] = [];

  output.push(`/**
 * Comment/Reply Function Registry
 *
 * Centralized registry for social media platform comment/reply functions.
 * This file is auto-generated. To add a new platform:
 * 1. Create a reply/comment function with signature: (credentialId: number, parentId: string, content: string) => Promise<{success: boolean}>
 * 2. Run \`yarn app-store:build\` to regenerate this file
 */
`);

  const imports: string[] = [];
  const handlers: string[] = [];
  const unsupportedPlatforms: string[] = [];
  const appDirs: App[] = [];

  // Collect all app directories
  fs.readdirSync(APP_STORE_PATH).forEach(function (dir) {
    if (dir === "ee" || dir === "templates") {
      fs.readdirSync(path.join(APP_STORE_PATH, dir)).forEach(function (subDir) {
        if (fs.statSync(path.join(APP_STORE_PATH, dir, subDir)).isDirectory()) {
          if (getAppName(subDir)) {
            appDirs.push({
              name: subDir,
              path: path.join(dir, subDir),
            });
          }
        }
      });
    } else {
      if (fs.statSync(path.join(APP_STORE_PATH, dir)).isDirectory()) {
        if (!getAppName(dir)) {
          return;
        }
        appDirs.push({
          name: dir,
          path: dir,
        });
      }
    }
  });

  // Check each app for comment/reply functions
  appDirs.forEach((app) => {
    const slug = getAppSlug(app);
    if (!slug) return;

    const managerFiles = [
      `${app.name}Manager.ts`,
      "manager.ts",
      "twitterManager.ts", // Twitter/X specific
      "index.ts",
    ];

    let hasCommentFunction = false;

    for (const managerFile of managerFiles) {
      // Check for various comment/reply function names
      const functionNames = ["replyToTweet", "reply", "comment", "replyToPost", "addComment"];

      for (const funcName of functionNames) {
        if (checkFunctionExport(app.path, managerFile, funcName)) {
          const varName = `${getVariableName(app.name)}_${funcName}`;
          const importPath = `./${app.path.replace(/\\/g, "/")}/lib`;

          imports.push(`import { ${funcName} as ${varName} } from "${importPath}"`);
          handlers.push(`  "${slug}": ${varName},`);
          hasCommentFunction = true;
          break;
        }
      }

      if (hasCommentFunction) break;
    }

    // Track platforms without comment support (that have post but not comment)
    if (!hasCommentFunction) {
      const hasPost = managerFiles.some(file => checkFunctionExport(app.path, file, "post"));
      if (hasPost) {
        unsupportedPlatforms.push(slug);
      }
    }
  });

  output.push(...imports);
  output.push("");
  output.push("/**");
  output.push(" * Type definition for a comment handler function");
  output.push(" */");
  output.push("export type CommentHandler = (");
  output.push("  credentialId: number,");
  output.push("  parentId: string,");
  output.push("  content: string");
  output.push(") => Promise<{ success: boolean; [key: string]: any }>;");
  output.push("");
  output.push("/**");
  output.push(" * Registry mapping app IDs to their comment handler functions");
  output.push(" */");
  output.push("export const COMMENT_HANDLERS: Record<string, CommentHandler> = {");
  output.push(...handlers);
  output.push("};");
  output.push("");
  output.push("export function getCommentHandler(appId: string): CommentHandler | undefined {");
  output.push("  return COMMENT_HANDLERS[appId];");
  output.push("}");
  output.push("");
  output.push("export function hasCommentHandler(appId: string): boolean {");
  output.push("  return appId in COMMENT_HANDLERS;");
  output.push("}");
  output.push("");
  output.push("export function getSupportedCommentApps(): string[] {");
  output.push("  return Object.keys(COMMENT_HANDLERS);");
  output.push("}");
  output.push("");
  output.push("export async function executeComment(");
  output.push("  appId: string,");
  output.push("  credentialId: number,");
  output.push("  parentId: string,");
  output.push("  content: string");
  output.push("): Promise<{ success: boolean; [key: string]: any }> {");
  output.push("  const handler = getCommentHandler(appId);");
  output.push("  if (!handler) {");
  output.push("    throw new Error(`Comment not supported for app: ${appId}. Supported apps: ${getSupportedCommentApps().join(\", \")}`);");
  output.push("  }");
  output.push("  return handler(credentialId, parentId, content);");
  output.push("}");
  output.push("");

  // Generate unsupported platforms array
  output.push("export const PLATFORMS_WITHOUT_COMMENT_SUPPORT: readonly string[] = [");
  unsupportedPlatforms.forEach((slug, index) => {
    const comma = index < unsupportedPlatforms.length - 1 ? ',' : '';
    output.push(`  "${slug}"${comma}`);
  });
  output.push("];");

  return output;
}

function generateFiles() {
  const browserOutput = [`import dynamic from "next/dynamic"`];
  const metadataOutput = [];
  const schemasOutput = [];
  const appKeysSchemasOutput = [];
  const serverOutput = [];
  const appDirs: { name: string; path: string }[] = [];

  fs.readdirSync(`${APP_STORE_PATH}`).forEach(function (dir) {
    if (dir === "ee" || dir === "templates") {
      fs.readdirSync(path.join(APP_STORE_PATH, dir)).forEach(function (subDir) {
        if (fs.statSync(path.join(APP_STORE_PATH, dir, subDir)).isDirectory()) {
          if (getAppName(subDir)) {
            appDirs.push({
              name: subDir,
              path: path.join(dir, subDir),
            });
          }
        }
      });
    } else {
      if (fs.statSync(path.join(APP_STORE_PATH, dir)).isDirectory()) {
        if (!getAppName(dir)) {
          return;
        }
        appDirs.push({
          name: dir,
          path: dir,
        });
      }
    }
  });

  function forEachAppDir(callback: (arg: App) => void) {
    for (let i = 0; i < appDirs.length; i++) {
      const configPath = path.join(
        APP_STORE_PATH,
        appDirs[i].path,
        "config.json"
      );
      let app;

      if (fs.existsSync(configPath)) {
        app = JSON.parse(fs.readFileSync(configPath).toString());
      } else {
        app = {};
      }

      callback({
        ...app,
        name: appDirs[i].name,
        path: appDirs[i].path,
      });
    }
  }

  /**
   * Windows has paths with backslashes, so we need to replace them with forward slashes
   * .ts and .tsx files are imported without extensions
   * If a file has index.ts or index.tsx, it can be imported after removing the index.ts* part
   */
  function getModulePath(path: string, moduleName: string) {
    return (
      `./${path.replace(/\\/g, "/")}/` +
      moduleName
        .replace(/\/index\.ts|\/index\.tsx/, "")
        .replace(/\.tsx$|\.ts$/, "")
    );
  }

  type ImportConfig =
    | {
        fileToBeImported: string;
        importName?: string;
      }
    | [
        {
          fileToBeImported: string;
          importName?: string;
        },
        {
          fileToBeImported: string;
          importName: string;
        }
      ];

  /**
   * If importConfig is an array, only 2 items are allowed. First one is the main one and second one is the fallback
   */
  function getExportedObject(
    objectName: string,
    {
      lazyImport = false,
      importConfig,
      entryObjectKeyGetter = (app) => app.name,
    }: {
      lazyImport?: boolean;
      importConfig: ImportConfig;
      entryObjectKeyGetter?: (arg: App, importName?: string) => string;
    }
  ) {
    const output: string[] = [];

    const getLocalImportName = (
      app: { name: string },
      chosenConfig: ReturnType<typeof getChosenImportConfig>
    ) =>
      `${getVariableName(app.name)}_${getVariableName(
        chosenConfig.fileToBeImported
      )}`;

    const fileToBeImportedExists = (
      app: { path: string },
      chosenConfig: ReturnType<typeof getChosenImportConfig>
    ) =>
      fs.existsSync(
        path.join(APP_STORE_PATH, app.path, chosenConfig.fileToBeImported)
      );

    addImportStatements();
    createExportObject();

    return output;

    function addImportStatements() {
      forEachAppDir((app) => {
        const chosenConfig = getChosenImportConfig(importConfig, app);
        if (
          fileToBeImportedExists(app, chosenConfig) &&
          chosenConfig.importName
        ) {
          const importName = chosenConfig.importName;
          if (!lazyImport) {
            if (importName !== "default") {
              // Import with local alias that will be used by createExportObject
              output.push(
                `import { ${importName} as ${getLocalImportName(
                  app,
                  chosenConfig
                )} } from "${getModulePath(
                  app.path,
                  chosenConfig.fileToBeImported
                )}"`
              );
            } else {
              // Default Import
              output.push(
                `import ${getLocalImportName(
                  app,
                  chosenConfig
                )} from "${getModulePath(
                  app.path,
                  chosenConfig.fileToBeImported
                )}"`
              );
            }
          }
        }
      });
    }

    function createExportObject() {
      output.push(`export const ${objectName} = {`);

      forEachAppDir((app) => {
        const chosenConfig = getChosenImportConfig(importConfig, app);

        if (fileToBeImportedExists(app, chosenConfig)) {
          if (!lazyImport) {
            const key = entryObjectKeyGetter(app);
            output.push(`"${key}": ${getLocalImportName(app, chosenConfig)},`);
          } else {
            const key = entryObjectKeyGetter(app);
            if (chosenConfig.fileToBeImported.endsWith(".tsx")) {
              output.push(
                `"${key}": dynamic(() => import("${getModulePath(
                  app.path,
                  chosenConfig.fileToBeImported
                )}")),`
              );
            } else {
              output.push(
                `"${key}": import("${getModulePath(
                  app.path,
                  chosenConfig.fileToBeImported
                )}"),`
              );
            }
          }
        }
      });

      output.push(`};`);
    }

    function getChosenImportConfig(
      importConfig: ImportConfig,
      app: { path: string }
    ) {
      let chosenConfig;

      if (!(importConfig instanceof Array)) {
        chosenConfig = importConfig;
      } else {
        if (
          fs.existsSync(
            path.join(
              APP_STORE_PATH,
              app.path,
              importConfig[0].fileToBeImported
            )
          )
        ) {
          chosenConfig = importConfig[0];
        } else {
          chosenConfig = importConfig[1];
        }
      }
      return chosenConfig;
    }
  }

  serverOutput.push(
    ...getExportedObject("apiHandlers", {
      importConfig: {
        fileToBeImported: "api/index.ts",
      },
      lazyImport: true,
    })
  );

  metadataOutput.push(
    ...getExportedObject("appStoreMetadata", {
      // Try looking for config.json and if it's not found use _metadata.ts to generate appStoreMetadata
      importConfig: [
        {
          fileToBeImported: "config.json",
          importName: "default",
        },
        {
          fileToBeImported: "_metadata.ts",
          importName: "metadata",
        },
      ],
    })
  );

  schemasOutput.push(
    ...getExportedObject("appDataSchemas", {
      // Import path must have / even for windows and not \
      importConfig: {
        fileToBeImported: "zod.ts",
        importName: "appDataSchema",
      },
      // HACK: Key must be appId as this is used by eventType metadata and lookup is by appId
      // This can be removed once we rename the ids of apps like stripe to that of their app folder name
      entryObjectKeyGetter: (app) => getAppId(app),
    })
  );

  appKeysSchemasOutput.push(
    ...getExportedObject("appKeysSchemas", {
      importConfig: {
        fileToBeImported: "zod.ts",
        importName: "appKeysSchema",
      },
      // HACK: Key must be appId as this is used by eventType metadata and lookup is by appId
      // This can be removed once we rename the ids of apps like stripe to that of their app folder name
      entryObjectKeyGetter: (app) => getAppId(app),
    })
  );

  browserOutput.push(
    ...getExportedObject("InstallAppButtonMap", {
      importConfig: {
        fileToBeImported: "components/InstallAppButton.tsx",
      },
      lazyImport: true,
    })
  );

  // TODO: Make a component map creator that accepts ComponentName and does the rest.
  // TODO: dailyvideo has a slug of daily-video, so that mapping needs to be taken care of. But it is an old app, so it doesn't need AppSettings
  browserOutput.push(
    ...getExportedObject("AppSettingsComponentsMap", {
      importConfig: {
        fileToBeImported: "components/AppSettingsInterface.tsx",
      },
      lazyImport: true,
    })
  );

  browserOutput.push(
    ...getExportedObject("EventTypeAddonMap", {
      importConfig: {
        fileToBeImported: "components/EventTypeAppCardInterface.tsx",
      },
      lazyImport: true,
    })
  );

  // Generate Post Registry
  const postRegistryOutput = generatePostRegistry();

  // Generate Comment Registry
  const commentRegistryOutput = generateCommentRegistry();

  const banner = `/**
    This file is autogenerated using the command \`yarn app-store:build --watch\`.
    Don't modify this file manually.
**/
`;
  const filesToGenerate: [string, string[]][] = [
    ["apps.metadata.generated.ts", metadataOutput],
    ["apps.server.generated.ts", serverOutput],
    ["apps.browser.generated.tsx", browserOutput],
    ["apps.schemas.generated.ts", schemasOutput],
    ["apps.keys-schemas.generated.ts", appKeysSchemasOutput],
    ["postRegistry.generated.ts", postRegistryOutput],
    ["commentRegistry.generated.ts", commentRegistryOutput],
  ];
  filesToGenerate.forEach(([fileName, output]) => {
    fs.writeFileSync(
      `${APP_STORE_PATH}/${fileName}`,
      formatOutput(`${banner}${output.join("\n")}`)
    );
  });
  console.log(
    `Generated ${filesToGenerate.map(([fileName]) => fileName).join(", ")}`
  );
}

const debouncedGenerateFiles = debounce(generateFiles);

if (isInWatchMode) {
  chokidar
    .watch(APP_STORE_PATH)
    .on("addDir", (dirPath) => {
      const appName = getAppName(dirPath);
      if (appName) {
        console.log(`Added ${appName}`);
        debouncedGenerateFiles();
      }
    })
    .on("change", (filePath) => {
      if (filePath.endsWith("config.json")) {
        console.log("Config file changed");
        debouncedGenerateFiles();
      }
    })
    .on("unlinkDir", (dirPath) => {
      const appName = getAppName(dirPath);
      if (appName) {
        console.log(`Removed ${appName}`);
        debouncedGenerateFiles();
      }
    });
} else {
  generateFiles();
}
