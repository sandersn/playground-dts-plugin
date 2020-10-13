import type { PlaygroundPlugin, PluginUtils } from "./vendor/playground"

let g = "// NOT DONE YET";
const makePlugin = (utils: PluginUtils) => {
  const customPlugin: PlaygroundPlugin = {
    id: "dtshelper",
    displayName: "d.ts helper",
    didMount: async (sandbox, container) => {
      console.log("Showing new plugin")

      // Create a design system object to handle
      // making DOM elements which fit the playground (and handle mobile/light/dark etc)
      const ds = utils.createDesignSystem(container)

      ds.title("Example Plugin")
      ds.p("This plugin has a button which changes the text in the editor, click below to test it")

      const startButton = document.createElement("input")
      startButton.type = "button"
      startButton.value = "Change the code in the editor"
      const name = document.createElement("input")
      name.type = "input"
      name.value = "react"
      container.appendChild(name)
      container.appendChild(startButton)

      startButton.onclick = async () => {
        // typescriptlang.org/dev/typescript-vfs
        sandbox.setText(`// FETCHING ${name.value} ...`)
        const response = await fetch(`https://unpkg.com/${name.value}/?meta`)
        if (!response.ok) {
          sandbox.setText("// NOPE: " + response.statusText)
        }
        else {
          var o = await response.json()
          // TODO: Next step is to find the entry point in package.json
          // Then load all the js files from:
          // var jss = flab(o).filter(f => f.endsWith('.js'))
          // then create a vfs and pass it all to typescript
          sandbox.setText(JSON.stringify(o, undefined, 2))
        }
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

/// find index.js from package.json or whatever
function main(ufs: UnpkgFS) {
  
}

export default makePlugin
