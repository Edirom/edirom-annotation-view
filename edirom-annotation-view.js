
import '../edirom-core-web-components/src/edirom-icon.js';

const templates = {
    desktop: `
<div>
    <style>
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
            vertical-align: middle;
        }
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
            cursor: pointer;
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
            align-items: center;
        }
        .details-item {
            flex: 1;
            font-size: 0.9rem;
        }
        .details-item edirom-icon {
            vertical-align: middle;
            margin-right: 2px;
        }
        .details-item:first-child {
            text-align: left;
        }
        .details-item:nth-child(2) {
            text-align: center;
        }
        .details-item:last-child {
            text-align: right;
        }

        #annotation-detail-container {
            padding-left: 10px;
            padding-right: 10px;
        }

        #annotation-detail-container h1 {
            font-size: 1.3rem;
            text-align: center;
            margin-bottom: 13px;
        }
        #annotation-detail-container .details-row {
            color: rgba(0, 0, 0, 0.4);
            padding-top: 0;
        }

        #annotation-detail-container h2 {
            font-size: 1.0rem;
            font-weight: 500;
            margin-top: 19px;
            margin-bottom: 8px;
        }

        #annotation-detail-container .preview-image {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0 auto 10px auto;
        }
    </style>
    <div id="annotation-view-container">
    </div>
</div>
`
};


class annotationViewElement extends HTMLElement {
    // Private backing field for currentPage state
    #currentPage = 'annotations';

    constructor() {
        super();
        this.mode = this.getLayoutMode(this.getAttribute('layout-mode'));
        this.shadow = this.attachShadow({ mode: "open" });
        this.annotationsData = [];
        this.annotationData = {};
        // Image server type: 'openseadragon' (IIIF) or 'digilib'
        // Defaults to 'openseadragon' if not specified
        this.imageServer = this.getAttribute('image-server') || 'openseadragon';
        this.annotationsScrollTop = 0;

        // Event Listeners
    }

    // Property getter/setter with attribute reflection (best practice for Web Components)
    get currentPage() {
        return this.#currentPage;
    }

    set currentPage(value) {
        this.switchPage(value);
    }

    static get observedAttributes() {
        return ['layout-mode', 'annotations-data', 'annotation-data', 'image-server', 'current-page'];
    }

    // Gets exectuted when the element is added to the DOM
    connectedCallback() {
        console.log("Annotation View connected to DOM.");
        this.mode = this.getLayoutMode(this.getAttribute('layout-mode'));
        this.applyTemplate();
        // Initialize from attribute or use default
        const initialPage = this.getAttribute('current-page') || 'annotations';
        this.#currentPage = initialPage; // Set directly to avoid triggering setter before render
        this.renderCurrentPage();
        this.addEventListener('back-request', this.handleBackRequest);
    }

    disconnectedCallback() {
        console.log("Annotation View disconnected from DOM.");
        this.removeEventListener('back-request', this.handleBackRequest);
    }

