# sourdough 🥖

Compose user interfaces without frameworks using functional web components and native JavaScript modules

[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/busy-dog-44.deno.dev%2Fmelhosseiny%2Fsourdough%2Fmain%2Fsourdough.js)

`components/hello_world.js`

    import { html, state, web_component, define_component } from "https://busy-dog-44.deno.dev/melhosseiny/sourdough/main/sourdough.js";

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
        <title>Sourdough</title>
      </head>
      <body>
        <hello-world></hello-world>
        <script type="module">
          import { hello_world } from "./components/hello_world.js";
        </script>
      </body>
    </html>
