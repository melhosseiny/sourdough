const script_id = Math.random();

export function web_component(spec) {
  const get_spec = () => spec;

  const state = new Proxy(spec, {
    get: function(obj, prop) {
      //console.log(obj, prop, obj[prop]);
      return obj[prop];
    },
    set: function(obj, prop, value) {
      console.log("set", obj, prop, value);
      obj[prop] = value;
      console.log("spec", spec);
      render(prop);
      console.log(spec._root.component);
      if (spec._root.component.effects) {
        console.log('cleanup', spec._root.component.cleanup_effects);
        if (spec._root.component.cleanup_effects) {
          spec._root.component.cleanup_effects();
        }
        spec._root.component.effects();
      }
      return true;
    }
  });

  const render = (prop) => {
    if (spec.clone) {
      re_render(prop);
      return;
    }
    //console.log(spec._template);
    //const regex = /\$\{([^{}:\s]+)\}/g;
    //const expressions = [...spec._template.toString().matchAll(regex)].map(match => match[1]);
    //console.log(expressions);
    [spec.clone, spec.map] = spec._template(spec);
    //console.log('render', prop, spec.clone);
    spec._root.shadowRoot.appendChild(spec.clone);
    //spec.clone = spec._root.shadowRoot;
    //console.log('dsds', spec._root.shadowRoot);
  }

  const re_render = (prop) => {
    //console.log('re_rendering', prop, spec._template, spec);
    const [new_clone, new_map] = spec._template(spec);
    //console.log(prop, spec.clone, new_clone, spec.map, new_map);
    //console.log(spec.map.get(prop), new_map.get(prop));
    //console.log(spec._root.shadowRoot.querySelectorAll('[ref]')[0] === spec.map[prop]);
    spec.map.get(prop).replaceWith(new_map.get(prop));
    spec.map = new_map;
  }

  const cleanup_effects = () => {}

  const effects = () => {
    return () => {}
  }

  const adopt_styles = (sheets) => {
    spec._root.shadowRoot.adoptedStyleSheets = [...spec._root.shadowRoot.adoptedStyleSheets, ...sheets];
  }

  return Object.freeze({
    state,
    get_spec,
    render,
    cleanup_effects,
    effects,
    adopt_styles
  })
}

export function html(strings, ...values) {
  //console.log(strings, values);
  const html_str = strings.reduce((result, string, i) => {
    return `${result}${string}${values[i] || ''}`;
  }, '');
  const dom_fragment = fragment_from_string(html_str);
  //console.log(dom_fragment);
  const map = new Map();
  const els = dom_fragment.querySelectorAll('[ref]');
  els.forEach(el => {
    const ref = el.getAttribute('ref');
    const deps = ref.split(' ');
    deps.forEach(dep => {
      map.set(dep, el);
    })
  });
  //console.log('dom_fragment', html_str, dom_fragment, map);
  return [dom_fragment, map];
}

function fragment_from_string(strHTML) {
  var temp = document.createElement('template');
  temp.innerHTML = strHTML;
  return temp.content;
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

const get_css_text = stylesheet => {
  const rules = [];

  for (let i = 0; i < stylesheet.rules.length; i++) {
    rules.push(stylesheet.rules[i].cssText);
  }

  return rules.join('');
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
