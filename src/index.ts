import type { PlaygroundPlugin, PluginUtils } from "./vendor/playground"

let g = "// NOT DONE YET";
const makePlugin = (utils: PluginUtils) => {
  const customPlugin: PlaygroundPlugin = {
    id: "dtshelper",
    displayName: "d.ts helper",
    didMount: async (sandbox, container) => {
      console.log("Showing new plugin")
      const options = { ...sandbox.getCompilerOptions(), allowJs: true, checkJs: true };
      const { createSystem, createDefaultMapFromCDN, createVirtualCompilerHost } = sandbox.tsvfs
      // TODO: May need to allow user to configure which libs to include
      const fsMap = await createDefaultMapFromCDN(options, sandbox.ts.version, true, sandbox.ts)

      // Create a design system object to handle
      // making DOM elements which fit the playground (and handle mobile/light/dark etc)
      const ds = utils.createDesignSystem(container)

      ds.title("Generate d.ts from JS")
      ds.p("Put the name of an npm package to generate a d.ts from it")

      const startButton = document.createElement("input")
      startButton.type = "button"
      startButton.value = "Change the code in the editor"
      const name = document.createElement("input")
      name.type = "input"
      name.value = "react"
      container.appendChild(name)
      container.appendChild(startButton)

      startButton.onclick = async () => {
        // const o: UnpkgFS = await jfetch(`https://unpkg.com/${name.value}/?meta`, sandbox.setText)
        // var jss = flab(o).filter(f => f.endsWith('.js'))

        const p = await jfetch(`https://unpkg.com/${name.value}/package.json`, sandbox.setText)
        const main = "/" + p.main;
        const indexjs = await jfetch(`https://unpkg.com/${name.value}${main}`, sandbox.setText, /*returnText*/ true)
        fsMap.set(main, indexjs)
        const system = createSystem(fsMap)
        const host = createVirtualCompilerHost(system, options, sandbox.ts)
        const program = sandbox.ts.createProgram({
          rootNames: [main],
          options,
          host: host.compilerHost
        })
        console.log('after creating program')
        const sourceFile = program.getSourceFile(main)
        program.emit(sourceFile, undefined, undefined, true)
        sandbox.setText(system.readFile("/index.d.ts"))
      }
    },

    // This is called occasionally as text changes in monaco,
    // it does not directly map 1 keyup to once run of the function
    // because it is intentionally called at most once every 0.3 seconds
    // and then will always run at the end.
    modelChangedDebounce: async (_sandbox, _model) => {
      // Do some work with the new text
    },

    // Gives you a chance to remove anything set up,
    // the container itself if wiped of children after this.
    didUnmount: () => {
      console.log("De-focusing plugin")
    },
  }

  return customPlugin
}

type UnpkgFS = {
  type: "directory",
  path: string,
  files: UnpkgFS[]
} | {
  type: "file",
  path: string,
  contentType: "application/javascript" | "application/json" | string,
  integrity: string,
  lastModified: string,
  size: string
}

async function jfetch(url: string, log: (s: string) => void, returnText?: boolean) {
  log(`// FETCHING ${url} ...`)
  const response = await fetch(url)
  if (!response.ok) {
    log("// NOPE: " + response.statusText)
    return {}
  }
  else {
    return returnText ? response.text() : response.json()
  }
}

/// a flat list of files from the unpkg fs
function flab(ufs: UnpkgFS): string[] {
  if (ufs.type === "file")
    return [ufs.path]
  else
    return flatMap(ufs.files, flab)
}

function flatMap<T, U>(l: T[], f: (t: T) => U[]): U[] {
  if (Array.prototype.hasOwnProperty('flatMap'))
    return (Array.prototype as any).flatMap.call(l, f)
  const acc = []
  for (const x of l)
    acc.push(...f(x))
  return acc
}

export default makePlugin
