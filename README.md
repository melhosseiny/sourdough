# Flare

![](https://github.com/melhosseiny/sourdough/blob/3d0a00c0de64b37cd2de4f72311e3ea4a348bb80/repo.png)

[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https://raw.githubusercontent.com/melhosseiny/sourdough/main/sourdough.js)

## Guide

1. [Functional web components](https://warm-dawn.deno.dev/composing-user-interfaces-without-frameworks-part-1)

## How to write a component

`components/hello_world.js`

    import { html, state, web_component, define_component } from "sourdough";

    const template = (data) => html`
      <p>Hello, World!</p>
    `

    const style = `
      p { color: magenta; }
    `;

    export function hello_world(spec) {
      let { _root } = spec;
      const _web_component = web_component(spec);
      const _state = state(spec);

      const effects = () => {
        // add event listeners
      }

      // component methods

      return Object.freeze({
        ..._web_component
        effects
      })
    }

    define_component({
      name: "hello-world",
      component: hello_world,
      template,
      style,
      props: []
    );

`index.html`

    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>My app</title>
        <script type="importmap">
          {
            "imports": {
              "sourdough": "https://busy-dog-44.deno.dev/melhosseiny/sourdough/main/sourdough.js"
            }
          }
        </script>
      </head>
      <body>
        <hello-world></hello-world>
        <script type="module">
          import { hello_world } from "./components/hello_world.js";
        </script>
      </body>
    </html>
