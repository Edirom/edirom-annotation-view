
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
        :host {
            --primary-color: #a3a3a3ff;
            --secondary-color: #565656ff;
            height: 100%;
            width: 100%;
            max-width: 100%;
            max-height: 100%;
            overflow-y: auto;
            overflow-x: auto;
            display: block;
        }

        #annotation-view-container {
            width: 100%;
            max-width: 100%;
        }

        #annotations-header {
            text-align: center;
            font-size: 1.4rem;
        }

        #annotations-container {
            padding-left: 10px;
            padding-right: 10px;
        }
        .card {
            border: 1px solid #ccc;
            border-radius: 15px;
            margin-bottom: 15px;
            display: flex;
            align-items: stretch;
            box-shadow: rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px;
        }
        .pos-col {
            min-width: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
            border-right: 1px solid #ccc;
            border-top-left-radius: 15px;
            border-bottom-left-radius: 15px;
            background-color: #f9f9f9;
        }
        .content-col {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        .title-row {
            border-bottom: 1px solid #ccc;
            padding: 10px;
            font-weight: bold;
        }
        .details-row {
            display: flex;
            flex-direction: row;
            padding: 10px;
        }
        .details-item {
            flex: 1;
            text-align: center;
            font-size: 0.9rem;
        }
        .details-item:first-child {
            text-align: left;
        }
        .details-item:last-child {
            text-align: right;
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
        const container = this.shadow.getElementById("annotation-view-container");
        if (!container) return;
        container.innerHTML = '';

        if (this.mode === 'mobile') {
            let annotationsHeader = document.createElement('h2');
            annotationsHeader.textContent = 'Anmerkungen';
            annotationsHeader.id = 'annotations-header';
            container.appendChild(annotationsHeader);
            let annotationsContainerElement = document.createElement('div');
            annotationsContainerElement.id = 'annotations-container';
            this.annotationsData.forEach(annotation => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="pos-col">${annotation.pos}</div>
                    <div class="content-col">
                        <div class="title-row">${annotation.title}</div>
                        <div class="details-row">
                            <div class="details-item">${annotation.categories}</div>
                            <div class="details-item">Prio. ${annotation.priority}</div>
                            <div class="details-item">${annotation.sigla}</div>
                        </div>
                    </div>
                `;
                annotationsContainerElement.appendChild(card);
            });
            container.appendChild(annotationsContainerElement);
        } else {
            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';

            const thead = document.createElement('thead');
            const tr = document.createElement('tr');
            ['Nr.', 'Titel', 'Kategorien', 'Priorität', 'Quelle'].forEach(text => {
                const th = document.createElement('th');
                th.textContent = text;
                th.style.border = '1px solid #ccc';
                th.style.padding = '8px';
                th.style.textAlign = 'left';
                tr.appendChild(th);
            });
            thead.appendChild(tr);
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            this.annotationsData.forEach(annotation => {
                const row = document.createElement('tr');
                [annotation.pos, annotation.title, annotation.categories, annotation.priority, annotation.sigla].forEach(text => {
                    const td = document.createElement('td');
                    td.textContent = text;
                    td.style.border = '1px solid #ccc';
                    td.style.padding = '8px';
                    row.appendChild(td);
                });
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
            container.appendChild(table);
        }
    }
}

customElements.define("edirom-annotation-view", annotationViewElement)