    // Wird ausgeführt, wenn Attributwert sich ändert und initial
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (name === "layout-mode") {
            this.mode = this.getLayoutMode(newValue);
            this.applyTemplate();
            this.switchPage(this.currentPage);
        }
        else if (name === "annotations-data") {
            this.annotationsData = newValue ? JSON.parse(newValue) : [];
            if (this.currentPage === 'annotations') {
                this.renderAnnotations();
            }
        }
        else if (name === "annotation-data") {
            this.annotationData = JSON.parse(newValue);
            if (this.currentPage === 'annotation') {
                this.renderAnnotation();
            }
            this.dispatchEvent(new CustomEvent("annotation-data-changed", {
                detail: { annotationData: this.annotationData },
                bubbles: true,
                composed: true
            }));
        }
        else if (name === "image-server") {
            // Update image server type and re-render if annotation data exists
            this.imageServer = newValue || 'openseadragon';
            if (this.currentPage === 'annotation' && Object.keys(this.annotationData).length > 0) {
                this.renderAnnotation();
            }
        }
        else if (name === "current-page") {
            // Only call switchPage if attribute differs from internal state
            // (prevents double-call when switchPage itself updates the attribute)
            if (this.#currentPage !== newValue) {
                this.switchPage(newValue);
            }
        }
    }

    // Event handler for cancelable back requests from the host app
    handleBackRequest = (event) => {
        if (this.currentPage === 'annotations') {
            // Already on annotations list, allow default back behavior
            return;
        } else if (this.currentPage === 'annotation') {
            // On annotation detail page, go back to annotations list
            event.preventDefault();
            this.switchPage('annotations');
        }
    };

    // Central method for all page switching - handles validation, scroll, state, and rendering
    switchPage(page) {
        console.log("Switching to page:", page);
        const validPages = ['annotations', 'annotation'];

        // Invalid value: reset attribute to current valid page and return
        if (!validPages.includes(page)) {
            if (this.getAttribute('current-page') !== this.#currentPage) {
                this.setAttribute('current-page', this.#currentPage);
            }
            return;
        }

        // Save scroll position when leaving annotations page
        if (page === 'annotation' && this.#currentPage === 'annotations') {
            this.annotationsScrollTop = this.scrollTop;
        }

        // Update internal state
        this.#currentPage = page;

        // Reflect to attribute (allows external observation)
        if (this.getAttribute('current-page') !== page) {
            this.setAttribute('current-page', page);
        }

        // Render the new page
        this.renderCurrentPage();

        // Notify host app of page change
        this.dispatchEvent(new CustomEvent('current-page-changed', {
            bubbles: true,
            composed: true,
            detail: { value: page }
        }));
    }

    // Internal method to render based on current state
    renderCurrentPage() {
        if (this.currentPage === 'annotations') {
            this.renderAnnotations();
        } else if (this.currentPage === 'annotation') {
            this.renderAnnotation();
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
                card.setAttribute('data-annotation-id', annotation.id);
                card.addEventListener('click', () => {
                    this.dispatchEvent(new CustomEvent('annotation-selected', {
                        detail: {
                            annotationData: annotation
                        },
                        bubbles: true,
                        composed: true
                    }));
                });
                card.innerHTML = `
                    <div class="pos-col">${annotation.pos}</div>
                    <div class="content-col">
                        <div class="title-row">${annotation.title}</div>
                        <div class="details-row">
                            <div class="details-item">${annotation.categories}</div>
                            <div class="details-item">Prio. ${annotation.priority}</div>
                            <div class="details-item"><edirom-icon name='description' color="rgba(0, 0, 0, 0.2)" size="20"></edirom-icon>${annotation.sigla}</div>
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

        // Restore the scroll position of the annotations list when returning from details
        this.scrollTop = this.annotationsScrollTop;
    }

    renderAnnotation = () => {
        // Implementation for rendering a single annotation based on this.annotationData
        const container = this.shadow.getElementById("annotation-view-container");
        if (!container) return;

        container.innerHTML = '';

        if (this.mode === 'mobile') {
            let annotationDetailContainerElement = document.createElement('div');
            annotationDetailContainerElement.id = 'annotation-detail-container';
            annotationDetailContainerElement.innerHTML = `<h1>${this.annotationData.title}</h1>`

            let detailsRowElement = document.createElement('div');
            detailsRowElement.className = 'details-row';
            detailsRowElement.innerHTML = `
                <div class="details-item">${this.annotationData.categories}</div>
                <div class="details-item">Prio. ${this.annotationData.priority}</div>
                <div class="details-item"><edirom-icon name='description' color="rgba(0, 0, 0, 0.2)" size="20"></edirom-icon>${this.annotationData.sigla}</div>
            `;
            annotationDetailContainerElement.appendChild(detailsRowElement);

            let textElement = document.createElement('p');
            textElement.innerHTML = this.annotationData.text;
            annotationDetailContainerElement.appendChild(textElement);

            let previewsContainerElement = document.createElement('div');
            previewsContainerElement.id = 'previews-container';
            this.annotationData.previews.forEach(preview => {
                let previewContainerElement = document.createElement('div');
                previewContainerElement.className = 'preview-container';
                let previewHeaderElement = document.createElement('h2');
                previewHeaderElement.textContent = `${preview.siglum} (${preview.source}) ${preview.label}`;
                previewContainerElement.appendChild(previewHeaderElement);

                // Only render image if preview type is not 'text' (text previews have content instead of images)
                if (preview.type !== 'text') {
                    let previewImageElement = document.createElement('img');
                    previewImageElement.classList.add('preview-image');

                    // Build the image URL based on the configured image server type
                    // The two supported servers use different URL formats:
                    const previewImageSize = 600; // Target width in pixels for preview images
                    let imageSrc;

                    if (this.imageServer === 'digilib') {
                        // Digilib URL format:
                        // {digilibBaseParams}dw={width}&dh={height}{digilibSizeParams}
                        // - digilibBaseParams: Base URL with query parameters (ends with ? or &)
                        // - dw/dh: Target display dimensions
                        // - digilibSizeParams: Additional params for region selection (wx, wy, ww, wh, mo)
                        imageSrc = `${preview.digilibBaseParams}dw=${previewImageSize}&dh=${previewImageSize}${preview.digilibSizeParams}`;
                    } else {
                        // OpenSeadragon / IIIF Image API URL format:
                        // {baseUrl}/{x},{y},{width},{height}/{size},/0/default.jpg
                        // - digilibBaseParams: Base URL of the IIIF image server
                        //   (e.g., "https://digital.blb-karlsruhe.de/blbihd/i3f/v20/6295251")
                        // - hiddenData contains the region coordinates (x, y) and dimensions (width, height)
                        // - size: Target width (height is proportional, indicated by trailing comma)
                        // - 0: No rotation
                        // - default.jpg: Default quality, JPEG format
                        const { x, y, width, height } = preview.hiddenData;
                        imageSrc = `${preview.digilibBaseParams}/${x},${y},${width},${height}/${previewImageSize},/0/default.jpg`;
                    }

                    previewImageElement.src = imageSrc;
                    previewImageElement.alt = `${preview.siglum}: ${preview.label}`;
                    previewContainerElement.appendChild(previewImageElement);
                } else {
                    // For text-type previews, render the content as HTML
                    let previewContentElement = document.createElement('div');
                    previewContentElement.className = 'preview-content';
                    previewContentElement.innerHTML = preview.content;
                    previewContainerElement.appendChild(previewContentElement);
                }

                annotationDetailContainerElement.appendChild(previewContainerElement);
            });
            container.appendChild(annotationDetailContainerElement);
        }

        // Always start the detail view at the top
        this.scrollTop = 0;
    }

}

customElements.define("edirom-annotation-view", annotationViewElement)
