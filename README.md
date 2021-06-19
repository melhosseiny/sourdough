# Sourdough

Experimental web component framework for modern browsers

`components/hello_world.mjs`

    import { html, state, web_component, define_component } from '@melhosseiny/sourdough';

    const style = `
      p { color: magenta; }
    `;

    const template = (data) => html`
      <p>Hello, World!</p>
    `

    export function hello_world(spec) {
      let { _root } = spec;
      const _state = state(spec);
      const _web_component = web_component(spec);

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
      name: 'hello-world',
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
          import { hello_world } from './components/hello_world.mjs';
        </script>
      </body>
    </html>
