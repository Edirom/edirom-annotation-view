
console.log("Annotations Webcomponent loaded");

const template = document.createElement("template");
template.innerHTML = `
    <div>
        <style>
            
        </style>
        <div id="annotations-container">
           <p>TEST!</p>
        </div>
    </div>
`;

class annotationsViewElement extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
        this.shadow.append(template.content.cloneNode(true))
    }

    static get observedAttributes() {
        return [];
    }


    // Gets exectuted when the element is added to the DOM
    connectedCallback() {

    }

    disconnectedCallback() {
        console.log("Annotations View removed from DOM!");
    }

    // Wird ausgeführt, wenn Attributwert sich ändert und initial
    attributeChangedCallback(name, oldValue, newValue) {
        console.log(name, oldValue, newValue);
        if (oldValue === newValue) return;

    }
}

customElements.define("edirom-annotations-view", annotationsViewElement)
