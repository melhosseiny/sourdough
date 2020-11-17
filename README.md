# Sourdough

Experimental web component framework for modern browsers

`components/hello_world.mjs`

    import { html, state, web_component, define_component } from '@melhosseiny/sourdough';

    const style = fetch('./hello_world.css')
      .then(response => response.text());

    export const tmpl = (data) => html`
      <p>Hello, World!</p>
    `

    export function hello_world(spec) {
      let { _root } = spec;
      const _state = state(spec);
      const { get_spec, render } = web_component(spec);

      const init = async () => {
        _root.style(await style);
      }

      const effects = () => {
        // add event listeners
      }

      return Object.freeze({
        init,
        get_spec,
        render,
        effects
      })
    }

    define_component('hello-world', hello_world, tmpl);

`index.html`

    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>Sourdough</title>
      </head>
      <body>
        <hello-world></hello-world>
        <script type="module">
          import { hello_world } from './components/hello_world.mjs';
        </script>
      </body>
    </html>
