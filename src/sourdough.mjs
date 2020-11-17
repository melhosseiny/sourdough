export function web_component(spec) {
  const get_spec = () => spec;

  const render = () => {
    spec._root.shadowRoot.innerHTML = spec._tmpl(spec);
  }

  const effects = () => {}

  const adopt_styles = (sheets) => {
    spec._root.shadowRoot.adoptedStyleSheets = [...spec._root.shadowRoot.adoptedStyleSheets, ...sheets];
  }

  return Object.freeze({
    get_spec,
    render,
    effects,
    adopt_styles
  })
}

export function html(strings, ...values) {
  //console.log(strings, values);
  return strings.reduce((result, string, i) => {
    return `${result}${string}${values[i] || ''}`;
  }, '');
}

function fragmentFromString(strHTML) {
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
      //console.log("set", obj, prop, value);
      obj[prop] = value;
      //console.log("spec", spec);
      spec._root.component.render();
      //console.log(spec._root.component);
      if (spec._root.component.effects) {
        spec._root.component.effects();
      }
      return true;
    }
  });
}

let shared_style_sheets = [];

function get_constructed_style_sheet(style_sheet) {
  const sheet = new CSSStyleSheet();
  const rules = [];

  for (let i = 0; i < style_sheet.rules.length; i++) {
    rules.push(style_sheet.rules[i].cssText);
  }
  console.log(rules.join());
  sheet.replaceSync(rules.join());
  return sheet;
}

export function set_shared_style_sheets(sheets) {
  const constructed_sheets = sheets.map(sheet => get_constructed_style_sheet(sheet));
  shared_style_sheets = [...constructed_sheets];
}

export function define_component(name, def, tmpl, props) {
  customElements.define(
    name,
    class CustomElement extends HTMLElement {
      static get observedAttributes() {
        return props;
      }

      constructor() {
        super();
        this.component = def({ _root: this, _tmpl: tmpl });
        this.attachShadow({ mode: 'open' });
      }

      style(style) {
        console.log('sheet')
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(style);
        this.shadowRoot.adoptedStyleSheets = [...shared_style_sheets, sheet];
      }

      connectedCallback() {
        //console.log("connected");
        this.component.render(this.component.get_spec());
        if (this.component.effects) {
          this.component.effects();
        }
        this.component.init();
      }

      attributeChangedCallback(name, oldValue, newValue) {
        //console.log(name, oldValue, newValue);
        this.component.get_spec()[name] = newValue;
      }
    }
  )
}
