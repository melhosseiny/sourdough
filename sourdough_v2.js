const script_id = Math.random();

// util

/**
 * Uses HTMLTemplateElement.content to return a DocumentFragment given an HTML string
 * @param html_str HTML string
 * @return DocumentFragment representing the HTML string
 */
function fragment_from_string(html_str) {
  const template = document.createElement('template');
  template.innerHTML = html_str;
  return template.content;
}

/**
 * Constructs an adoptable stylesheet from a non-constructed one (e.g. from link el)
 * @param stylesheet a non-constructed stylesheet
 * @return a constructed stylesheet with the same rules
 */
export function get_constructed_style_sheet(stylesheet) {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(get_css_text(stylesheet));
  return sheet;
}

/**
 * Returns CSS string given a CSSStyleSheet object
 * @param stylesheet CSSStyleSheet object
 * @return CSS string
 */
function get_css_text(stylesheet) {
  const rules = [];

  for (let i = 0; i < stylesheet.cssRules.length; i++) {
    rules.push(stylesheet.cssRules[i].cssText);
  }

  return rules.join('');
}

/**
 * Returns child dependencies of a DOM node
 * @param node DOM element
 * @return array of dependencies
 */
function find_nested_deps(node) {
  const ref_els = [...node.querySelectorAll('[ref]')]
  const deps = ref_els.map(el => el.getAttribute('ref').split(' ')).flat();
  return [...new Set(deps)];
}

/**
 * Adds rendering logic to a functional web component
 * @param spec component data
 * @return frozen Object with component render functions
 */
export function web_component(spec) {
  const get_spec = () => spec;

  const render = (prop) => {
    // re_render instead if a DOMFragment exists
    if (spec.clone) {
      re_render(prop);
      return;
    }
    [spec.clone, spec.map] = spec._template(spec);
    console.log('render', prop, spec.clone, spec.map);
    // attach the DOMFragment to the component's ShadowRoot
    spec._root.shadowRoot.appendChild(spec.clone);
  }

  const re_render = (prop) => {
    const [new_clone, new_map] = spec._template(spec);
    console.log('re_render', prop, spec.clone, new_clone, spec.map, new_map);

    // use dependency map to make updates to shadow DOM
    spec.map.get(prop).forEach((el, i) => {
      const deps = el.getAttribute('ref').split(' ');
      // replace el with updated one from new DOMFragment
      el.replaceWith(new_map.get(prop)[i]);
      // update dependency map
      deps.forEach(dep => {
        // find nested dependencies
        const nested_deps = find_nested_deps(spec.map.get(dep)[i]);
        console.log('nested', dep, i, nested_deps);
        spec.map.get(dep)[i] = new_map.get(dep)[i];
        nested_deps.forEach(nested_dep => {
          spec.map.get(nested_dep)[i] = new_map.get(nested_dep)[i];
        })
      })
    });
  }

  const adopt_styles = (sheets) => {
    spec._root.shadowRoot.adoptedStyleSheets = [...spec._root.shadowRoot.adoptedStyleSheets, ...sheets];
  }

  return Object.freeze({
    get_spec,
    render,
    adopt_styles
  })
}

/**
 * Template tag that returns the interpolated string as a DOMFragment
 * and a dependency -> array of elements Map.
 *
 * Dependencies have be explicitly defined in the template by adding a
 * 'ref' attribute to the element, and an element can have multiple
 * dependencies (e.g., ref="a" or ref="a b").
 *
 * Dependencies can be nested, as long as they are different.
 *
 * @param strings array of string values in the template
 * @param values template expressions
 * @return array containing a DOMFragment and dependency map
 */
export function html(strings, ...values) {
  const html_str = strings.reduce((result, string, i) => {
    return `${result}${string}${values[i] || ''}`;
  }, '');
  console.log(html_str);
  const dom_fragment = fragment_from_string(html_str);

  const map = new Map();
  const els = dom_fragment.querySelectorAll("[ref]");

  els.forEach(el => {
    const deps = el.getAttribute('ref').split(' ');

    deps.forEach(dep => {
      map.set(dep, map.has(dep) ? [...map.get(dep), ...[el]] : [el]);
    })
  });
  console.log('html', dom_fragment, map);
  return [dom_fragment, map];
}

export function state(spec) {
  return new Proxy(spec, {
    get: function(obj, prop) {
      //console.log(obj, prop, obj[prop]);
      return obj[prop];
    },
    set: function(obj, prop, value) {
      console.log("set", obj, prop, value);
      obj[prop] = value;
      //console.log("spec", spec);
      spec._root.component.render(prop);
      //console.log(spec._root.component);
      if (spec._root.component.effects) {
        if (spec._root.component.cleanup_effects) {
          console.log(spec._root.component.cleanup_effects);
          spec._root.component.cleanup_effects();
        }
        spec._root.component.effects();
      }
      return true;
    }
  });
}

let shared_style_sheets = [];

export function set_shared_style_sheets(sheets) {
  try {
    const constructed_sheets = sheets.map(sheet => get_constructed_style_sheet(sheet));
    console.log(`${script_id}:set_shared_style_sheets`, constructed_sheets, shared_style_sheets);
    shared_style_sheets = [...constructed_sheets];
  } catch (error) {
    shared_style_sheets = sheets;
  }
}

export function define_component(opts) {
  customElements.define(
    opts.name,
    class CustomElement extends HTMLElement {
      static get observedAttributes() {
        return opts.props;
      }

      constructor() {
        //console.log("constructor");
        super();
        this.component = opts.component({ _root: this, _template: opts.template });
        this.attachShadow({ mode: 'open' });
      }

      style(style) {
        try {
          const sheet = new CSSStyleSheet();
          sheet.replaceSync(style);
          console.log(`${script_id}:${opts.name}:define_component:style`, shared_style_sheets);
          this.shadowRoot.adoptedStyleSheets = [...shared_style_sheets, sheet];
        } catch (error) {
          shared_style_sheets.forEach(sheet => {
            const style_el = document.createElement("style");
            style_el.innerHTML = sheet.href
              ? `@import "${sheet.href}"`
              : get_css_text(sheet);
            this.shadowRoot.appendChild(style_el);
          });

          const style_el = document.createElement("style");
          style_el.innerHTML = style;
          this.shadowRoot.appendChild(style_el);
        }
      }

      connectedCallback() {
        //console.log("connected");
        //console.log('render');
        this.component.render();
        //console.log('effects');
        if (this.component.effects) {
          this.component.effects();
          //console.log(this.cleanup_effects);
        }
        if (this.component.init) {
          //console.log('init', this.component, this.component.init);
          this.component.init();
        }
        this.style(opts.style);
      }

      attributeChangedCallback(name, oldValue, newValue) {
        //console.log(name, oldValue, newValue);
        this.component.get_spec()[name] = newValue;
      }
    }
  )
}

