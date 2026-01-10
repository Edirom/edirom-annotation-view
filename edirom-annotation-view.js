
import '../edirom-core-web-components/src/edirom-icon.js';

const templates = {
    desktop: `
<div>
    <style>
    </style>
    <div id="annotation-view-container">
    </div>
</div>
`,

    mobile: `<div>
    <style>
        #annotation-view-container > *{
            width: 100%;
        }
    </style>
    <div id="annotation-view-container">
    </div>
</div>
`
};


class annotationViewElement extends HTMLElement {
    constructor() {
        super();
        this.mode = this.getLayoutMode(this.getAttribute('layout-mode'));
        this.shadow = this.attachShadow({ mode: "open" });
        this.annotationsData = [];

        // Event Listeners
    }

    static get observedAttributes() {
        return ['layout-mode', 'annotations-data'];
    }


    // Gets exectuted when the element is added to the DOM
    connectedCallback() {
        console.log("Annotation View connected to DOM.");
        this.mode = this.getLayoutMode(this.getAttribute('layout-mode'));
        this.applyTemplate();
        this.renderAnnotations();
    }

    disconnectedCallback() {
        console.log("Annotation View disconnected from DOM.");
    }

    // Wird ausgeführt, wenn Attributwert sich ändert und initial
    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`Attribute: ${name} changed from ${oldValue} to ${newValue}`);
        if (oldValue === newValue) return;
        if (name === "layout-mode") {
            this.mode = this.getLayoutMode(newValue);
            this.applyTemplate();
            this.renderAnnotations();
        }
        else if (name === "annotations-data") {
            this.annotationsData = JSON.parse(newValue);
            this.renderAnnotations();
        }

    }

    getLayoutMode = (layoutMode) => layoutMode === 'mobile' ? 'mobile' : 'desktop';

    applyTemplate = () => {
        const template = document.createElement("template");
        template.innerHTML = templates[this.mode];
        this.shadow.innerHTML = '';
        this.shadow.append(template.content.cloneNode(true));
    }

    renderAnnotations = () => {
        this.containerElement = this.shadow.getElementById("annotation-view-container");
        this.containerElement.innerHTML = '';
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tr = document.createElement('tr');
        const headers = ['Nr.', 'Titel', 'Kategorien', 'Priorität', 'Quelle'];

        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            tr.appendChild(th);
        });

        thead.appendChild(tr);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        this.annotationsData.forEach(annotation => {
            const row = document.createElement('tr');

            // Nr. (pos)
            const posTd = document.createElement('td');
            posTd.textContent = annotation.pos;
            row.appendChild(posTd);

            // Titel (title)
            const titleTd = document.createElement('td');
            titleTd.textContent = annotation.title;
            row.appendChild(titleTd);

            // Kategorien (categories)
            const categoriesTd = document.createElement('td');
            categoriesTd.textContent = annotation.categories;
            row.appendChild(categoriesTd);

            // Priorität (priority)
            const priorityTd = document.createElement('td');
            priorityTd.textContent = annotation.priority;
            row.appendChild(priorityTd);

            // Quelle (sigla)
            const siglaTd = document.createElement('td');
            siglaTd.textContent = annotation.sigla;
            row.appendChild(siglaTd);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        this.containerElement.appendChild(table);
    }
}

customElements.define("edirom-annotation-view", annotationViewElement)
